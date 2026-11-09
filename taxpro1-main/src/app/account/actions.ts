"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { randomUUID } from "node:crypto";
import { PROFILE_FIELDS, getCustomer } from "@/lib/account";
import { isPreset, presetUrl } from "@/lib/avatar-presets";

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

/* ------------------------------------------------------- profile picture */

export type AvatarResult = { error: string } | { ok: true };

/** Public bucket for customers' uploaded profile photos. */
const AVATAR_BUCKET = "avatars";
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_TYPES = {
  png: "image/png",
  webp: "image/webp",
  jpg: "image/jpeg",
} as const;

/** Identifies an image by its first bytes, not its name or claimed type. */
function sniffAvatar(bytes: Uint8Array): keyof typeof AVATAR_TYPES | null {
  const starts = (sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (starts([0xff, 0xd8, 0xff])) return "jpg";
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  return null;
}

/**
 * Saves the signed-in customer's avatar_url (null = initials) and removes
 * their previous uploaded photo, if any. Creates the profile row when the
 * shared login database has none yet, like updateProfile does.
 */
async function saveAvatar(userId: string, value: string | null): Promise<AvatarResult> {
  const supabase = await createClient();
  const { data: before } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", userId)
    .maybeSingle();

  const { data, error } = await supabase
    .from("profiles")
    .update({ avatar_url: value })
    .eq("id", userId)
    .select("id");
  if (error) {
    console.error("[account] avatar update failed", error);
    return { error: "Could not save your picture. Please try again." };
  }
  if (!data?.length) {
    if (!hasServiceRoleKey()) return { error: "Could not save your picture. Please contact us." };
    const { error: insertError } = await createAdminClient()
      .from("profiles")
      .insert({ id: userId, avatar_url: value });
    if (insertError) {
      console.error("[account] avatar profile insert failed", insertError);
      return { error: "Could not save your picture. Please try again." };
    }
  }

  // Tidy up the old upload (only files in this customer's own folder).
  const old = before?.avatar_url as string | null | undefined;
  const marker = `/storage/v1/object/public/${AVATAR_BUCKET}/`;
  if (old && old !== value && old.includes(marker) && hasServiceRoleKey()) {
    const path = decodeURIComponent(old.split(marker)[1] ?? "");
    if (path.startsWith(`${userId}/`)) {
      await createAdminClient().storage.from(AVATAR_BUCKET).remove([path]);
    }
  }

  revalidatePath("/account", "layout");
  return { ok: true };
}

/** Picks one of the ready-made avatars. */
export async function chooseAvatar(seed: string): Promise<AvatarResult> {
  const user = await getCustomer();
  if (!user) return { error: "Please sign in again." };
  if (!isPreset(seed)) return { error: "Please choose one of the avatars shown." };
  return saveAvatar(user.id, presetUrl(seed));
}

/** Uploads the customer's own photo (PNG, JPG or WebP, up to 2 MB). */
export async function uploadAvatar(form: FormData): Promise<AvatarResult> {
  const user = await getCustomer();
  if (!user) return { error: "Please sign in again." };
  if (!hasServiceRoleKey()) return { error: "Photo uploads aren't available right now." };

  const file = form.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a photo first." };
  if (file.size > AVATAR_MAX_BYTES) return { error: "The photo must be 2 MB or smaller." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffAvatar(bytes);
  if (!kind) return { error: "Use a PNG, JPG or WebP image." };

  const db = createAdminClient();
  // Create the public bucket on first use, so no manual Storage setup.
  const { error: bucketError } = await db.storage.getBucket(AVATAR_BUCKET);
  if (bucketError) {
    const { error: createError } = await db.storage.createBucket(AVATAR_BUCKET, {
      public: true,
      fileSizeLimit: AVATAR_MAX_BYTES,
      allowedMimeTypes: Object.values(AVATAR_TYPES),
    });
    if (createError && !/already exists/i.test(createError.message)) {
      console.error("[account] avatar bucket create failed", createError);
      return { error: "Could not upload the photo. Please try again." };
    }
  }

  const path = `${user.id}/${randomUUID()}.${kind}`;
  const { error } = await db.storage.from(AVATAR_BUCKET).upload(path, bytes, {
    contentType: AVATAR_TYPES[kind],
    cacheControl: "31536000",
  });
  if (error) {
    console.error("[account] avatar upload failed", error);
    return { error: "Could not upload the photo. Please try again." };
  }
  const { data } = db.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return saveAvatar(user.id, data.publicUrl);
}

/** Goes back to initials. */
export async function removeAvatar(): Promise<AvatarResult> {
  const user = await getCustomer();
  if (!user) return { error: "Please sign in again." };
  return saveAvatar(user.id, null);
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
