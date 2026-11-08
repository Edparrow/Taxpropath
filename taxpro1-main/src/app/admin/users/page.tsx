import { ShoppingCart } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { can } from "@/lib/admin/permissions";
import { hasServiceRoleKey } from "@/lib/supabase/admin";
import { loadCustomers, type Customer } from "@/lib/admin/customers";
import { formatPrice } from "@/lib/utils";
import { SyncButtons } from "../sync-buttons";
import { syncUsers } from "./actions";

export const metadata = { title: "Registered users" };

const dateFormat = (value: string | null) =>
  value
    ? new Date(value).toLocaleString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cart?: string }>;
}) {
  const admin = await requireAdmin("users");
  const { q = "", cart = "" } = await searchParams;
  const needle = q.trim().toLowerCase();

  if (!hasServiceRoleKey()) {
    return (
      <>
        <h1 className="text-2xl font-extrabold text-navy-950 dark:text-white">Registered users</h1>
        <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-[14px] text-amber-900">
          Add <code className="font-mono font-semibold">SUPABASE_SERVICE_ROLE_KEY</code> to the server env to
          list accounts.
        </p>
      </>
    );
  }

  let all: Customer[] = [];
  let loadError: string | null = null;
  try {
    all = await loadCustomers();
  } catch (err) {
    console.error("[admin] customer load failed", err);
    loadError = "Could not load accounts. Please try again.";
  }

  const withCart = all.filter((u) => u.cart.length > 0).length;
  const users = all.filter((u) => {
    if (cart === "1" && u.cart.length === 0) return false;
    if (!needle) return true;
    return [u.email, u.name, u.phone, u.ptin, u.company, u.city]
      .some((v) => v.toLowerCase().includes(needle));
  });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-950 dark:text-white">Registered users</h1>
          <p className="mt-1 text-[14px] text-ink-muted">
            {all.length} customer account{all.length === 1 ? "" : "s"} · {withCart} with items in their cart
          </p>
        </div>
        {can(admin, "users", "edit") && users.length > 0 && <SyncButtons group="users" action={syncUsers} />}
      </div>

      <form className="mt-6 flex flex-wrap items-center gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name, email, phone, PTIN, company or city"
          className="w-full max-w-md rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-[14px] outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <label className="flex cursor-pointer items-center gap-2 text-[13.5px] font-semibold text-navy-950 dark:text-slate-100">
          <input type="checkbox" name="cart" value="1" defaultChecked={cart === "1"} className="size-4 accent-brand-600" />
          Only with items in cart
        </label>
        <button className="cursor-pointer rounded-xl bg-navy-950 px-4 py-2 text-[13.5px] font-bold text-white">Search</button>
      </form>

      {loadError && (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-800">{loadError}</p>
      )}

      {!loadError && users.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center">
          <p className="text-[15px] font-semibold text-navy-950 dark:text-white">
            {needle || cart ? "No accounts match." : "No accounts yet"}
          </p>
        </div>
      )}

      {users.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full min-w-[1200px] text-left">
            <thead className="border-b border-slate-200 bg-cream dark:border-slate-800 dark:bg-slate-800/50">
              <tr className="text-[12px] font-bold uppercase tracking-wider text-slate-500">
                <th className="w-10 px-4 py-3" />
                <th className="px-4 py-3">Name / Email</th>
                <th className="px-4 py-3">Cart Items</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">PTIN</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Registered</th>
                <th className="px-4 py-3">Last sign-in</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((user) => (
                <tr key={user.id} className="align-top text-[13.5px]">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      data-sync="users"
                      value={user.id}
                      aria-label={`Select ${user.email}`}
                      className="size-4 accent-brand-600"
                    />
                  </td>
                  <td className="px-4 py-4">
                    {user.name && <p className="font-semibold text-navy-950 dark:text-white">{user.name}</p>}
                    <p className="text-ink-muted">{user.email}</p>
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        user.confirmed ? "bg-brand-50 text-brand-700" : "bg-amber-50 text-amber-800"
                      }`}
                    >
                      {user.confirmed ? "Confirmed" : "Unconfirmed"}
                    </span>
                  </td>
                  <td className="max-w-[260px] px-4 py-4">
                    {user.cart.length === 0 ? (
                      <span className="text-ink-muted">—</span>
                    ) : (
                      <>
                        <ul className="space-y-1">
                          {user.cart.map((item, i) => (
                            <li key={i} className="flex gap-1.5 leading-snug">
                              <ShoppingCart className="mt-0.5 size-3.5 shrink-0 text-brand-600" aria-hidden />
                              <span>
                                <span className="font-semibold text-navy-950 dark:text-slate-100">{item.title}</span>
                                {item.options && <span className="text-ink-muted"> — {item.options}</span>}
                                {item.totalCents > 0 && (
                                  <span className="text-ink-muted"> · {formatPrice(item.totalCents)}</span>
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <p className="mt-1 text-[11.5px] text-ink-muted">Updated {dateFormat(user.cartUpdatedAt)}</p>
                      </>
                    )}
                  </td>
                  <td className="px-4 py-4 text-ink-muted">{user.phone || "—"}</td>
                  <td className="px-4 py-4 font-mono text-[12.5px] text-ink-muted">{user.ptin || "—"}</td>
                  <td className="px-4 py-4 text-ink-muted">{user.company || "—"}</td>
                  <td className="px-4 py-4 text-ink-muted">
                    {[user.address1, user.city, user.zip].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-4 font-bold tabular-nums text-navy-950 dark:text-white">{user.paidOrders}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-ink-muted">{dateFormat(user.registeredAt)}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-ink-muted">{dateFormat(user.lastSignInAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
