"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { logActivity } from "@/lib/admin/activity";
import { loadCustomers } from "@/lib/admin/customers";
import { sendToGoogleSheet, type SheetRow } from "@/lib/google-sheets";

/** Sends registered customers (all, or the chosen ids) to Google Sheets. */
export async function syncUsers(ids: string[] | null): Promise<{ ok: boolean; message: string }> {
  const admin = await requireAdmin("users", "edit");
  const wanted = ids ? new Set(ids) : null;

  const rows: SheetRow[] = (await loadCustomers())
    .filter((c) => !wanted || wanted.has(c.id))
    .map((c) => ({
      source: "TaxProPath",
      order_id: `REG-${c.id.slice(0, 8)}`,
      name: c.name,
      email: c.email,
      mobile: c.phone,
      city: c.city,
      pincode: c.zip,
      // Same column mapping the SkillSync sheet uses for registered users.
      coupon_code: c.ptin,
      coupon_price: c.company,
      price: c.address1,
      date: new Date(c.registeredAt).toISOString().replace("T", " ").slice(0, 19),
      product_detail: "Registered user",
      live_date: "N/A",
      demand_date: "N/A",
    }));

  const result = await sendToGoogleSheet(rows, "users");
  if (!result.ok) return { ok: false, message: result.error };
  await logActivity(admin, "SYNC_SHEET", `Synced ${result.count} registered user(s) to Google Sheets.`);
  return { ok: true, message: `${result.count} user(s) synced to Google Sheets.` };
}
