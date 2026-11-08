import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

export const metadata = { title: "Activity Logs" };

const PAGE_SIZE = 100;

type Row = {
  id: string;
  admin_email: string | null;
  action: string;
  description: string;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
};

export default async function ActivityLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireAdmin("activity_logs");
  const { q = "", page = "1" } = await searchParams;
  const pageNo = Math.max(1, Number.parseInt(page, 10) || 1);
  const search = q.trim().slice(0, 100);

  const supabase = await createClient();
  let query = supabase
    .from("activity_logs")
    .select("id, admin_email, action, description, reference_type, reference_id, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range((pageNo - 1) * PAGE_SIZE, pageNo * PAGE_SIZE - 1);

  if (search) {
    // Commas and parentheses would break the or() filter syntax.
    const term = search.replace(/[,()]/g, " ");
    query = query.or(
      `admin_email.ilike.%${term}%,action.ilike.%${term}%,description.ilike.%${term}%`,
    );
  }

  const { data, count, error } = await query;
  const logs = (data ?? []) as Row[];
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const pageHref = (n: number) =>
    `/admin/activity-logs?page=${n}${search ? `&q=${encodeURIComponent(search)}` : ""}`;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-950 dark:text-white">Activity Logs</h1>
          <p className="mt-1 text-[14px] text-ink-muted">{count ?? 0} entries — who did what in the admin panel.</p>
        </div>
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={search}
            placeholder="Search admin, action or text"
            className="w-64 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-[14px] outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <button className="cursor-pointer rounded-xl bg-navy-950 px-4 text-[13.5px] font-bold text-white">Search</button>
        </form>
      </div>

      {error && (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-800">
          Could not load the log: {error.message}
        </p>
      )}

      <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full min-w-[760px] text-left">
          <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
            <tr className="text-[12px] font-bold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3">When</th>
              <th className="px-5 py-3">Admin</th>
              <th className="px-5 py-3">Action</th>
              <th className="px-5 py-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-[14px] text-ink-muted">
                  Nothing logged yet.
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id} className="align-top text-[14px]">
                <td className="whitespace-nowrap px-5 py-3 text-[13px] text-ink-muted">
                  {new Date(log.created_at).toLocaleString("en-US", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-5 py-3 text-[13px] text-navy-950 dark:text-slate-100">{log.admin_email ?? "—"}</td>
                <td className="px-5 py-3">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-[11.5px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {log.action}
                  </span>
                </td>
                <td className="px-5 py-3 text-[13.5px] text-ink-muted">
                  {log.description}
                  {log.reference_type === "order" && log.reference_id && (
                    <Link
                      href={`/admin/orders/${log.reference_id}/invoice`}
                      target="_blank"
                      className="ml-2 whitespace-nowrap text-[12.5px] font-bold text-brand-700 hover:underline"
                    >
                      View Invoice
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-3 text-[14px]">
          {pageNo > 1 && <Link href={pageHref(pageNo - 1)} className="font-semibold text-brand-700 hover:underline">← Newer</Link>}
          <span className="text-ink-muted">Page {pageNo} of {pages}</span>
          {pageNo < pages && <Link href={pageHref(pageNo + 1)} className="font-semibold text-brand-700 hover:underline">Older →</Link>}
        </nav>
      )}
    </>
  );
}
