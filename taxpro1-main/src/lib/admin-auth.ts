import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  can,
  cleanPermissions,
  type AccessLevel,
  type AdminSection,
  type AdminUser,
} from "@/lib/admin/permissions";

export type { AdminUser } from "@/lib/admin/permissions";

/**
 * The signed-in admin, or null for visitors, customers and deactivated
 * admins. Read from admin_users on every request — never from anything the
 * browser sends — and cached so one request only looks it up once.
 */
export const getAdmin = cache(async (): Promise<AdminUser | null> => {
  const supabase = await createClient();

  // getClaims() verifies the session token's signature locally (against the
  // project's cached public keys) instead of asking the Auth server on every
  // page — one network round trip saved per admin page. Projects still on a
  // shared-secret key fall back to the Auth server automatically.
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("admin_users")
    // "*" rather than a column list, so a column added by a later migration
    // (role, from 0003) can never break admin sign-in before it has run.
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[admin-auth] admin lookup failed", error);
    return null;
  }
  if (!data || !data.is_active) return null;

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: (data.role as string | null | undefined) ?? null,
    isSuper: data.is_super,
    permissions: data.is_super ? {} : cleanPermissions(data.permissions),
  };
});

/**
 * Gate for every admin page and action. Not an admin → the admin login page.
 * An admin without this section (or without edit rights on it) → the
 * dashboard with a notice. Given several sections, any one of them is enough.
 * Redirects rather than returning null, so callers can't accidentally carry on.
 */
export async function requireAdmin(
  section?: AdminSection | AdminSection[],
  level: AccessLevel = "view",
): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin-login");
  if (section) {
    const sections = Array.isArray(section) ? section : [section];
    if (!sections.some((s) => can(admin, s, level))) {
      redirect(`/admin?denied=${sections[0]}`);
    }
  }
  return admin;
}

/** Super Admin only: managing other admins. */
export async function requireSuperAdmin(): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin-login");
  if (!admin.isSuper) redirect("/admin?denied=access");
  return admin;
}
