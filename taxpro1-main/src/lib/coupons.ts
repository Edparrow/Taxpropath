import "server-only";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/utils";

export type CouponResult =
  | { ok: true; code: string; discountCents: number }
  | { ok: false; error: string };

/**
 * Validates a coupon against a subtotal that the CALLER must already have
 * derived from the trusted catalog (priceCart's totalCents), never from the
 * browser. Reads through the service role because coupons has no public
 * select policy — a client-side table read would let anyone list every code.
 */
export async function validateCoupon(
  rawCode: unknown,
  subtotalCents: number,
): Promise<CouponResult> {
  const code = String(rawCode ?? "").trim().toUpperCase();
  if (!code) return { ok: true, code: "", discountCents: 0 };

  if (!hasServiceRoleKey()) {
    return { ok: false, error: "Coupons aren't available right now." };
  }

  const admin = createAdminClient();
  const { data: coupon } = await admin
    .from("coupons")
    .select(
      "code, discount_type, discount_value, min_order_cents, max_redemptions, times_redeemed, starts_at, expires_at, is_active",
    )
    .eq("code", code)
    .maybeSingle();

  if (!coupon || !coupon.is_active) {
    return { ok: false, error: "That coupon code isn't valid." };
  }

  const now = Date.now();
  if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) {
    return { ok: false, error: "That coupon isn't active yet." };
  }
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < now) {
    return { ok: false, error: "That coupon has expired." };
  }
  if (coupon.max_redemptions !== null && coupon.times_redeemed >= coupon.max_redemptions) {
    return { ok: false, error: "That coupon has already been fully redeemed." };
  }
  if (subtotalCents < coupon.min_order_cents) {
    return {
      ok: false,
      error: `That coupon needs a minimum order of ${formatPrice(coupon.min_order_cents)}.`,
    };
  }

  const rawDiscount =
    coupon.discount_type === "percent"
      ? Math.round((subtotalCents * coupon.discount_value) / 100)
      : coupon.discount_value;

  return { ok: true, code: coupon.code, discountCents: Math.min(rawDiscount, subtotalCents) };
}
