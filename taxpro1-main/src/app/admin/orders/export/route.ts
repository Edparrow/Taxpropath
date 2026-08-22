import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

const FAILED_STATUSES = ["cancelled", "refunded"];

/** Streams the (optionally status-filtered) order list as a CSV download. */
export async function GET(request: Request) {
  await requireAdmin();
  const supabase = await createClient();

  const status = new URL(request.url).searchParams.get("status");

  let query = supabase
    .from("orders")
    .select(
      `id, status, subtotal_cents, discount_cents, coupon_code, currency, guest_email,
       paypal_capture_id, paid_at, created_at, billing`,
    )
    .order("created_at", { ascending: false });

  if (status === "failed") query = query.in("status", FAILED_STATUSES);
  else if (status && status !== "all") query = query.eq("status", status);

  const { data } = await query;
  const rows = data ?? [];

  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;

  const csv = [
    "order_id,status,subtotal,discount,total,currency,email,coupon,paypal_capture_id,created_at,paid_at",
    ...rows.map((o) => {
      const billing = (o.billing ?? {}) as Record<string, string>;
      const email = o.guest_email ?? billing.email ?? "";
      const total = (o.subtotal_cents - (o.discount_cents ?? 0)) / 100;
      return [
        o.id,
        o.status,
        (o.subtotal_cents / 100).toFixed(2),
        ((o.discount_cents ?? 0) / 100).toFixed(2),
        total.toFixed(2),
        o.currency,
        escape(email),
        o.coupon_code ?? "",
        o.paypal_capture_id ?? "",
        o.created_at,
        o.paid_at ?? "",
      ].join(",");
    }),
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders.csv"`,
    },
  });
}
