import { NextResponse, after } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { PaypalError, capturePaypalOrder, isPaypalConfigured } from "@/lib/paypal";
import { paypalIssueReason, processorReason, recordCheckoutEvent } from "@/lib/checkout-events";
import { fireOrderDoorbell } from "@/lib/engine";
import { sendOrderConfirmation, syncPaidOrderToSheet } from "@/lib/customer-journey";

export async function POST(request: Request) {
  if (!isPaypalConfigured() || !isSupabaseConfigured() || !hasServiceRoleKey()) {
    return NextResponse.json(
      { error: "Payments are not configured yet." },
      { status: 503 },
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to complete your purchase." },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const paypalOrderId = String(body?.paypalOrderId ?? "").trim();

  if (!/^[A-Z0-9]{5,32}$/i.test(paypalOrderId)) {
    return NextResponse.json({ error: "Invalid payment reference." }, { status: 400 });
  }

  const admin = createAdminClient();
  const track = {
    userId: user.id,
    sessionId: typeof body?.session === "string" ? body.session : null,
    method: typeof body?.method === "string" ? body.method : null,
    paypalOrderId,
  };

  /*
   * Being signed in isn't sufficient: the reference comes from the client, so
   * confirm the pending order belongs to this account before capturing against
   * it. Otherwise any signed-in user could settle someone else's order.
   */
  const { data: pending, error: lookupError } = await admin
    .from("orders")
    .select("user_id")
    .eq("paypal_order_id", paypalOrderId)
    .maybeSingle();

  if (lookupError) {
    console.error("[paypal/capture-order] order lookup failed", lookupError);
    return NextResponse.json(
      { error: "We couldn't complete your payment. Please try again." },
      { status: 500 },
    );
  }
  if (!pending) {
    return NextResponse.json({ error: "Unknown payment reference." }, { status: 404 });
  }
  if (pending.user_id !== user.id) {
    return NextResponse.json({ error: "That order isn't yours." }, { status: 403 });
  }

  try {
    const capture = await capturePaypalOrder(paypalOrderId);

    if (capture.status !== "COMPLETED") {
      console.warn("[paypal/capture-order] non-completed capture", capture);
      const bank = processorReason(capture.processorCode);
      after(() =>
        recordCheckoutEvent({
          ...track,
          event: "capture_failed",
          reason:
            bank?.reason ??
            (capture.status === "PENDING"
              ? "Payment is on hold at PayPal (pending review or eCheck)"
              : `Payment was ${String(capture.status).toLowerCase()} by PayPal`),
          code: bank?.code ?? String(capture.status),
          amountCents: capture.capturedCents,
          details: { status: capture.status, captureId: capture.captureId },
        }),
      );
      return NextResponse.json(
        { error: "Payment was not completed. Please try again." },
        { status: 402 },
      );
    }

    // mark_order_paid re-checks the captured amount and currency against the
    // order we stored at create time, and refuses to settle on a mismatch.
    const { data: orderId, error } = await admin.rpc("mark_order_paid", {
      p_paypal_order_id: capture.paypalOrderId,
      p_paypal_capture_id: capture.captureId,
      p_captured_cents: capture.capturedCents,
      p_currency: capture.currency,
    });

    if (error) {
      // Money has moved but our records disagree — never show this as success.
      console.error("[paypal/capture-order] reconciliation failed", {
        capture,
        error,
      });
      after(() =>
        recordCheckoutEvent({
          ...track,
          event: "capture_failed",
          reason: "Money was taken at PayPal but didn't match our order. Check it and mark it paid by hand.",
          code: "AMOUNT_MISMATCH",
          amountCents: capture.capturedCents,
          details: { captureId: capture.captureId, currency: capture.currency },
        }),
      );
      return NextResponse.json(
        {
          error:
            "Your payment went through but we couldn't confirm your order. " +
            "Please contact support@taxpropath.com and quote reference " +
            capture.captureId,
        },
        { status: 500 },
      );
    }

    // Hurry-up ping to the course engine (join.us-cpe.com). The hourly get_orders pull is the
    // truth, so a failure here is logged inside and never fails the checkout.
    await fireOrderDoorbell({ order_id: String(orderId), action: "paid" });
    after(() =>
      recordCheckoutEvent({
        ...track,
        event: "paid",
        amountCents: capture.capturedCents,
        details: { captureId: capture.captureId },
      }),
    );

    // Confirmation email (BCC support) and the order sheet, after the response.
    after(async () => {
      await sendOrderConfirmation(String(orderId));
      await syncPaidOrderToSheet(String(orderId));
    });

    return NextResponse.json({
      ok: true,
      orderId,
      captureId: capture.captureId,
      amountCents: capture.capturedCents,
    });
  } catch (err) {
    console.error("[paypal/capture-order] failed", err);
    const issue = err instanceof PaypalError ? paypalIssueReason(err.body) : null;
    after(() =>
      recordCheckoutEvent({
        ...track,
        event: "capture_failed",
        reason: issue?.reason ?? "Our server couldn't confirm the payment with PayPal",
        code: issue?.code ?? "CAPTURE_ERROR",
      }),
    );
    return NextResponse.json(
      { error: "We couldn't complete your payment. Please try again." },
      { status: 500 },
    );
  }
}
