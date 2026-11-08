import "server-only";
import { NextResponse } from "next/server";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { feedKeyMatches } from "@/lib/engine";
import { ORDER_COLUMNS, customerEmail, orderTotalCents, unpaidCutoffIso, type OrderRow } from "@/lib/admin/orders";

/**
 * Shared body of /api/get_failed_orders and /api/get_abandoned_analysis:
 * unpaid checkouts older than the payment window, as SkillSync's CRM feeds.
 * `grouped` adds a per-customer summary (abandoned analysis).
 */
export async function unpaidFeed(request: Request, grouped: boolean) {
  const url = new URL(request.url);
  if (!feedKeyMatches(url.searchParams.get("api_key"), process.env.ORDERS_API_KEY)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured() || !hasServiceRoleKey()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const db = createAdminClient();
  let query = db
    .from("orders")
    .select(ORDER_COLUMNS)
    .is("deleted_at", null)
    .in("status", ["pending", "cancelled"])
    .lt("created_at", unpaidCutoffIso())
    .order("created_at", { ascending: false })
    .limit(2000);
  const since = url.searchParams.get("since");
  if (since && !Number.isNaN(Date.parse(since))) query = query.gte("created_at", new Date(since).toISOString());

  const { data, error } = await query;
  if (error) {
    console.error("[unpaid feed] query failed", error);
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }
  const unpaid = (data ?? []) as unknown as OrderRow[];

  const orders = unpaid.map((o) => {
    const b = o.billing ?? {};
    return {
      order_id: o.id,
      date: o.created_at,
      email: customerEmail(o),
      first_name: b.first_name ?? "",
      last_name: b.last_name ?? "",
      mobile: b.phone ?? "",
      city: b.city ?? "",
      zip: b.zip ?? "",
      ptin_number: b.ptin ?? "",
      coupon_code: o.coupon_code ?? "",
      total: (orderTotalCents(o) / 100).toFixed(2),
      products: o.order_items.map((i) => ({
        service_name: i.title_snapshot,
        sub_service: i.option_snapshot,
        price: (i.unit_price_cents / 100).toFixed(2),
      })),
    };
  });

  if (!grouped) return NextResponse.json({ orders });

  // Did the same person pay later? Then the abandonment was recovered.
  const { data: paidRows } = await db
    .from("orders")
    .select("billing, guest_email, paid_at")
    .eq("status", "paid")
    .is("deleted_at", null);
  const paidAt = new Map<string, string>();
  for (const p of (paidRows ?? []) as { billing: Record<string, string> | null; guest_email: string | null; paid_at: string | null }[]) {
    const email = (p.billing?.email || p.guest_email || "").toLowerCase();
    if (email && p.paid_at && (!paidAt.has(email) || p.paid_at > paidAt.get(email)!)) paidAt.set(email, p.paid_at);
  }

  const customers = new Map<string, { email: string; name: string; attempts: number; last_attempt: string; recovered: boolean }>();
  for (const o of orders) {
    const c = customers.get(o.email) ?? {
      email: o.email,
      name: `${o.first_name} ${o.last_name}`.trim(),
      attempts: 0,
      last_attempt: o.date,
      recovered: false,
    };
    c.attempts += 1;
    if (o.date > c.last_attempt) c.last_attempt = o.date;
    c.recovered = (paidAt.get(o.email) ?? "") > c.last_attempt;
    customers.set(o.email, c);
  }

  return NextResponse.json({ orders, customers: [...customers.values()] });
}
