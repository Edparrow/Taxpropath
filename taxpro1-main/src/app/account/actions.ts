"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { PROFILE_FIELDS, getCustomer } from "@/lib/account";

export type FormState = { error: string | null; done: boolean };

const MIN_PASSWORD = 8;

/** Saves the customer's own details. The email is the login, so it isn't editable here. */
export async function updateProfile(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await getCustomer();
  if (!user) redirect("/login?next=/account/edit");

  const row: Record<string, string | null> = {};
  for (const field of PROFILE_FIELDS) {
    const value = String(form.get(field) ?? "").trim().slice(0, 200);
    row[field] = value || null;
  }
  if (!row.first_name) return { error: "First name is required.", done: false };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(row)
    .eq("id", user.id)
    .select("id");
  if (error) {
    console.error("[account] profile update failed", error);
    return { error: "Could not save your details. Please try again.", done: false };
  }

  // The login database is shared with another site, so an account may exist
  // without a TaxProPath profile yet. Customers can't insert profiles under
  // RLS, so the server creates the row — only ever for the signed-in user.
  if (!data?.length) {
    if (!hasServiceRoleKey()) {
      return { error: "Could not save your details. Please contact us.", done: false };
    }
    const { error: insertError } = await createAdminClient()
      .from("profiles")
      .insert({ id: user.id, ...row });
    if (insertError) {
      console.error("[account] profile insert failed", insertError);
      return { error: "Could not save your details. Please try again.", done: false };
    }
  }

  revalidatePath("/account", "layout");
  return { error: null, done: true };
}

export async function changeMyPassword(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await getCustomer();
  if (!user?.email) redirect("/login?next=/account/password");

  const current = String(form.get("current_password") ?? "");
  const next = String(form.get("new_password") ?? "");
  const confirm = String(form.get("confirm_password") ?? "");

  if (next.length < MIN_PASSWORD) {
    return { error: `The new password needs at least ${MIN_PASSWORD} characters.`, done: false };
  }
  if (next !== confirm) return { error: "The new passwords don't match.", done: false };
  if (next === current) {
    return { error: "Choose a password different from the current one.", done: false };
  }

  const supabase = await createClient();
  // Re-check the current password so an unattended signed-in browser can't be
  // used to take the account over.
  const { error: wrong } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: current,
  });
  if (wrong) return { error: "Your current password is wrong.", done: false };

  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) {
    console.error("[account] password change failed", error);
    return { error: "Could not change your password. Please try again.", done: false };
  }
  return { error: null, done: true };
}

/**
 * Sets a new password after the customer follows the emailed reset link.
 * /auth/callback has already turned that link into a short-lived session.
 */
export async function setNewPassword(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await getCustomer();
  if (!user) {
    return {
      error: "This reset link has expired. Request a new one from the login page.",
      done: false,
    };
  }

  const next = String(form.get("new_password") ?? "");
  const confirm = String(form.get("confirm_password") ?? "");
  if (next.length < MIN_PASSWORD) {
    return { error: `The password needs at least ${MIN_PASSWORD} characters.`, done: false };
  }
  if (next !== confirm) return { error: "The passwords don't match.", done: false };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) {
    console.error("[account] password reset failed", error);
    const same = /different from the old password/i.test(error.message);
    return {
      error: same
        ? "Choose a password different from your old one."
        : "Could not set the password. Please request a new reset link.",
      done: false,
    };
  }
  return { error: null, done: true };
}

export async function signOutCustomer() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
