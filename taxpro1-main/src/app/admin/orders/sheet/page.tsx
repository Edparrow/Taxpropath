import Link from "next/link";
import { Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { can } from "@/lib/admin/permissions";
import {
  ORDER_COLUMNS,
  customerEmail,
  customerName,
  shortDate,
  type OrderRow,
} from "@/lib/admin/orders";
import { formatPrice } from "@/lib/utils";
import { SyncButtons } from "../../sync-buttons";
import { syncOrderSheet } from "../actions";
import { ChecklistBox } from "./checklist-box";

export const metadata = { title: "Order Sheet" };

/** One row per item bought, with the fulfilment checklist. */
export default async function OrderSheetPage() {
  const admin = await requireAdmin("order_sheet");
  const canEdit = can(admin, "order_sheet", "edit");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .is("deleted_at", null)
    .eq("status", "paid")
    .order("paid_at", { ascending: false })
    .limit(1000);
  const orders = (data ?? []) as unknown as OrderRow[];
  const rows = orders.flatMap((o) => o.order_items.map((item) => ({ order: o, item })));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-950 dark:text-white">Order Sheet</h1>
          <p className="mt-1 text-[14px] text-ink-muted">
            {rows.length} item{rows.length === 1 ? "" : "s"} bought. Tick each one off as the portal access and
            certificate go out.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canEdit && rows.length > 0 && <SyncButtons group="sheet" action={syncOrderSheet} />}
          <Link
            href="/admin/orders/sheet/export"
            className="flex items-center gap-1.5 rounded-full border border-slate-300 px-4 py-2 text-[13px] font-bold text-navy-950 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100"
          >
            <Download className="size-3.5" aria-hidden />
            Download CSV
          </Link>
        </div>
      </div>

      {error && (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-800">
          Could not load the sheet: {error.message}
        </p>
      )}

      {rows.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center text-[14px] text-ink-muted">
          Nothing bought yet.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full min-w-[1100px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
              <tr className="text-[12px] font-bold uppercase tracking-wider text-slate-500">
                <th className="w-10 px-4 py-3" />
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">PTIN</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Coupon</th>
                <th className="px-4 py-3">Payment ref</th>
                <th className="px-4 py-3 text-center">Portal access</th>
                <th className="px-4 py-3 text-center">Certificate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map(({ order: o, item }) => (
                <tr key={item.id} className="align-top text-[13.5px]">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      data-sync="sheet"
                      value={item.id}
                      aria-label="Select row"
                      className="size-4 accent-brand-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-mono text-[12.5px] font-semibold text-navy-950 dark:text-white">{o.id.slice(0, 8)}</p>
                    <p className="text-[12px] text-ink-muted">{shortDate(o.paid_at ?? o.created_at)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-navy-950 dark:text-white">{customerName(o) || "—"}</p>
                    <p className="text-[12.5px] text-ink-muted">{customerEmail(o)}</p>
                    {o.billing?.phone && <p className="text-[12px] text-ink-muted">{o.billing.phone}</p>}
                  </td>
                  <td className="px-4 py-3 font-mono text-[12.5px] text-ink-muted">{o.billing?.ptin || "—"}</td>
                  <td className="px-4 py-3 text-navy-950 dark:text-slate-100">{item.title_snapshot}</td>
                  <td className="px-4 py-3 text-ink-muted">{item.option_snapshot}</td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-navy-950 dark:text-white">
                    {formatPrice(item.unit_price_cents * item.quantity)}
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-ink-muted">{o.coupon_code ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-ink-muted">
                    {o.paypal_capture_id ?? (o.payment_method === "manual" ? "manual" : "—")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ChecklistBox
                      itemId={item.id}
                      field="portal_access_sent"
                      checked={item.portal_access_sent}
                      label="Portal access sent"
                      disabled={!canEdit}
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ChecklistBox
                      itemId={item.id}
                      field="certificate_sent"
                      checked={item.certificate_sent}
                      label="Certificate sent"
                      disabled={!canEdit}
                    />
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
