import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AdminUser = { id: string; email: string | null };

/**
 * Gate for every admin surface. Checks the role in the database rather than
 * anything client-supplied, so a forged cookie or crafted request can't get in.
 * Redirects instead of returning null — callers can't accidentally continue.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[admin-auth] role lookup failed", error);
    redirect("/");
  }
  // Fail closed: anything other than an explicit admin role is denied.
  if (profile?.role !== "admin") redirect("/");

  return { id: user.id, email: user.email ?? null };
}

/** Non-redirecting variant, for deciding whether to show the admin nav link. */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return data?.role === "admin";
}
