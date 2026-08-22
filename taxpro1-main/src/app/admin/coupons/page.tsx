import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { formatPrice } from "@/lib/utils";
import { deleteCoupon } from "./actions";

export const metadata = { title: "Coupons" };

type Row = {
  id: string;
  code: string;
  discount_type: "fixed" | "percent";
  discount_value: number;
  max_redemptions: number | null;
  times_redeemed: number;
  expires_at: string | null;
  is_active: boolean;
};

export default async function AdminCouponsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("coupons")
    .select("id, code, discount_type, discount_value, max_redemptions, times_redeemed, expires_at, is_active")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as Row[];

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-950">Coupons</h1>
          <p className="mt-1 text-[14px] text-ink-muted">Discount codes for checkout.</p>
        </div>
        <Link
          href="/admin/coupons/new"
          className="flex shrink-0 items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-[14px] font-bold text-white transition-transform duration-200 hover:-translate-y-0.5"
        >
          <Plus className="size-4" aria-hidden />
          New coupon
        </Link>
      </div>

      {error && (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-800">
          Could not load coupons: {error.message}
        </p>
      )}

      {!error && rows.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center">
          <p className="text-[15px] font-semibold text-navy-950">No coupons yet</p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[760px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr className="text-[12px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Discount</th>
                <th className="px-5 py-3">Redeemed</th>
                <th className="px-5 py-3">Expires</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id} className="text-[14px]">
                  <td className="px-5 py-4 font-mono font-semibold text-navy-950">
                    {row.code}
                  </td>
                  <td className="px-5 py-4 text-ink-muted">
                    {row.discount_type === "percent"
                      ? `${row.discount_value}%`
                      : formatPrice(row.discount_value)}
                  </td>
                  <td className="px-5 py-4 tabular-nums text-ink-muted">
                    {row.times_redeemed}
                    {row.max_redemptions ? ` / ${row.max_redemptions}` : ""}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-ink-muted">
                    {row.expires_at
                      ? new Date(row.expires_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Never"}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-bold ${
                        row.is_active
                          ? "bg-brand-50 text-brand-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {row.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/coupons/${row.id}`}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-[13px] font-semibold text-navy-950 transition-colors duration-200 hover:bg-slate-50"
                      >
                        <Pencil className="size-3.5" aria-hidden />
                        Edit
                      </Link>
                      <form action={deleteCoupon}>
                        <input type="hidden" name="id" value={row.id} />
                        <button
                          type="submit"
                          aria-label="Delete coupon"
                          className="flex items-center justify-center rounded-lg border border-slate-300 p-1.5 text-red-700 transition-colors duration-200 hover:border-red-300 hover:bg-red-50"
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </button>
                      </form>
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
