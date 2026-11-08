"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { logActivity } from "@/lib/admin/activity";

/**
 * Writes go through the caller's own session, so the "admins delete contact
 * messages" RLS policy (0001_initial_schema.sql) is the real lock.
 */
export async function deleteEnquiry(formData: FormData) {
  const admin = await requireAdmin("enquiries", "edit");
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { error } = await supabase.from("contact_messages").delete().eq("id", id);
  if (error) console.error("[admin] enquiry delete failed", error);
  else await logActivity(admin, "DELETE_ENQUIRY", "Deleted a contact query.", { type: "enquiry", id });

  revalidatePath("/admin/enquiries");
}
