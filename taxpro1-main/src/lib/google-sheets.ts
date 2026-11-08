import "server-only";

/**
 * Pushes rows to a Google Apps Script web app, in the same row shape the
 * SkillSync admin sends, so one script can serve both sites (`source` tells
 * them apart).
 *
 *   GOOGLE_SHEETS_URL            orders + registered users
 *   GOOGLE_SHEETS_ABANDONED_URL  abandoned (unpaid) checkouts
 */
export type SheetRow = {
  source: "TaxProPath";
  order_id: string;
  name: string;
  email: string;
  mobile: string;
  city: string;
  pincode: string;
  coupon_code: string;
  coupon_price: string;
  price: string;
  date: string;
  product_detail: string;
  live_date: string;
  demand_date: string;
};

export type SheetKind = "orders" | "users" | "abandoned";

export async function sendToGoogleSheet(
  rows: SheetRow[],
  kind: SheetKind,
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  const url =
    kind === "abandoned" ? process.env.GOOGLE_SHEETS_ABANDONED_URL : process.env.GOOGLE_SHEETS_URL;
  const envName = kind === "abandoned" ? "GOOGLE_SHEETS_ABANDONED_URL" : "GOOGLE_SHEETS_URL";

  if (!url) return { ok: false, error: `Google Sheets is not set up: add ${envName} to the server env.` };
  if (rows.length === 0) return { ok: false, error: "Nothing to sync." };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rows),
      redirect: "follow", // Apps Script answers through a redirect
      signal: AbortSignal.timeout(20_000),
    });
    const text = await res.text();
    if (!res.ok) {
      return { ok: false, error: `Google Sheets returned HTTP ${res.status}: ${text.slice(0, 150)}` };
    }
    try {
      const body = JSON.parse(text) as { status?: string; message?: string };
      if (body.status && body.status !== "success") {
        return { ok: false, error: `Google Sheets said: ${body.message ?? body.status}` };
      }
    } catch {
      // A non-JSON 200 still means the script ran.
    }
    return { ok: true, count: rows.length };
  } catch (err) {
    console.error("[google-sheets] sync failed", err);
    return { ok: false, error: "Could not reach Google Sheets. Please try again." };
  }
}

const money = (cents: number) => (cents / 100).toFixed(2);
const stamp = (iso: string) => new Date(iso).toISOString().replace("T", " ").slice(0, 19);

type Billing = Record<string, string | undefined>;

/** One sheet row per order item. */
export function orderItemRow(input: {
  orderId: string;
  billing: Billing;
  fallbackEmail: string;
  couponCode: string | null;
  discountCents: number;
  date: string;
  title: string;
  option: string;
  unitPriceCents: number;
  quantity: number;
}): SheetRow {
  const b = input.billing;
  return {
    source: "TaxProPath",
    order_id: input.orderId,
    name: [b.first_name, b.last_name].filter(Boolean).join(" "),
    email: b.email || input.fallbackEmail,
    mobile: b.phone ?? "",
    city: b.city ?? "",
    pincode: b.zip ?? "",
    coupon_code: input.couponCode ?? "",
    coupon_price: money(input.discountCents),
    price: money(input.unitPriceCents * input.quantity),
    date: stamp(input.date),
    product_detail: `${input.title} (${input.option})`,
    live_date: "N/A",
    demand_date: "N/A",
  };
}

/** One sheet row per order, items summarised — for abandoned checkouts. */
export function orderSummaryRow(input: {
  orderId: string;
  billing: Billing;
  fallbackEmail: string;
  couponCode: string | null;
  discountCents: number;
  totalCents: number;
  date: string;
  products: string;
}): SheetRow {
  const b = input.billing;
  return {
    source: "TaxProPath",
    order_id: input.orderId,
    name: [b.first_name, b.last_name].filter(Boolean).join(" "),
    email: b.email || input.fallbackEmail,
    mobile: b.phone ?? "",
    city: b.city ?? "",
    pincode: b.zip ?? "",
    coupon_code: input.couponCode ?? "",
    coupon_price: money(input.discountCents),
    price: money(input.totalCents),
    date: stamp(input.date),
    product_detail: input.products,
    live_date: "N/A",
    demand_date: "N/A",
  };
}
