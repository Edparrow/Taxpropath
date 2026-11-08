import { NextResponse, after } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createPaypalOrder, isPaypalConfigured } from "@/lib/paypal";
import { priceCart, sanitizeBilling } from "@/lib/cart-pricing";
import { validateCoupon } from "@/lib/coupons";
import { syncCheckoutToAbandonedSheet, welcomeNewCustomer } from "@/lib/customer-journey";

export async function POST(request: Request) {
  if (!isPaypalConfigured() || !isSupabaseConfigured() || !hasServiceRoleKey()) {
    return NextResponse.json(
      { error: "Payments are not configured yet." },
      { status: 503 },
    );
  }

  /*
   * An account is required to buy. This is the enforcement point, not the
   * checkout page redirect — a client can POST here directly. Because a user is
   * always present, orders.guest_email is never populated any more.
   */
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to complete your purchase." },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const billing = sanitizeBilling(body.billing);
  if (!billing.email.includes("@")) {
    return NextResponse.json(
      { error: "A valid email address is required." },
      { status: 400 },
    );
  }

  const priced = await priceCart(body.lines);
  if (!priced.ok) {
    return NextResponse.json({ error: priced.error }, { status: 400 });
  }

  // The discount is derived from priced.totalCents (server-priced), never
  // from anything the client claims the subtotal or discount to be.
  let discountCents = 0;
  let couponCode: string | null = null;
  if (body.couponCode) {
    const coupon = await validateCoupon(body.couponCode, priced.totalCents);
    if (!coupon.ok) {
      return NextResponse.json({ error: coupon.error }, { status: 400 });
    }
    discountCents = coupon.discountCents;
    couponCode = coupon.code || null;
  }
  const finalTotalCents = priced.totalCents - discountCents;

  try {
    // The amount handed to PayPal comes from priceCart minus the verified
    // discount, never from the client.
    const paypalOrder = await createPaypalOrder({
      totalCents: finalTotalCents,
      lines: priced.items.map((i) => ({
        title: i.title_snapshot,
        optionLabel: i.option_snapshot,
        unitPriceCents: i.unit_price_cents,
        quantity: i.quantity,
      })),
    });

    // Record our own pending order alongside it so capture can verify the
    // amount later, and so an abandoned payment leaves an auditable trail.
    const admin = createAdminClient();

    // A buyer whose login came from the other site sharing this auth database
    // has no TaxProPath profile yet; buying here makes them a customer.
    await admin.from("profiles").upsert(
      {
        id: user.id,
        first_name: billing.first_name || null,
        last_name: billing.last_name || null,
        phone: billing.phone || null,
        company: billing.company || null,
        address1: billing.address1 || null,
        address2: billing.address2 || null,
        city: billing.city || null,
        zip: billing.zip || null,
        ptin: billing.ptin || null,
        country: billing.country || null,
        region: billing.region || null,
      },
      { onConflict: "id", ignoreDuplicates: true },
    );
    const { error } = await admin.rpc("place_order", {
      p_user_id: user.id,
      // Ownership comes from the session; the form's email is billing detail only.
      p_email: user.email ?? billing.email,
      p_billing: billing,
      p_items: priced.items,
      p_paypal_order_id: paypalOrder.id,
      p_coupon_code: couponCode,
      p_discount_cents: discountCents,
    });

    if (error) {
      console.error("[paypal/create-order] place_order failed", error);
      return NextResponse.json(
        { error: "We couldn't start your payment. Please try again." },
        { status: 500 },
      );
    }

    // Journey capture, after the response so the buyer never waits on it:
    // the checkout goes to the abandoned sheet until it's paid, and a buyer
    // whose welcome hasn't gone out yet gets it now.
    after(async () => {
      await syncCheckoutToAbandonedSheet(paypalOrder.id);
      await welcomeNewCustomer(user.id);
    });

    return NextResponse.json({ id: paypalOrder.id });
  } catch (err) {
    console.error("[paypal/create-order] failed", err);
    return NextResponse.json(
      { error: "We couldn't start your payment. Please try again." },
      { status: 500 },
    );
  }
}
