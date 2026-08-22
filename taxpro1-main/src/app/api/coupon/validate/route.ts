import { NextResponse } from "next/server";
import { validateCoupon } from "@/lib/coupons";

/**
 * Live preview only — lets the cart/checkout UI show the discount before
 * payment. The subtotal here comes from the browser's own cart total, so it
 * is fine for a preview but is NEVER the number actually charged: create-order
 * re-validates the coupon against its own server-priced subtotal.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const subtotalCents = Number(body.subtotalCents);
  if (!Number.isFinite(subtotalCents) || subtotalCents < 0) {
    return NextResponse.json({ error: "Invalid subtotal." }, { status: 400 });
  }

  const result = await validateCoupon(body.code, subtotalCents);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  if (!result.code) return NextResponse.json({ error: "Enter a coupon code." }, { status: 400 });

  return NextResponse.json({ ok: true, code: result.code, discountCents: result.discountCents });
}
