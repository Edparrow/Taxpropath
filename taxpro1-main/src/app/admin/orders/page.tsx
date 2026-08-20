import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Orders" };

type Row = {
  id: string;
  status: string;
  subtotal_cents: number;
  currency: string;
  guest_email: string | null;
  paypal_capture_id: string | null;
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

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-brand-50 text-brand-700",
  pending: "bg-amber-50 text-amber-800",
  refunded: "bg-slate-100 text-slate-600",
  cancelled: "bg-slate-100 text-slate-600",
};

/*
 * The reference admin splits these into "Manage Completed Order" and "Manage
 * Failed Order"; one screen with a status filter covers both plus the states
 * they omit (pending, refunded).
 */
const TABS = [
  { key: "all", label: "All orders" },
  { key: "paid", label: "Completed" },
  { key: "pending", label: "Pending" },
  { key: "failed", label: "Failed" },
] as const;

/** Anything not paid or awaiting payment is a failed/dead order. */
const FAILED_STATUSES = ["cancelled", "refunded"];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();

  const { status } = await searchParams;
  const active = TABS.some((t) => t.key === status) ? status! : "all";

  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select(
      `id, status, subtotal_cents, currency, guest_email, paypal_capture_id,
       paid_at, created_at, billing,
       order_items ( title_snapshot, option_snapshot, quantity, unit_price_cents )`,
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (active === "failed") query = query.in("status", FAILED_STATUSES);
  else if (active !== "all") query = query.eq("status", active);

  const { data, error } = await query;

  const orders = (data ?? []) as unknown as Row[];
  const paid = orders.filter((o) => o.status === "paid");
  const revenue = paid.reduce((sum, o) => sum + o.subtotal_cents, 0);

  return (
    <>
      <h1 className="text-2xl font-extrabold text-navy-950">Orders</h1>

      <nav className="mt-5 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === "all" ? "/admin/orders" : `/admin/orders?status=${tab.key}`}
            aria-current={active === tab.key ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 text-[13.5px] font-bold transition-colors duration-200 ${
              active === tab.key
                ? "bg-navy-950 text-white"
                : "border border-slate-300 text-ink-muted hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Total orders" value={String(orders.length)} />
        <Stat label="Paid" value={String(paid.length)} />
        <Stat label="Revenue" value={formatPrice(revenue)} />
      </div>

      {error && (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-800">
          Could not load orders: {error.message}
        </p>
      )}

      {!error && orders.length === 0 && (
        <p className="mt-8 rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center text-[14px] text-ink-muted">
          {active === "all" ? "No orders yet." : `No ${active} orders.`}
        </p>
      )}

      {orders.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[860px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr className="text-[12px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Items</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Payment ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((o) => {
                const name = [o.billing?.first_name, o.billing?.last_name]
                  .filter(Boolean)
                  .join(" ");
                const email = o.guest_email ?? o.billing?.email ?? "—";
                return (
                  <tr key={o.id} className="align-top text-[14px]">
                    <td className="px-5 py-4">
                      <p className="font-mono text-[13px] font-semibold text-navy-950">
                        {o.id.slice(0, 8)}
                      </p>
                      <p className="mt-0.5 text-[12.5px] text-ink-muted">
                        {new Date(o.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      {name && (
                        <p className="font-semibold text-navy-950">{name}</p>
                      )}
                      <p className="text-[13px] text-ink-muted">{email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <ul className="space-y-1">
                        {o.order_items.map((item, i) => (
                          <li key={i} className="text-[13px] leading-snug">
                            <span className="text-navy-950">
                              {item.title_snapshot}
                            </span>
                            <span className="text-ink-muted">
                              {" "}
                              — {item.option_snapshot} × {item.quantity}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-bold tabular-nums text-navy-950">
                      {formatPrice(o.subtotal_cents)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-bold capitalize ${
                          STATUS_STYLES[o.status] ?? "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-[12px] text-ink-muted">
                        {o.paypal_capture_id ?? "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
      <p className="text-[12.5px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-extrabold tabular-nums text-navy-950">{value}</p>
    </div>
  );
}
