"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { logActivity } from "@/lib/admin/activity";

/** Clears Error Monitor entries: everything, or only those older than N days. */
export async function clearErrors(form: FormData) {
  const admin = await requireSuperAdmin();
  const scope = String(form.get("scope") ?? "");
  const days = scope === "all" ? 0 : Number(scope);
  if (scope !== "all" && ![1, 7].includes(days)) return;

  const supabase = await createClient();
  let query = supabase.from("error_events").delete();
  query =
    scope === "all"
      ? query.gte("created_at", "1970-01-01")
      : query.lt("created_at", new Date(Date.now() - days * 86_400_000).toISOString());
  const { error } = await query;
  if (error) {
    console.error("[error-monitor] clear failed", error);
    return;
  }

  await logActivity(
    admin,
    "CLEAR_ERRORS",
    scope === "all" ? "Cleared every Error Monitor entry." : `Cleared Error Monitor entries older than ${days} day(s).`,
  );
  revalidatePath("/admin/error-monitor");
}
