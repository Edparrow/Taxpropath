import Link from "next/link";
import { Download, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { deleteSubscriber } from "./actions";

export const metadata = { title: "Subscribers" };

type Row = {
  id: string;
  email: string;
  is_active: boolean;
  subscribed_at: string;
};

export default async function AdminSubscribersPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("id, email, is_active, subscribed_at")
    .order("subscribed_at", { ascending: false })
    .limit(500);

  const rows = (data ?? []) as Row[];
  const active = rows.filter((r) => r.is_active).length;

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-950">Subscribers</h1>
          <p className="mt-1 text-[14px] text-ink-muted">
            {rows.length} total, {active} active
          </p>
        </div>
        <Link
          href="/admin/subscribers/export"
          className="flex shrink-0 items-center gap-2 rounded-full border border-slate-300 px-5 py-2.5 text-[14px] font-bold text-navy-950 transition-colors duration-200 hover:bg-slate-50"
        >
          <Download className="size-4" aria-hidden />
          Export CSV
        </Link>
      </div>

      {error && (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-800">
          Could not load subscribers: {error.message}
        </p>
      )}

      {!error && rows.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center">
          <p className="text-[15px] font-semibold text-navy-950">No subscribers yet</p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[560px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr className="text-[12px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Subscribed</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id} className="text-[14px]">
                  <td className="px-5 py-4 font-semibold text-navy-950">{row.email}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-ink-muted">
                    {new Date(row.subscribed_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-bold ${
                        row.is_active
                          ? "bg-brand-50 text-brand-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {row.is_active ? "Active" : "Unsubscribed"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <form action={deleteSubscriber} className="inline">
                      <input type="hidden" name="id" value={row.id} />
                      <button
                        type="submit"
                        aria-label="Delete subscriber"
                        className="inline-flex items-center justify-center rounded-lg border border-slate-300 p-1.5 text-red-700 transition-colors duration-200 hover:border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </button>
                    </form>
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
