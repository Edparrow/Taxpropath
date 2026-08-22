"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * Writes go through the caller's own session, so the "admins delete contact
 * messages" RLS policy (0007_admin_expansion.sql) is the real lock.
 */
export async function deleteEnquiry(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { error } = await supabase.from("contact_messages").delete().eq("id", id);
  if (error) console.error("[admin] enquiry delete failed", error);

  revalidatePath("/admin/enquiries");
}
