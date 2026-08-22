"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

/** Writes go through the caller's own session — "admins manage subscribers" RLS is the real lock. */
export async function deleteSubscriber(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
  if (error) console.error("[admin] subscriber delete failed", error);

  revalidatePath("/admin/subscribers");
}
