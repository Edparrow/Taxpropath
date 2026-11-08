import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AdminUser } from "@/lib/admin/permissions";

/**
 * Appends an Activity Logs entry in the admin's own name. Never throws: a
 * failed log line must not undo or block the change it describes.
 */
export async function logActivity(
  admin: Pick<AdminUser, "id" | "email">,
  action: string,
  description: string,
  reference?: { type: string; id: string },
): Promise<void> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("activity_logs").insert({
      admin_id: admin.id,
      admin_email: admin.email,
      action,
      description,
      reference_type: reference?.type ?? null,
      reference_id: reference?.id ?? null,
    });
    if (error) console.error("[activity] log insert failed", error);
  } catch (err) {
    console.error("[activity] log insert failed", err);
  }
}
