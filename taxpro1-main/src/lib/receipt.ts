import type { CartLine } from "@/lib/types";

/** Everything the payment receipt shows, captured the moment payment settles. */
export type ReceiptData = {
  orderId: string;
  captureId: string | null;
  paidAt: string; // ISO timestamp
  name: string;
  email: string;
  lines: CartLine[];
  subtotalCents: number;
  discountCents: number;
  couponCode: string | null;
  totalCents: number;
};

/** Short, readable order reference (same one the thank-you page shows). */
export function orderRef(orderId: string) {
  return orderId.slice(0, 8).toUpperCase();
}

/** e.g. "11 NOV 2026 | 3:42 PM" */
export function receiptDate(iso: string) {
  const d = new Date(iso);
  const date = d
    .toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
    .replace(/,/g, "");
  // "Nov 11 2026" -> "11 NOV 2026"
  const [mon, day, year] = date.split(" ");
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${day} ${mon.toUpperCase()} ${year} | ${time}`;
}
