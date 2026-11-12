import Link from "next/link";
import { Receipt } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { can } from "@/lib/admin/permissions";
import {
  ORDER_COLUMNS,
  UNPAID_AFTER_MINUTES,
  customerEmail,
  customerName,
  orderTotalCents,
  shortDate,
  unpaidCutoffIso,
  type OrderRow,
} from "@/lib/admin/orders";
import { formatPrice } from "@/lib/utils";
import {
  describeEvent,
  failureReason,
  isFailureEvent,
  loadJourneys,
  type JourneyEvent,
} from "@/lib/admin/checkout-journey";
import { deleteUnpaidOrder, markOrderPaid } from "../actions";

export const metadata = { title: "Failed Orders" };

export default async function FailedOrdersPage() {
  const admin = await requireAdmin("failed_orders");
  const canEdit = can(admin, "failed_orders", "edit");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(`${ORDER_COLUMNS}, failure_reason, failure_code, failed_at`)
    .is("deleted_at", null)
    .in("status", ["pending", "cancelled"])
    // Old enough to count as failed, or already known to have failed
    // (cancelled at PayPal, declined, error), which shows straight away.
    .or(`created_at.lt."${unpaidCutoffIso()}",failure_reason.not.is.null`)
    .order("created_at", { ascending: false })
    .limit(500);
  const orders = (data ?? []) as unknown as (OrderRow & {
    failure_reason: string | null;
    failure_code: string | null;
  })[];
  const journeys = await loadJourneys(
    supabase,
    orders.map((o) => o.id),
  );

  return (
    <>
      <h1 className="text-2xl font-extrabold text-navy-950 dark:text-white">Failed Orders</h1>
      <p className="mt-1 text-[14px] text-ink-muted">
        Checkouts that started but were never paid (cancelled at PayPal, or still unpaid after{" "}
        {UNPAID_AFTER_MINUTES} minutes), with the reason and every step the customer took. If one
        was paid another way, mark it paid to send it to the customer&rsquo;s portal.
      </p>

      {error && (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-800">
          Could not load orders: {error.message}
        </p>
      )}

      {!error && orders.length === 0 && (
        <p className="mt-8 rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center text-[14px] text-ink-muted">
          No failed orders.
        </p>
      )}

      {orders.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full min-w-[1100px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
              <tr className="text-[12px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Reason</th>
                <th className="px-5 py-3">Items</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {orders.map((o) => (
                <tr key={o.id} className="align-top text-[14px]">
                  <td className="px-5 py-4">
                    <p className="font-mono text-[13px] font-semibold text-navy-950 dark:text-white">{o.id.slice(0, 8)}</p>
                    <p className="mt-0.5 text-[12.5px] text-ink-muted">{shortDate(o.created_at)}</p>
                    <span className="mt-1 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold capitalize text-amber-800">
                      {o.status === "pending" ? "Unpaid" : o.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {customerName(o) && <p className="font-semibold text-navy-950 dark:text-white">{customerName(o)}</p>}
                    <p className="text-[13px] text-ink-muted">{customerEmail(o) || "—"}</p>
                    {o.billing?.phone && <p className="text-[12.5px] text-ink-muted">{o.billing.phone}</p>}
                  </td>
                  <td className="max-w-[340px] px-5 py-4">
                    <Reason
                      reason={failureReason(o, journeys.get(o.id) ?? [])}
                      journey={journeys.get(o.id) ?? []}
                    />
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
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 font-bold tabular-nums text-navy-950 dark:text-white">
                    {formatPrice(orderTotalCents(o))}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col items-end gap-2">
                      <Link
                        href={`/admin/orders/${o.id}/invoice`}
                        target="_blank"
                        aria-label="View order"
                        className="inline-flex items-center justify-center rounded-lg border border-slate-300 p-1.5 text-navy-950 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100"
                      >
                        <Receipt className="size-3.5" aria-hidden />
                      </Link>
                      {canEdit && (
                        <>
                          <form action={markOrderPaid} className="flex gap-1.5">
                            <input type="hidden" name="id" value={o.id} />
                            <input
                              name="reference"
                              placeholder="Payment ref (optional)"
                              className="w-44 rounded-lg border border-slate-300 px-2.5 py-1.5 text-[12.5px] outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900"
                            />
                            <button className="cursor-pointer rounded-lg bg-brand-600 px-3 py-1.5 text-[12.5px] font-bold text-white hover:bg-brand-700">
                              Mark paid
                            </button>
                          </form>
                          <form action={deleteUnpaidOrder}>
                            <input type="hidden" name="id" value={o.id} />
                            <button className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-[12.5px] font-semibold text-red-700 hover:border-red-300 hover:bg-red-50 dark:border-slate-700">
                              Delete
                            </button>
                          </form>
                        </>
                      )}
                    </div>
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

const timeFmt = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });

/** The reason badge, plus the customer's step-by-step checkout timeline. */
function Reason({
  reason,
  journey,
}: {
  reason: { reason: string; code: string | null; known: boolean };
  journey: JourneyEvent[];
}) {
  return (
    <div>
      <p
        className={`rounded-lg px-2.5 py-1.5 text-[13px] font-semibold leading-snug ${
          reason.known
            ? "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200"
            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
        }`}
      >
        {reason.reason}
      </p>
      {reason.code && (
        <p className="mt-1 font-mono text-[11px] text-ink-muted">{reason.code}</p>
      )}
      {journey.length > 0 && (
        <details className="group mt-2">
          <summary className="cursor-pointer text-[12.5px] font-semibold text-brand-700 hover:underline dark:text-brand-400">
            Checkout timeline ({journey.length} steps)
          </summary>
          <ol className="mt-2 space-y-1.5 border-l-2 border-slate-200 pl-3 dark:border-slate-700">
            {journey.map((e) => (
              <li key={e.id} className="relative text-[12.5px] leading-snug">
                <span
                  aria-hidden
                  className={`absolute -left-[17px] top-1.5 size-2 rounded-full ${
                    e.event === "paid"
                      ? "bg-brand-500"
                      : isFailureEvent(e)
                        ? "bg-red-500"
                        : "bg-slate-400"
                  }`}
                />
                <span className="text-ink-muted">{timeFmt(e.created_at)} ET</span>
                <span className={`ml-1.5 ${isFailureEvent(e) ? "font-semibold text-red-700 dark:text-red-300" : "text-navy-950 dark:text-slate-100"}`}>
                  {describeEvent(e)}
                </span>
                {e.code && isFailureEvent(e) && (
                  <span className="ml-1 font-mono text-[11px] text-ink-muted">({e.code})</span>
                )}
              </li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}
