import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/*
 * The order feed for Ravit's CRM (GET /api/get_orders, brief of 12 Nov 2026).
 *
 * One row per course bought (its add-ons folded into `sub_service`). Each row
 * is frozen in `order_feed` the first time it is served and is returned
 * exactly like that ever after (rule 4), whatever later happens to the order
 * (edits, refund, soft delete). `item_id` is the frozen row's own number, so
 * it is unique and never reused (rule 3). Test (PayPal sandbox) orders only
 * ever appear with the test key (rule 5).
 */

export type FeedRow = {
  item_id: string;
  order_id: string;
  service_id: string;
  service_name: string;
  sub_service: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  city: string;
  price: string;
  qty: string;
  coupon_code: string;
  trans_id: string;
  ptin_number: string;
  date: string;
  live_date: null;
};

type ItemRow = {
  course_slug: string;
  option_code: string | null;
  quantity: number;
  unit_price_cents: number;
  title_snapshot: string;
};

type OrderRow = {
  id: string;
  is_test: boolean;
  paid_at: string;
  billing: Record<string, string> | null;
  guest_email: string | null;
  coupon_code: string | null;
  paypal_capture_id: string | null;
  order_items: ItemRow[];
};

// Rule 7: only these words, in this order, joined with " + ".
const SUB_SERVICE: [code: string, word: string][] = [
  ["SELF_STUDY", "Self-Study"],
  ["ETRANSCRIPT", "e-Transcript"],
  ["SLIDES", "Slides"],
];

/** Rule 8: "YYYY-MM-DD HH:MM:SS", in UTC. */
export function feedDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 19).replace("T", " ");
}

const clean = (value: string | null | undefined) => (value ?? "").trim();

/** Builds the row for one course of one paid order (not yet frozen). */
function buildRow(
  order: OrderRow,
  items: ItemRow[],
  serviceNo: number | null,
): Omit<FeedRow, "item_id"> {
  const billing = order.billing ?? {};
  const codes = new Set(items.map((i) => i.option_code ?? ""));
  const sub = SUB_SERVICE.filter(([code]) => codes.has(code)).map(([, word]) => word);
  const unknown = [...codes].filter((c) => !SUB_SERVICE.some(([code]) => code === c));
  if (unknown.length) {
    console.warn("[order-feed] option codes outside Self-Study/e-Transcript/Slides", order.id, unknown);
  }
  const cents = items.reduce((sum, i) => sum + i.unit_price_cents * i.quantity, 0);

  return {
    order_id: order.id,
    service_id: serviceNo ? String(serviceNo) : "",
    service_name: `${items[0].title_snapshot} — Self-Study`,
    sub_service: sub.join(" + "),
    first_name: clean(billing.first_name),
    last_name: clean(billing.last_name),
    email: (clean(billing.email) || clean(order.guest_email)).toLowerCase(),
    mobile: clean(billing.phone),
    city: clean(billing.city),
    price: (cents / 100).toFixed(2),
    qty: "1",
    coupon_code: clean(order.coupon_code),
    trans_id: clean(order.paypal_capture_id),
    ptin_number: clean(billing.ptin),
    date: feedDate(order.paid_at),
    live_date: null,
  };
}

/**
 * Freezes rows for any paid order not yet in the feed, then returns every
 * frozen row for the requested side (live or test), oldest first.
 */
export async function readOrderFeed(db: SupabaseClient, test: boolean): Promise<FeedRow[]> {
  // 1. Paid (or later refunded) orders on this side of the feed.
  const { data: orders, error } = await db
    .from("orders")
    .select(
      `id, is_test, paid_at, billing, guest_email, coupon_code, paypal_capture_id,
       order_items ( course_slug, option_code, quantity, unit_price_cents, title_snapshot )`,
    )
    .in("status", ["paid", "refunded"])
    .is("deleted_at", null)
    .not("paid_at", "is", null)
    .eq("is_test", test)
    .order("paid_at", { ascending: true });
  if (error) throw error;

  // 2. Which (order, course) rows are already frozen.
  const { data: frozen, error: frozenError } = await db
    .from("order_feed")
    .select("order_id, course_slug")
    .eq("is_test", test);
  if (frozenError) throw frozenError;
  const done = new Set((frozen ?? []).map((f) => `${f.order_id}|${f.course_slug}`));

  // 3. Freeze the new ones, oldest payment first so item_id follows time.
  const fresh: { order: OrderRow; slug: string; items: ItemRow[] }[] = [];
  for (const order of (orders ?? []) as unknown as OrderRow[]) {
    const bySlug = new Map<string, ItemRow[]>();
    for (const item of order.order_items) {
      if (!bySlug.has(item.course_slug)) bySlug.set(item.course_slug, []);
      bySlug.get(item.course_slug)!.push(item);
    }
    for (const [slug, items] of bySlug) {
      if (!done.has(`${order.id}|${slug}`)) fresh.push({ order, slug, items });
    }
  }

  if (fresh.length > 0) {
    const slugs = [...new Set(fresh.map((f) => f.slug))];
    const { data: courses } = await db.from("courses").select("slug, service_no").in("slug", slugs);
    const serviceNo = new Map((courses ?? []).map((c) => [c.slug as string, c.service_no as number]));

    for (const f of fresh) {
      // One at a time so item numbers come out in payment order; a clash
      // (another request froze it first) is ignored.
      const { error: insertError } = await db
        .from("order_feed")
        .upsert(
          {
            order_id: f.order.id,
            course_slug: f.slug,
            is_test: test,
            row: buildRow(f.order, f.items, serviceNo.get(f.slug) ?? null),
          },
          { onConflict: "order_id,course_slug", ignoreDuplicates: true },
        );
      if (insertError) throw insertError;
    }
  }

  // 4. Everything frozen on this side, exactly as first served.
  const { data: rows, error: rowsError } = await db
    .from("order_feed")
    .select("item_no, row")
    .eq("is_test", test)
    .order("item_no", { ascending: true });
  if (rowsError) throw rowsError;

  // jsonb doesn't keep key order; lay each row out in the brief's order.
  return (rows ?? []).map((r) => {
    const row = { item_id: String(r.item_no), ...(r.row as Omit<FeedRow, "item_id">) };
    return Object.fromEntries(FIELD_ORDER.map((k) => [k, row[k]])) as FeedRow;
  });
}

const FIELD_ORDER: (keyof FeedRow)[] = [
  "item_id",
  "order_id",
  "service_id",
  "service_name",
  "sub_service",
  "first_name",
  "last_name",
  "email",
  "mobile",
  "city",
  "price",
  "qty",
  "coupon_code",
  "trans_id",
  "ptin_number",
  "date",
  "live_date",
];
