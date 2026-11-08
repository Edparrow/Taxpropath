import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { toCsv } from "@/lib/csv";
import {
  ORDER_COLUMNS,
  customerEmail,
  customerName,
  orderTotalCents,
  productsSummary,
  type OrderRow,
} from "@/lib/admin/orders";

/** Completed (paid and refunded) orders as a CSV download. */
export async function GET() {
  await requireAdmin("orders");
  const supabase = await createClient();

  const { data } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .is("deleted_at", null)
    .in("status", ["paid", "refunded"])
    .order("paid_at", { ascending: false });
  const orders = (data ?? []) as unknown as OrderRow[];

  const csv = toCsv(
    [
      "order_id", "status", "paid_at", "name", "email", "phone", "ptin", "products",
      "subtotal", "discount", "total", "coupon", "payment", "payment_ref", "remarks",
    ],
    orders.map((o) => [
      o.id,
      o.status,
      o.paid_at ?? "",
      customerName(o),
      customerEmail(o),
      o.billing?.phone ?? "",
      o.billing?.ptin ?? "",
      productsSummary(o),
      (o.subtotal_cents / 100).toFixed(2),
      ((o.discount_cents ?? 0) / 100).toFixed(2),
      (orderTotalCents(o) / 100).toFixed(2),
      o.coupon_code ?? "",
      o.payment_method,
      o.paypal_capture_id ?? "",
      o.remarks ?? "",
    ]),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="completed-orders.csv"`,
    },
  });
}
