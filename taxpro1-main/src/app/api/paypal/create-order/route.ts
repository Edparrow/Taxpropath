import { NextResponse, after } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { PaypalError, createPaypalOrder, isPaypalConfigured, paypalMode } from "@/lib/paypal";
import { paypalIssueReason, recordCheckoutEvent } from "@/lib/checkout-events";
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

  // Tracking: the checkout visit this belongs to, and which button was used.
  const track = {
    userId: user.id,
    sessionId: typeof body.session === "string" ? body.session : null,
    method: typeof body.method === "string" ? body.method : null,
  };
  const failed = (reason: string, code: string, details?: Record<string, unknown>) =>
    after(() => recordCheckoutEvent({ ...track, event: "order_failed", reason, code, details }));

  const billing = sanitizeBilling(body.billing);
  if (!billing.email.includes("@")) {
    failed("No valid email on the billing details", "INVALID_EMAIL");
    return NextResponse.json(
      { error: "A valid email address is required." },
      { status: 400 },
    );
  }

  const priced = await priceCart(body.lines);
  if (!priced.ok) {
    failed(`Cart problem: ${priced.error}`, "CART_INVALID");
    return NextResponse.json({ error: priced.error }, { status: 400 });
  }

  // The discount is derived from priced.totalCents (server-priced), never
  // from anything the client claims the subtotal or discount to be.
  let discountCents = 0;
  let couponCode: string | null = null;
  if (body.couponCode) {
    const coupon = await validateCoupon(body.couponCode, priced.totalCents);
    if (!coupon.ok) {
      failed(`Coupon rejected: ${coupon.error}`, "COUPON_INVALID", { coupon: body.couponCode });
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

    // Save the checkout details back to the profile so the next checkout (and
    // My Account) shows them. Only filled-in fields are written: a blank field
    // never wipes something already saved. A buyer whose login came from the
    // other site sharing this auth database gets their profile created here.
    const profileFields = [
      "first_name",
      "last_name",
      "phone",
      "company",
      "address1",
      "address2",
      "city",
      "zip",
      "ptin",
      "country",
      "region",
    ] as const;
    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: user.id,
        ...Object.fromEntries(
          profileFields.filter((key) => billing[key]).map((key) => [key, billing[key]]),
        ),
      },
      { onConflict: "id" },
    );
    if (profileError) {
      // Never block a payment over this; the order keeps its own billing copy.
      console.error("[paypal/create-order] profile save failed", profileError);
    }
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
      failed("Our server couldn't save the order", "ORDER_SAVE_FAILED");
      return NextResponse.json(
        { error: "We couldn't start your payment. Please try again." },
        { status: 500 },
      );
    }

    // Sandbox payments are tests: they must never reach the CRM's live order
    // feed (they appear only with the test key).
    if (paypalMode() === "sandbox") {
      const { error: testError } = await admin
        .from("orders")
        .update({ is_test: true })
        .eq("paypal_order_id", paypalOrder.id);
      if (testError) {
        // Safer to stop than to let a sandbox order look real to the CRM.
        console.error("[paypal/create-order] marking test order failed", testError);
        failed("Our server couldn't mark the sandbox order as a test", "TEST_FLAG_FAILED");
        return NextResponse.json(
          { error: "We couldn't start your payment. Please try again." },
          { status: 500 },
        );
      }
    }

    // Journey capture, after the response so the buyer never waits on it:
    // the checkout goes to the abandoned sheet until it's paid, and a buyer
    // whose welcome hasn't gone out yet gets it now.
    after(async () => {
      await recordCheckoutEvent({
        ...track,
        event: "order_created",
        paypalOrderId: paypalOrder.id,
        amountCents: finalTotalCents,
        details: { items: priced.items.length, coupon: couponCode },
      });
      await syncCheckoutToAbandonedSheet(paypalOrder.id);
      await welcomeNewCustomer(user.id);
    });

    return NextResponse.json({ id: paypalOrder.id });
  } catch (err) {
    console.error("[paypal/create-order] failed", err);
    const issue = err instanceof PaypalError ? paypalIssueReason(err.body) : null;
    failed(
      issue ? `PayPal refused to start the payment: ${issue.reason}` : "Couldn't reach PayPal to start the payment",
      issue?.code ?? "PAYPAL_UNAVAILABLE",
    );
    return NextResponse.json(
      { error: "We couldn't start your payment. Please try again." },
      { status: 500 },
    );
  }
}
