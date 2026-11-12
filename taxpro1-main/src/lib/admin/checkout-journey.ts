import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/*
 * Reads checkout tracking for the admin: each unpaid order's timeline (every
 * step of the checkout visits that led to it) and a plain-English reason why
 * it wasn't paid.
 */

export type JourneyEvent = {
  id: string;
  created_at: string;
  session_id: string | null;
  order_id: string | null;
  event: string;
  method: string | null;
  reason: string | null;
  code: string | null;
  amount_cents: number | null;
};

const METHODS: Record<string, string> = {
  paypal: "PayPal",
  card: "Debit or Credit Card",
  paylater: "Pay Later",
  venmo: "Venmo",
};

export const methodLabel = (method: string | null) =>
  method ? (METHODS[method] ?? method) : null;

const FAILURE_EVENTS = new Set([
  "form_incomplete",
  "order_failed",
  "cancelled",
  "paypal_error",
  "sdk_failed",
  "card_failed",
  "left_page",
  "capture_failed",
]);

export const isFailureEvent = (e: JourneyEvent) => FAILURE_EVENTS.has(e.event);

function money(cents: number | null) {
  return cents == null
    ? ""
    : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

/** One line of the timeline, in plain English. */
export function describeEvent(e: JourneyEvent): string {
  const via = methodLabel(e.method);
  switch (e.event) {
    case "viewed":
      return `Opened checkout${e.amount_cents != null ? ` (${money(e.amount_cents)})` : ""}`;
    case "clicked":
      return `Clicked "${via ?? "PayPal"}"`;
    case "order_created":
      return `Payment started at PayPal${e.amount_cents != null ? ` for ${money(e.amount_cents)}` : ""}`;
    case "paid":
      return `Paid ${money(e.amount_cents)}`.trim();
    default:
      return e.reason ?? e.event.replace(/_/g, " ");
  }
}

/** Timelines for the given orders, oldest step first. */
export async function loadJourneys(
  supabase: SupabaseClient,
  orderIds: string[],
): Promise<Map<string, JourneyEvent[]>> {
  const journeys = new Map<string, JourneyEvent[]>();
  if (orderIds.length === 0) return journeys;

  const COLUMNS = "id, created_at, session_id, order_id, event, method, reason, code, amount_cents";
  const { data: linked, error } = await supabase
    .from("checkout_events")
    .select(COLUMNS)
    .in("order_id", orderIds)
    .limit(5000);
  if (error) {
    console.error("[checkout-journey] load failed", error);
    return journeys;
  }

  // The checkout visits behind each order, so the steps before the order
  // existed (opened checkout, clicked a button) are included too.
  const sessionsByOrder = new Map<string, Set<string>>();
  for (const e of (linked ?? []) as JourneyEvent[]) {
    if (!e.order_id || !e.session_id) continue;
    if (!sessionsByOrder.has(e.order_id)) sessionsByOrder.set(e.order_id, new Set());
    sessionsByOrder.get(e.order_id)!.add(e.session_id);
  }
  const allSessions = [...new Set([...sessionsByOrder.values()].flatMap((s) => [...s]))];

  let sessionEvents: JourneyEvent[] = [];
  if (allSessions.length > 0) {
    const { data } = await supabase
      .from("checkout_events")
      .select(COLUMNS)
      .in("session_id", allSessions)
      .limit(5000);
    sessionEvents = (data ?? []) as JourneyEvent[];
  }

  const all = new Map<string, JourneyEvent>();
  for (const e of [...((linked ?? []) as JourneyEvent[]), ...sessionEvents]) all.set(e.id, e);

  for (const id of orderIds) {
    const sessions = sessionsByOrder.get(id) ?? new Set<string>();
    const steps = [...all.values()]
      .filter((e) => e.order_id === id || (e.session_id && sessions.has(e.session_id)))
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
    journeys.set(id, steps);
  }
  return journeys;
}

/** Why an unpaid order wasn't paid: the recorded reason, else a best guess. */
export function failureReason(
  order: { failure_reason?: string | null; failure_code?: string | null },
  journey: JourneyEvent[],
): { reason: string; code: string | null; known: boolean } {
  if (order.failure_reason) {
    return { reason: order.failure_reason, code: order.failure_code ?? null, known: true };
  }
  if (journey.length === 0) {
    return { reason: "No tracking details (order is older than checkout tracking)", code: null, known: false };
  }
  return {
    reason:
      "Started paying but never finished at PayPal: no approval, cancel or error came back (window left open or browser closed)",
    code: "NO_RESPONSE",
    known: false,
  };
}
