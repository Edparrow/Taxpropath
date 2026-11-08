import Link from "next/link";
import { Download, Plus } from "lucide-react";
import { OrderRowActions } from "./order-row-actions";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { can } from "@/lib/admin/permissions";
import {
  ORDER_COLUMNS,
  customerEmail,
  customerName,
  orderTotalCents,
  shortDate,
  type OrderRow,
} from "@/lib/admin/orders";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Completed Orders" };

export default async function CompletedOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const admin = await requireAdmin("orders");
  const canEdit = can(admin, "orders", "edit");
  const { q = "" } = await searchParams;
  const search = q.trim().toLowerCase();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .is("deleted_at", null)
    .in("status", ["paid", "refunded"])
    .order("paid_at", { ascending: false })
    .limit(500);

  const all = (data ?? []) as unknown as OrderRow[];
  const orders = search
    ? all.filter(
        (o) =>
          customerEmail(o).includes(search) ||
          customerName(o).toLowerCase().includes(search) ||
          o.id.startsWith(search),
      )
    : all;
  const revenue = orders
    .filter((o) => o.status === "paid")
    .reduce((sum, o) => sum + orderTotalCents(o), 0);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-navy-950 dark:text-white">Completed Orders</h1>
        <div className="flex gap-2">
          {canEdit && (
            <Link
              href="/admin/orders/new"
              className="flex items-center gap-2 rounded-full bg-brand-gradient shadow-md shadow-brand-600/20 px-5 py-2.5 text-[14px] font-bold text-white transition-transform duration-200 hover:-translate-y-0.5"
            >
              <Plus className="size-4" aria-hidden />
              Manual order
            </Link>
          )}
          <Link
            href="/admin/orders/export"
            className="flex items-center gap-2 rounded-full border border-slate-300 px-5 py-2.5 text-[14px] font-bold text-navy-950 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100"
          >
            <Download className="size-4" aria-hidden />
            Export CSV
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Orders" value={String(orders.length)} />
        <Stat label="Paid" value={String(orders.filter((o) => o.status === "paid").length)} />
        <Stat label="Revenue" value={formatPrice(revenue)} />
      </div>

      <form className="mt-6 flex max-w-md gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name, email or order id"
          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-[14px] outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <button className="cursor-pointer rounded-xl bg-navy-950 px-4 text-[13.5px] font-bold text-white">Search</button>
      </form>

      {error && (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-800">
          Could not load orders: {error.message}
        </p>
      )}

      {!error && orders.length === 0 && (
        <p className="mt-8 rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center text-[14px] text-ink-muted">
          {search ? "No orders match that search." : "No completed orders yet."}
        </p>
      )}

      {orders.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full min-w-[900px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
              <tr className="text-[12px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Items</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {orders.map((o) => (
                <tr key={o.id} className="align-top text-[14px]">
                  <td className="px-5 py-4">
                    <p className="font-mono text-[13px] font-semibold text-navy-950 dark:text-white">{o.id.slice(0, 8)}</p>
                    <p className="mt-0.5 text-[12.5px] text-ink-muted">{shortDate(o.paid_at ?? o.created_at)}</p>
                    {o.status === "refunded" && (
                      <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                        Refunded
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {customerName(o) && <p className="font-semibold text-navy-950 dark:text-white">{customerName(o)}</p>}
                    <p className="text-[13px] text-ink-muted">{customerEmail(o) || "—"}</p>
                  </td>
                  <td className="px-5 py-4">
                    <ul className="space-y-1">
                      {o.order_items.map((item) => (
                        <li key={item.id} className="text-[13px] leading-snug">
                          <span className="text-navy-950 dark:text-slate-100">{item.title_snapshot}</span>
                          <span className="text-ink-muted"> — {item.option_snapshot}</span>
                        </li>
                      ))}
                    </ul>
                    {o.remarks && <p className="mt-1 text-[12px] italic text-ink-muted">{o.remarks}</p>}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 font-bold tabular-nums text-navy-950 dark:text-white">
                    {formatPrice(orderTotalCents(o))}
                    {o.coupon_code && (
                      <span className="mt-1 block font-mono text-[11.5px] font-semibold text-brand-700">{o.coupon_code}</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-bold ${
                        o.payment_method === "manual" ? "bg-amber-50 text-amber-800" : "bg-brand-50 text-brand-700"
                      }`}
                    >
                      {o.payment_method === "manual" ? "Manual" : "PayPal"}
                    </span>
                    <p className="mt-1 font-mono text-[11.5px] text-ink-muted">{o.paypal_capture_id ?? "—"}</p>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <OrderRowActions orderId={o.id} canEdit={canEdit} adminName={admin.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-[12.5px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tabular-nums text-navy-950 dark:text-white">{value}</p>
    </div>
  );
}
