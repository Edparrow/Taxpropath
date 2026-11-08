"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/admin/activity";

export type LoginState = { error: string | null };

const WRONG = "Wrong email or password, or this account has no admin access.";

/**
 * Admin sign-in. The password check is Supabase Auth's; on top of it the
 * account must have an active admin_users row. A customer account (or a
 * deactivated admin) is signed straight back out, and gets the same message
 * as a wrong password so the form doesn't reveal which emails are admins.
 */
export async function adminLogin(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: WRONG };

  const { data: admin } = await supabase
    .from("admin_users")
    .select("id, email, is_active")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!admin || !admin.is_active) {
    await supabase.auth.signOut();
    return { error: WRONG };
  }

  await logActivity(admin, "LOGIN", `${admin.email} signed in.`);
  redirect("/admin");
}
