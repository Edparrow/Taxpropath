import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { formatPrice } from "@/lib/utils";
import { PrintButton } from "./print-button";

export const metadata = { title: "Invoice" };

type Row = {
  id: string;
  status: string;
  subtotal_cents: number;
  discount_cents: number | null;
  coupon_code: string | null;
  currency: string;
  guest_email: string | null;
  paid_at: string | null;
  created_at: string;
  billing: Record<string, string> | null;
  order_items: {
    title_snapshot: string;
    option_snapshot: string;
    quantity: number;
    unit_price_cents: number;
  }[];
};

/**
 * Browser-native "print → save as PDF" rather than a server-generated PDF —
 * that would need a new runtime dependency (e.g. a headless Chromium via
 * puppeteer) with real hosting-footprint cost on a small VPS. This gets the
 * same outcome (a PDF the admin can save/print) with none of that weight.
 */
export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("orders")
    .select(
      `id, status, subtotal_cents, discount_cents, coupon_code, currency, guest_email,
       paid_at, created_at, billing,
       order_items ( title_snapshot, option_snapshot, quantity, unit_price_cents )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const order = data as unknown as Row;
  const billing = order.billing ?? {};
  const total = order.subtotal_cents - (order.discount_cents ?? 0);

  return (
    <div className="mx-auto max-w-2xl bg-white p-10 print:p-0">
      <div className="mb-8 flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-extrabold text-navy-950">Invoice</h1>
        <PrintButton />
      </div>

      <div className="rounded-2xl border border-slate-200 p-8 print:border-none print:p-0">
        <div className="flex items-start justify-between border-b border-slate-200 pb-6">
          <div>
            <p className="text-xl font-extrabold text-navy-950">Taxpropath</p>
            <p className="mt-1 text-[13px] text-ink-muted">support@taxpropath.com</p>
          </div>
          <div className="text-right">
            <p className="text-[12px] font-bold uppercase tracking-wider text-slate-500">
              Invoice
            </p>
            <p className="mt-1 font-mono text-[13px] text-navy-950">{order.id}</p>
            <p className="mt-1 text-[13px] text-ink-muted">
              {new Date(order.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 py-6">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-wider text-slate-500">
              Billed to
            </p>
            <p className="mt-1.5 text-[14.5px] font-semibold text-navy-950">
              {[billing.first_name, billing.last_name].filter(Boolean).join(" ") || "—"}
            </p>
            <p className="text-[14px] text-ink-muted">
              {order.guest_email ?? billing.email ?? "—"}
            </p>
            {billing.company && (
              <p className="text-[14px] text-ink-muted">{billing.company}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[12px] font-bold uppercase tracking-wider text-slate-500">
              Status
            </p>
            <p className="mt-1.5 text-[14.5px] font-semibold capitalize text-navy-950">
              {order.status}
            </p>
            {order.paid_at && (
              <p className="text-[13px] text-ink-muted">
                Paid{" "}
                {new Date(order.paid_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </div>

        <table className="w-full border-t border-slate-200 text-left">
          <thead>
            <tr className="text-[12px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3">Item</th>
              <th className="py-3 text-right">Qty</th>
              <th className="py-3 text-right">Price</th>
              <th className="py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.order_items.map((item, i) => (
              <tr key={i} className="text-[14px]">
                <td className="py-3">
                  <p className="font-semibold text-navy-950">{item.title_snapshot}</p>
                  <p className="text-[12.5px] text-ink-muted">{item.option_snapshot}</p>
                </td>
                <td className="py-3 text-right tabular-nums text-ink-muted">
                  {item.quantity}
                </td>
                <td className="py-3 text-right tabular-nums text-ink-muted">
                  {formatPrice(item.unit_price_cents)}
                </td>
                <td className="py-3 text-right tabular-nums font-semibold text-navy-950">
                  {formatPrice(item.unit_price_cents * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto mt-4 w-56 space-y-2 border-t border-slate-200 pt-4">
          <div className="flex justify-between text-[14px]">
            <span className="text-ink-muted">Subtotal</span>
            <span className="font-semibold text-navy-950">
              {formatPrice(order.subtotal_cents)}
            </span>
          </div>
          {order.discount_cents ? (
            <div className="flex justify-between text-[14px]">
              <span className="text-ink-muted">
                Discount {order.coupon_code ? `(${order.coupon_code})` : ""}
              </span>
              <span className="font-semibold text-brand-700">
                −{formatPrice(order.discount_cents)}
              </span>
            </div>
          ) : null}
          <div className="flex justify-between text-base">
            <span className="font-bold text-navy-950">Total</span>
            <span className="font-extrabold text-navy-950">{formatPrice(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
