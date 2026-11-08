import { NextResponse } from "next/server";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { feedKeyMatches } from "@/lib/engine";

export const dynamic = "force-dynamic";

/**
 * Order feed for the CRM and the course engine (join.us-cpe.com) (3 Nov 2026 brief).
 * GET /api/get_orders?api_key=…[&since=ISO]
 *
 * One row per order item, paid orders only. Refunded orders keep flowing with
 * refunded_at set and action=refund so the consumers can revoke access.
 * The pull is the truth; the capture-time doorbell is only a hurry-up.
 */

type ItemRow = {
  id: string;
  course_slug: string;
  option_code: string | null;
  option_snapshot: string;
  title_snapshot: string;
  quantity: number;
  unit_price_cents: number;
};

type OrderRow = {
  id: string;
  status: string;
  paid_at: string | null;
  refunded_at: string | null;
  billing: Record<string, string> | null;
  coupon_code: string | null;
  paypal_capture_id: string | null;
  order_items: ItemRow[];
};

const SUB_SERVICE: Record<string, string> = {
  SELF_STUDY: "Self-Study",
  ETRANSCRIPT: "e-Transcript",
  SLIDES: "Slides",
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (!feedKeyMatches(url.searchParams.get("api_key"), process.env.ORDERS_API_KEY)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured() || !hasServiceRoleKey()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const admin = createAdminClient();
  let query = admin
    .from("orders")
    .select(
      `id, status, paid_at, refunded_at, billing, coupon_code, paypal_capture_id,
       order_items ( id, course_slug, option_code, option_snapshot, title_snapshot,
                     quantity, unit_price_cents )`,
    )
    .in("status", ["paid", "refunded"])
    .is("deleted_at", null)
    .not("paid_at", "is", null)
    .order("paid_at", { ascending: true });

  const since = url.searchParams.get("since");
  if (since && !Number.isNaN(Date.parse(since))) {
    query = query.gte("paid_at", new Date(since).toISOString());
  }

  const { data, error } = await query;
  if (error) {
    console.error("[get_orders] query failed", error);
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }

  // service_id / crm_service_id come from the courses table, joined
  // by slug since order_items stores the slug snapshot.
  const slugs = [
    ...new Set(
      (data as unknown as OrderRow[]).flatMap((o) =>
        o.order_items.map((i) => i.course_slug),
      ),
    ),
  ];
  const serviceBySlug = new Map<
    string,
    { id: string; engine_delivery_id: string | null }
  >();
  if (slugs.length > 0) {
    const { data: services } = await admin
      .from("courses")
      .select("id, slug, engine_delivery_id")
      .in("slug", slugs);
    for (const s of services ?? []) {
      serviceBySlug.set(s.slug as string, {
        id: s.id as string,
        engine_delivery_id: (s.engine_delivery_id as string | null) ?? null,
      });
    }
  }

  const orders = (data as unknown as OrderRow[]).flatMap((order) => {
    const billing = order.billing ?? {};
    return order.order_items.map((item) => {
      const service = serviceBySlug.get(item.course_slug);
      return {
        item_id: item.id,
        order_id: order.id,
        date: order.paid_at,
        live_date: "",
        email: billing.email ?? "",
        first_name: billing.first_name ?? "",
        last_name: billing.last_name ?? "",
        mobile: billing.phone ?? "",
        city: billing.city ?? "",
        ptin_number: billing.ptin ?? "",
        service_name: item.title_snapshot,
        sub_service:
          (item.option_code && SUB_SERVICE[item.option_code]) || item.option_snapshot,
        price: (item.unit_price_cents / 100).toFixed(2),
        qty: item.quantity,
        coupon_code: order.coupon_code ?? "",
        trans_id: order.paypal_capture_id ?? "",
        service_id: service?.id ?? "",
        crm_service_id: service?.engine_delivery_id ?? "",
        action: order.status === "refunded" ? "refund" : "paid",
        refunded_at: order.refunded_at ?? "",
      };
    });
  });

  return NextResponse.json({ orders });
}
