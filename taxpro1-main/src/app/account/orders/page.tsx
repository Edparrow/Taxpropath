import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PORTAL_URL } from "@/lib/portal";
import { formatPrice } from "@/lib/utils";
import { getMyOrders, myOrderTotalCents, requireCustomer, shortDate } from "@/lib/account";

export const metadata: Metadata = { title: "My Orders", robots: { index: false } };

export default async function MyOrdersPage() {
  const user = await requireCustomer("/account/orders");
  const orders = await getMyOrders(user);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-extrabold text-navy-950">My Orders</h2>
        {orders.length > 0 && (
          <a
            href={PORTAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-navy-950 px-4 py-2 text-[13px] font-bold text-white transition-colors duration-200 hover:bg-brand-600"
          >
            Open My Portal
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-slate-300 px-6 py-16 text-center">
          <p className="text-[15px] font-semibold text-navy-950">You haven&rsquo;t bought a course yet.</p>
          <Link
            href="/courses"
            className="mt-4 inline-flex rounded-full bg-brand-gradient px-6 py-2.5 text-[14px] font-bold text-white shadow-md shadow-brand-600/20"
          >
            Browse Courses
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-1 text-[14px] text-ink-muted">
            Your courses play in your learning portal. Use the same email to sign in there.
          </p>
          <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200">
            <table className="w-full min-w-[640px] text-left">
              <thead className="border-b border-slate-200 bg-cream">
                <tr className="text-[12px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Products</th>
                  <th className="px-5 py-3">Transaction ID</th>
                  <th className="px-5 py-3 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.id} className="align-top text-[14px]">
                    <td className="px-5 py-4">
                      <p className="font-mono text-[13px] font-semibold uppercase text-navy-950">
                        #{o.id.slice(0, 8)}
                      </p>
                      <p className="mt-0.5 text-[12.5px] text-ink-muted">{shortDate(o.paid_at ?? o.created_at)}</p>
                      {o.status === "refunded" && (
                        <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                          Refunded
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <ul className="space-y-1">
                        {o.order_items.map((item) => (
                          <li key={item.id} className="leading-snug">
                            <span className="font-semibold text-navy-950">{item.title_snapshot}</span>
                            <span className="text-ink-muted"> — {item.option_snapshot}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-5 py-4 font-mono text-[12.5px] text-ink-muted">
                      {o.paypal_capture_id ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right font-bold tabular-nums text-navy-950">
                      {formatPrice(myOrderTotalCents(o))}
                      {o.coupon_code && (
                        <span className="mt-1 block font-mono text-[11.5px] font-semibold text-brand-700">
                          {o.coupon_code}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
