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
import { SyncButtons } from "../../sync-buttons";
import { syncAbandoned } from "../actions";

export const metadata = { title: "Abandoned Analysis" };

type Customer = {
  email: string;
  name: string;
  phone: string;
  orders: OrderRow[];
  valueCents: number;
  lastAttempt: string;
  courses: string[];
  /** Paid for something after their first abandoned checkout. */
  recoveredAt: string | null;
};

export default async function AbandonedAnalysisPage() {
  const admin = await requireAdmin("abandoned");
  const supabase = await createClient();

  const [unpaidRes, paidRes] = await Promise.all([
    supabase
      .from("orders")
      .select(ORDER_COLUMNS)
      .is("deleted_at", null)
      .in("status", ["pending", "cancelled"])
      .lt("created_at", unpaidCutoffIso())
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase.from("orders").select("billing, guest_email, paid_at").eq("status", "paid").is("deleted_at", null),
  ]);

  const unpaid = (unpaidRes.data ?? []) as unknown as OrderRow[];
  const paidAtByEmail = new Map<string, string[]>();
  for (const p of (paidRes.data ?? []) as Pick<OrderRow, "billing" | "guest_email" | "paid_at">[]) {
    const email = customerEmail(p);
    if (!email || !p.paid_at) continue;
    paidAtByEmail.set(email, [...(paidAtByEmail.get(email) ?? []), p.paid_at]);
  }

  const byEmail = new Map<string, Customer>();
  for (const o of unpaid) {
    const email = customerEmail(o) || `(no email) ${o.id.slice(0, 8)}`;
    const c = byEmail.get(email) ?? {
      email,
      name: customerName(o),
      phone: o.billing?.phone ?? "",
      orders: [],
      valueCents: 0,
      lastAttempt: o.created_at,
      courses: [],
      recoveredAt: null,
    };
    c.orders.push(o);
    c.valueCents += orderTotalCents(o);
    if (o.created_at > c.lastAttempt) c.lastAttempt = o.created_at;
    for (const item of o.order_items) {
      if (!c.courses.includes(item.title_snapshot)) c.courses.push(item.title_snapshot);
    }
    byEmail.set(email, c);
  }

  const customers = [...byEmail.values()].map((c) => {
    const firstAttempt = c.orders.reduce((min, o) => (o.created_at < min ? o.created_at : min), c.lastAttempt);
    const later = (paidAtByEmail.get(c.email) ?? []).filter((t) => t > firstAttempt).sort();
    return { ...c, recoveredAt: later[0] ?? null };
  });
  customers.sort((a, b) => (a.lastAttempt < b.lastAttempt ? 1 : -1));

  const lost = customers.filter((c) => !c.recoveredAt);
  const lostValue = lost.reduce((s, c) => s + c.valueCents, 0);
  const recoveryRate = customers.length
    ? Math.round(((customers.length - lost.length) / customers.length) * 100)
    : 0;

  // Most-abandoned courses.
  const courseCounts = new Map<string, number>();
  for (const c of lost) for (const t of c.courses) courseCounts.set(t, (courseCounts.get(t) ?? 0) + 1);
  const topCourses = [...courseCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-950 dark:text-white">Abandoned Analysis</h1>
          <p className="mt-1 text-[14px] text-ink-muted">
            People who started checkout but didn&rsquo;t pay within {UNPAID_AFTER_MINUTES} minutes, one row per
            customer.
          </p>
        </div>
        {can(admin, "abandoned", "edit") && customers.length > 0 && (
          <SyncButtons group="abandoned" action={syncAbandoned} />
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <Stat label="Abandoned checkouts" value={String(unpaid.length)} />
        <Stat label="Customers" value={String(customers.length)} />
        <Stat label="Value not recovered" value={formatPrice(lostValue)} />
        <Stat label="Came back & bought" value={`${recoveryRate}%`} />
      </div>

      {topCourses.length > 0 && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[12.5px] font-semibold uppercase tracking-wide text-slate-500">Most abandoned courses</p>
          <ul className="mt-3 space-y-1.5">
            {topCourses.map(([title, n]) => (
              <li key={title} className="flex justify-between gap-4 text-[14px]">
                <span className="text-navy-950 dark:text-slate-100">{title}</span>
                <span className="font-bold tabular-nums text-ink-muted">{n}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {unpaidRes.error && (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-800">
          Could not load orders: {unpaidRes.error.message}
        </p>
      )}

      {customers.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center text-[14px] text-ink-muted">
          No abandoned checkouts.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full min-w-[900px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
              <tr className="text-[12px] font-bold uppercase tracking-wider text-slate-500">
                <th className="w-10 px-5 py-3" />
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Courses tried</th>
                <th className="px-5 py-3">Attempts</th>
                <th className="px-5 py-3">Value</th>
                <th className="px-5 py-3">Last attempt</th>
                <th className="px-5 py-3">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {customers.map((c) => (
                <tr key={c.email} className="align-top text-[14px]">
                  <td className="px-5 py-4">
                    <input
                      type="checkbox"
                      data-sync="abandoned"
                      value={c.orders.map((o) => o.id).join(",")}
                      aria-label={`Select ${c.email}`}
                      className="size-4 accent-brand-600"
                    />
                  </td>
                  <td className="px-5 py-4">
                    {c.name && <p className="font-semibold text-navy-950 dark:text-white">{c.name}</p>}
                    <p className="text-[13px] text-ink-muted">{c.email}</p>
                    {c.phone && <p className="text-[12.5px] text-ink-muted">{c.phone}</p>}
                  </td>
                  <td className="px-5 py-4 text-[13px] text-navy-950 dark:text-slate-100">{c.courses.join(", ")}</td>
                  <td className="px-5 py-4 tabular-nums text-ink-muted">{c.orders.length}</td>
                  <td className="whitespace-nowrap px-5 py-4 font-bold tabular-nums text-navy-950 dark:text-white">
                    {formatPrice(c.valueCents)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-[13px] text-ink-muted">{shortDate(c.lastAttempt)}</td>
                  <td className="px-5 py-4">
                    {c.recoveredAt ? (
                      <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11.5px] font-bold text-brand-700">
                        Bought {shortDate(c.recoveredAt)}
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11.5px] font-bold text-amber-800">
                        Follow up
                      </span>
                    )}
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
