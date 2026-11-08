import "server-only";

/** Shared shapes and rules for the admin order screens. */

/**
 * A checkout that hasn't been paid this long after it started is treated as
 * failed / abandoned. Younger pending orders may still be mid-payment.
 */
export const UNPAID_AFTER_MINUTES = 30;

export function unpaidCutoffIso(): string {
  return new Date(Date.now() - UNPAID_AFTER_MINUTES * 60_000).toISOString();
}

export const ORDER_COLUMNS = `
  id, status, subtotal_cents, discount_cents, coupon_code, currency, guest_email,
  paypal_capture_id, paid_at, created_at, billing, payment_method, remarks,
  order_items ( id, course_slug, title_snapshot, option_snapshot, quantity,
                unit_price_cents, portal_access_sent, certificate_sent )
`;

export type OrderItem = {
  id: string;
  course_slug: string;
  title_snapshot: string;
  option_snapshot: string;
  quantity: number;
  unit_price_cents: number;
  portal_access_sent: boolean;
  certificate_sent: boolean;
};

export type OrderRow = {
  id: string;
  status: "pending" | "paid" | "cancelled" | "refunded";
  subtotal_cents: number;
  discount_cents: number | null;
  coupon_code: string | null;
  currency: string;
  guest_email: string | null;
  paypal_capture_id: string | null;
  paid_at: string | null;
  created_at: string;
  billing: Record<string, string> | null;
  payment_method: "paypal" | "manual";
  remarks: string | null;
  order_items: OrderItem[];
};

export const orderTotalCents = (o: Pick<OrderRow, "subtotal_cents" | "discount_cents">) =>
  o.subtotal_cents - (o.discount_cents ?? 0);

export const customerName = (o: Pick<OrderRow, "billing">) =>
  [o.billing?.first_name, o.billing?.last_name].filter(Boolean).join(" ");

export const customerEmail = (o: Pick<OrderRow, "billing" | "guest_email">) =>
  (o.billing?.email || o.guest_email || "").toLowerCase();

export const productsSummary = (o: Pick<OrderRow, "order_items">) =>
  o.order_items.map((i) => `${i.title_snapshot} (${i.option_snapshot})`).join(", ");

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
