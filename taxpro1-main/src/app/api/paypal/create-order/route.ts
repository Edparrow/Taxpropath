import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createPaypalOrder, isPaypalConfigured } from "@/lib/paypal";
import { priceCart, sanitizeBilling } from "@/lib/cart-pricing";

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

  try {
    // The amount handed to PayPal comes from priceCart, never from the client.
    const paypalOrder = await createPaypalOrder({
      totalCents: priced.totalCents,
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
    const { error } = await admin.rpc("place_order", {
      p_user_id: user.id,
      // Ownership comes from the session; the form's email is billing detail only.
      p_email: user.email ?? billing.email,
      p_billing: billing,
      p_items: priced.items,
      p_paypal_order_id: paypalOrder.id,
    });

    if (error) {
      console.error("[paypal/create-order] place_order failed", error);
      return NextResponse.json(
        { error: "We couldn't start your payment. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({ id: paypalOrder.id });
  } catch (err) {
    console.error("[paypal/create-order] failed", err);
    return NextResponse.json(
      { error: "We couldn't start your payment. Please try again." },
      { status: 500 },
    );
  }
}
