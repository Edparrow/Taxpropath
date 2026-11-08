import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { toCsv } from "@/lib/csv";
import { ORDER_COLUMNS, customerEmail, customerName, type OrderRow } from "@/lib/admin/orders";

/** The Order Sheet (one row per item bought) as a CSV download. */
export async function GET() {
  await requireAdmin("order_sheet");
  const supabase = await createClient();

  const { data } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .is("deleted_at", null)
    .eq("status", "paid")
    .order("paid_at", { ascending: false });
  const orders = (data ?? []) as unknown as OrderRow[];

  const csv = toCsv(
    [
      "order_id", "paid_at", "name", "email", "phone", "ptin", "city", "zip", "course", "item",
      "price", "coupon", "discount", "payment", "payment_ref", "portal_access_sent", "certificate_sent",
    ],
    orders.flatMap((o) =>
      o.order_items.map((i) => [
        o.id,
        o.paid_at ?? "",
        customerName(o),
        customerEmail(o),
        o.billing?.phone ?? "",
        o.billing?.ptin ?? "",
        o.billing?.city ?? "",
        o.billing?.zip ?? "",
        i.title_snapshot,
        i.option_snapshot,
        ((i.unit_price_cents * i.quantity) / 100).toFixed(2),
        o.coupon_code ?? "",
        ((o.discount_cents ?? 0) / 100).toFixed(2),
        o.payment_method,
        o.paypal_capture_id ?? "",
        i.portal_access_sent ? "yes" : "no",
        i.certificate_sent ? "yes" : "no",
      ]),
    ),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="order-sheet.csv"`,
    },
  });
}
