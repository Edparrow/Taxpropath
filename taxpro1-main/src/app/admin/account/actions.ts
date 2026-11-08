"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { logActivity } from "@/lib/admin/activity";

export async function adminLogout() {
  const admin = await requireAdmin();
  await logActivity(admin, "LOGOUT", `${admin.email} signed out.`);
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin-login");
}

export type PasswordState = { error: string | null; done: boolean };

export async function changePassword(
  _prev: PasswordState,
  form: FormData,
): Promise<PasswordState> {
  const admin = await requireAdmin();
  const current = String(form.get("current_password") ?? "");
  const next = String(form.get("new_password") ?? "");
  const confirm = String(form.get("confirm_password") ?? "");

  if (next.length < 8) return { error: "The new password needs at least 8 characters.", done: false };
  if (!/[A-Za-z]/.test(next) || !/[0-9]/.test(next) || /\s/.test(next)) {
    return { error: "Use at least one letter and one number, and no spaces.", done: false };
  }
  if (next !== confirm) return { error: "The new passwords don't match.", done: false };
  if (next === current) return { error: "Choose a password different from the current one.", done: false };

  const supabase = await createClient();

  // Re-check the current password, so an unattended signed-in browser can't
  // be used to take the account over.
  const { error: wrong } = await supabase.auth.signInWithPassword({
    email: admin.email,
    password: current,
  });
  if (wrong) return { error: "The current password is wrong.", done: false };

  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) {
    console.error("[admin] password change failed", error);
    return { error: "Could not change the password. Please try again.", done: false };
  }

  await logActivity(admin, "CHANGE_PASSWORD", `${admin.email} changed their password.`);
  return { error: null, done: true };
}
