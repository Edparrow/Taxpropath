"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { logActivity } from "@/lib/admin/activity";

/**
 * Writes go through the caller's own session — "admins manage coupons" RLS
 * (0001_initial_schema.sql) is the real lock, requireAdmin is defence in
 * depth. There is deliberately no public read policy on this table: coupon
 * validation at checkout goes through /api/coupon (service role), not a
 * client-side table read, so a visitor's browser can never list every code.
 */

type Result = { error: string } | void;

function optionalText(value: FormDataEntryValue | null): string | null {
  const raw = String(value ?? "").trim();
  return raw || null;
}

function optionalIso(value: FormDataEntryValue | null): string | null {
  const raw = String(value ?? "").trim();
  return raw ? new Date(raw).toISOString() : null;
}

export async function saveCoupon(
  couponId: string | null,
  _prev: unknown,
  form: FormData,
): Promise<Result> {
  const admin = await requireAdmin("coupons", "edit");

  const code = String(form.get("code") ?? "").trim().toUpperCase();
  if (!code) return { error: "Code is required." };

  const discountType = form.get("discount_type") === "percent" ? "percent" : "fixed";
  const rawValue = Number(form.get("discount_value") ?? 0);
  if (!Number.isFinite(rawValue) || rawValue <= 0) {
    return { error: "Discount value must be a positive number." };
  }
  // Fixed discounts are entered in dollars on the form, stored in cents.
  const discountValue =
    discountType === "percent" ? Math.min(100, Math.round(rawValue)) : Math.round(rawValue * 100);

  const minOrderDollars = Number(form.get("min_order_cents") ?? 0);
  const maxRedemptionsRaw = String(form.get("max_redemptions") ?? "").trim();

  const row = {
    code,
    description: optionalText(form.get("description")),
    discount_type: discountType,
    discount_value: discountValue,
    min_order_cents: Number.isFinite(minOrderDollars) ? Math.round(minOrderDollars * 100) : 0,
    max_redemptions: maxRedemptionsRaw ? Math.round(Number(maxRedemptionsRaw)) : null,
    starts_at: optionalIso(form.get("starts_at")),
    expires_at: optionalIso(form.get("expires_at")),
    is_active: form.get("is_active") === "on",
  };

  const supabase = await createClient();

  if (couponId) {
    const { error } = await supabase.from("coupons").update(row).eq("id", couponId);
    if (error) return { error: humanise(error.message) };
  } else {
    const { error } = await supabase.from("coupons").insert(row);
    if (error) return { error: humanise(error.message) };
  }

  await logActivity(admin, couponId ? "UPDATE_COUPON" : "CREATE_COUPON", `${couponId ? "Updated" : "Created"} coupon ${code}.`);
  revalidatePath("/admin/coupons");
  redirect("/admin/coupons");
}

export async function deleteCoupon(formData: FormData) {
  const admin = await requireAdmin("coupons", "edit");
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { data: deleted, error } = await supabase
    .from("coupons")
    .delete()
    .eq("id", id)
    .select("code")
    .maybeSingle();
  if (error) console.error("[admin] coupon delete failed", error);
  if (deleted) await logActivity(admin, "DELETE_COUPON", `Deleted coupon ${deleted.code}.`);

  revalidatePath("/admin/coupons");
}

function humanise(message: string) {
  if (message.includes("duplicate key") && message.includes("code")) {
    return "A coupon with that code already exists.";
  }
  return "Could not save the coupon. Please try again.";
}
