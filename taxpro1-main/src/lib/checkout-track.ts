/*
 * Browser side of checkout tracking. Each visit to the checkout page gets its
 * own session id, so its steps line up as one timeline in the admin. Sends
 * with keepalive so a report still goes out while the page is closing.
 */

let session: string | null = null;

/** Starts a new checkout session (call when the checkout page opens). */
export function newCheckoutSession(): string {
  session =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return session;
}

export function checkoutSession(): string {
  return session ?? newCheckoutSession();
}

export type TrackPayload = {
  method?: string | null;
  reason?: string | null;
  code?: string | null;
  paypalOrderId?: string | null;
  amountCents?: number;
  details?: Record<string, unknown>;
};

export function trackCheckout(
  event:
    | "viewed"
    | "clicked"
    | "form_incomplete"
    | "paypal_error"
    | "sdk_failed"
    | "card_failed"
    | "left_page",
  payload: TrackPayload = {},
) {
  try {
    void fetch("/api/checkout-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, session: checkoutSession(), ...payload }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Tracking never interrupts the checkout.
  }
}
