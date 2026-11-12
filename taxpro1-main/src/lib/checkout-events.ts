import "server-only";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/*
 * Checkout tracking: one row per step of a checkout in `checkout_events`.
 * Failures also stamp the order with its latest reason, which Admin > Failed
 * Orders shows. Tracking must never break a payment, so every write here
 * swallows (and logs) its own errors.
 */

export const CHECKOUT_EVENTS = [
  "viewed",
  "clicked",
  "form_incomplete",
  "order_created",
  "order_failed",
  "cancelled",
  "paypal_error",
  "sdk_failed",
  "card_failed",
  "left_page",
  "capture_failed",
  "paid",
] as const;
export type CheckoutEventName = (typeof CHECKOUT_EVENTS)[number];

/** Events that explain why a payment didn't happen. */
const FAILURES = new Set<CheckoutEventName>([
  "order_failed",
  "cancelled",
  "paypal_error",
  "card_failed",
  "left_page",
  "capture_failed",
]);

export type CheckoutEventInput = {
  event: CheckoutEventName;
  userId: string;
  sessionId?: string | null;
  paypalOrderId?: string | null;
  method?: string | null;
  reason?: string | null;
  code?: string | null;
  amountCents?: number | null;
  details?: Record<string, unknown>;
};

export async function recordCheckoutEvent(input: CheckoutEventInput): Promise<void> {
  if (!isSupabaseConfigured() || !hasServiceRoleKey()) return;
  try {
    const db = createAdminClient();

    // Link to our order through PayPal's id, but only the buyer's own order.
    let orderId: string | null = null;
    let orderStatus: string | null = null;
    if (input.paypalOrderId) {
      const { data } = await db
        .from("orders")
        .select("id, user_id, status")
        .eq("paypal_order_id", input.paypalOrderId)
        .maybeSingle();
      if (data && data.user_id === input.userId) {
        orderId = data.id;
        orderStatus = data.status;
      }
    }

    const { error } = await db.from("checkout_events").insert({
      user_id: input.userId,
      session_id: input.sessionId?.slice(0, 64) || null,
      order_id: orderId,
      paypal_order_id: input.paypalOrderId || null,
      event: input.event,
      method: input.method?.slice(0, 30) || null,
      reason: input.reason?.slice(0, 500) || null,
      code: input.code?.slice(0, 80) || null,
      amount_cents: input.amountCents ?? null,
      details: input.details ?? {},
    });
    if (error) console.error("[checkout-events] insert failed", error);

    // Keep the order's "why it failed" current (never on a paid order).
    if (orderId && FAILURES.has(input.event) && orderStatus !== "paid" && input.reason) {
      const { error: updateError } = await db
        .from("orders")
        .update({
          failure_reason: input.reason.slice(0, 500),
          failure_code: input.code?.slice(0, 80) || null,
          failed_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .neq("status", "paid");
      if (updateError) console.error("[checkout-events] order update failed", updateError);
    }
  } catch (err) {
    console.error("[checkout-events] failed", err);
  }
}

/* ------------------------------------------------ PayPal reason mapping */

// Card network / bank responses PayPal passes back on a declined capture.
const PROCESSOR_REASONS: Record<string, string> = {
  "0005": "Bank declined the card (do not honor)",
  "0051": "Insufficient funds",
  "5120": "Insufficient funds",
  "0054": "Card expired",
  "5400": "Card expired",
  "00N7": "Security code (CVV) check failed",
  "5110": "Security code (CVV) check failed",
  "9500": "Declined as suspected fraud",
  "0014": "Invalid card number",
  "1330": "Card account not valid",
};

// PayPal API issue codes (from a failed capture or order call).
const ISSUE_REASONS: Record<string, string> = {
  INSTRUMENT_DECLINED: "Card / payment method declined",
  PAYER_ACTION_REQUIRED: "Buyer had to complete an extra step (e.g. bank verification) and didn't",
  TRANSACTION_REFUSED: "Payment refused by PayPal",
  ORDER_NOT_APPROVED: "Buyer didn't approve the payment at PayPal",
  MAX_NUMBER_OF_PAYMENT_ATTEMPTS_EXCEEDED: "Too many payment attempts",
  PAYER_CANNOT_PAY: "Buyer's PayPal account can't pay for this",
  PAYEE_ACCOUNT_RESTRICTED: "Our PayPal account is restricted and can't receive payments",
  PAYEE_ACCOUNT_LOCKED_OR_CLOSED: "Our PayPal account is locked or closed",
  COMPLIANCE_VIOLATION: "Blocked by PayPal compliance checks",
  DUPLICATE_INVOICE_ID: "Duplicate payment",
  ORDER_ALREADY_CAPTURED: "Order was already paid",
  CARD_EXPIRED: "Card expired",
  CARD_CLOSED: "Card is closed",
};

/** Plain-English reason + code for a declined capture's processor response. */
export function processorReason(code: string | null | undefined) {
  if (!code) return null;
  return { reason: PROCESSOR_REASONS[code] ?? `Declined by the bank (code ${code})`, code };
}

/** Plain-English reason + code from a PayPal API error body. */
export function paypalIssueReason(body: unknown) {
  const b = body as {
    name?: string;
    message?: string;
    details?: { issue?: string; description?: string }[];
  } | null;
  const issue = b?.details?.[0]?.issue ?? b?.name ?? null;
  const description = b?.details?.[0]?.description ?? b?.message ?? null;
  if (!issue) return null;
  return {
    code: issue,
    reason: ISSUE_REASONS[issue] ?? description ?? issue.replace(/_/g, " ").toLowerCase(),
  };
}
