"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/admin/activity";
import { ADMIN_SECTIONS, cleanPermissions } from "@/lib/admin/permissions";

/*
 * Managing admins is Super Admin only. admin_users has no write policies, so
 * these go through the service role — requireSuperAdmin() is the lock.
 */

export type AccessState = { error: string | null };

/** SkillSync's rule: 8+ characters with at least one letter and one number, no spaces. */
function passwordProblem(password: string): string | null {
  if (password.length < 8) return "The password needs at least 8 characters.";
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "The password needs at least one letter and one number.";
  }
  if (/\s/.test(password)) return "The password can't contain spaces.";
  return null;
}

const readRole = (form: FormData) => String(form.get("role") ?? "").trim().slice(0, 60) || null;

function readPermissions(form: FormData) {
  const raw: Record<string, string> = {};
  for (const section of ADMIN_SECTIONS) {
    const level = String(form.get(`perm_${section.key}`) ?? "none");
    if (level !== "none") raw[section.key] = level;
  }
  return cleanPermissions(raw);
}

/** Is `adminId` the last active Super Admin? Removing it would lock everyone out. */
async function isLastSuper(adminId: string): Promise<boolean> {
  const db = createAdminClient();
  const { data } = await db
    .from("admin_users")
    .select("id")
    .eq("is_super", true)
    .eq("is_active", true);
  const supers = data ?? [];
  return supers.length === 1 && supers[0].id === adminId;
}

export async function createAdminUser(_prev: AccessState, form: FormData): Promise<AccessState> {
  const me = await requireSuperAdmin();

  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const isSuper = form.get("is_super") === "on";
  const isActive = form.get("is_active") === "on";

  if (!name) return { error: "Name is required." };
  if (!email.includes("@")) return { error: "A valid email is required." };
  const weak = passwordProblem(password);
  if (weak) return { error: weak };

  const db = createAdminClient();

  // A dedicated login. No `site` marker, so no customer profile is made for it.
  const { data: created, error: authError } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, admin_account: true },
  });
  if (authError || !created.user) {
    if (authError?.code === "email_exists" || /already/i.test(authError?.message ?? "")) {
      return {
        error:
          "This email already has a login (a customer, or the other website sharing this database). Use a different email for the admin.",
      };
    }
    console.error("[access] auth user create failed", authError);
    return { error: "Could not create the login. Please try again." };
  }

  const { error } = await db.from("admin_users").insert({
    id: created.user.id,
    name,
    email,
    role: readRole(form),
    is_super: isSuper,
    is_active: isActive,
    permissions: isSuper ? {} : readPermissions(form),
    created_by: me.id,
  });
  if (error) {
    console.error("[access] admin insert failed", error);
    await db.auth.admin.deleteUser(created.user.id);
    return { error: "Could not save the admin. Please try again." };
  }

  await logActivity(me, "CREATE_ADMIN", `Created admin ${name} (${email})${isSuper ? " as Super Admin" : ""}.`, {
    type: "admin",
    id: created.user.id,
  });
  revalidatePath("/admin/access");
  redirect("/admin/access");
}

export async function updateAdminUser(
  adminId: string,
  _prev: AccessState,
  form: FormData,
): Promise<AccessState> {
  const me = await requireSuperAdmin();

  const name = String(form.get("name") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const isSuper = form.get("is_super") === "on";
  const isActive = form.get("is_active") === "on";

  if (!name) return { error: "Name is required." };
  if (password) {
    const weak = passwordProblem(password);
    if (weak) return { error: `${weak} (Or leave it empty to keep the current one.)` };
  }
  if ((!isSuper || !isActive) && (await isLastSuper(adminId))) {
    return { error: "This is the only active Super Admin. Make someone else Super Admin first." };
  }

  const db = createAdminClient();
  const { data: before } = await db
    .from("admin_users")
    .select("email")
    .eq("id", adminId)
    .maybeSingle();
  if (!before) return { error: "That admin no longer exists." };

  const { error } = await db
    .from("admin_users")
    .update({
      name,
      role: readRole(form),
      is_super: isSuper,
      is_active: isActive,
      permissions: isSuper ? {} : readPermissions(form),
      updated_at: new Date().toISOString(),
    })
    .eq("id", adminId);
  if (error) {
    console.error("[access] admin update failed", error);
    return { error: "Could not save the changes. Please try again." };
  }

  if (password) {
    const { error: pwError } = await db.auth.admin.updateUserById(adminId, { password });
    if (pwError) {
      console.error("[access] password reset failed", pwError);
      return { error: "Saved, but the new password could not be set." };
    }
  }

  await logActivity(
    me,
    "UPDATE_ADMIN",
    `Updated admin ${name} (${before.email})${password ? ", password reset" : ""}${isActive ? "" : ", deactivated"}.`,
    { type: "admin", id: adminId },
  );
  revalidatePath("/admin/access");
  redirect("/admin/access");
}

/**
 * Takes admin access away. The login itself stays (it may also be someone's
 * customer account), it just no longer opens the panel.
 */
export async function deleteAdminUser(form: FormData) {
  const me = await requireSuperAdmin();
  const adminId = String(form.get("id") ?? "");
  if (!adminId || adminId === me.id) return;
  if (await isLastSuper(adminId)) return;

  const db = createAdminClient();
  const { data: row } = await db
    .from("admin_users")
    .delete()
    .eq("id", adminId)
    .select("name, email")
    .maybeSingle();

  if (row) {
    await logActivity(me, "DELETE_ADMIN", `Removed admin ${row.name} (${row.email}).`, {
      type: "admin",
      id: adminId,
    });
  }
  revalidatePath("/admin/access");
}
