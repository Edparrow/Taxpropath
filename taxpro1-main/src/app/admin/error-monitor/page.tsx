import Link from "next/link";
import { Bug, Eye, Search, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { ERROR_LABELS, isErrorType, type ErrorType } from "@/lib/errors/types";
import { clearErrors } from "./actions";

export const metadata = { title: "Error Monitor" };

const RANGES = {
  "1h": { seconds: 3600, step: 300, label: "Last hour" },
  "24h": { seconds: 86_400, step: 3600, label: "Last 24 hours" },
  "7d": { seconds: 7 * 86_400, step: 6 * 3600, label: "Last 7 days" },
  "30d": { seconds: 30 * 86_400, step: 86_400, label: "Last 30 days" },
} as const;
type RangeKey = keyof typeof RANGES;

type Row = {
  id: string;
  created_at: string;
  type: string;
  seen: boolean;
  ref: string | null;
  message: string;
  url: string | null;
  method: string | null;
  user_id: string | null;
  user_email: string | null;
  ip: string | null;
  user_agent: string | null;
  details: Record<string, unknown>;
};

type Person = { name: string; phone: string | null };

/** The time this request is served (server components render once per request). */
const requestTime = () => Date.now();

const label = (type: string) => (isErrorType(type) ? ERROR_LABELS[type] : type);

export default async function ErrorMonitorPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; type?: string; q?: string }>;
}) {
  await requireSuperAdmin();
  const params = await searchParams;
  const range: RangeKey = params.range && params.range in RANGES ? (params.range as RangeKey) : "24h";
  const type = params.type ?? "";
  const q = (params.q ?? "").trim().slice(0, 100);
  const { seconds, step } = RANGES[range];
  const now = requestTime();
  const since = now - seconds * 1000;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("error_events")
    .select("id, created_at, type, seen, ref, message, url, method, user_id, user_email, ip, user_agent, details")
    .gte("created_at", new Date(since).toISOString())
    .order("created_at", { ascending: false })
    .limit(5000);
  const all = (data ?? []) as Row[];

  // Names and phone numbers of the signed-in visitors who hit errors.
  const people = new Map<string, Person>();
  const userIds = [...new Set(all.map((r) => r.user_id).filter((id): id is string => Boolean(id)))];
  if (userIds.length) {
    const [{ data: profiles }, { data: admins }] = await Promise.all([
      supabase.from("profiles").select("id, first_name, last_name, phone").in("id", userIds),
      supabase.from("admin_users").select("id, name").in("id", userIds),
    ]);
    for (const p of profiles ?? []) {
      people.set(p.id, { name: [p.first_name, p.last_name].filter(Boolean).join(" "), phone: p.phone });
    }
    for (const a of admins ?? []) people.set(a.id, { name: `${a.name} (admin)`, phone: null });
  }

  // Summary over the whole range.
  const counts = new Map<string, number>();
  for (const r of all) counts.set(r.type, (counts.get(r.type) ?? 0) + 1);
  const byType = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const seenTotal = all.filter((r) => r.seen).length;
  const affectedPeople = new Set(all.filter((r) => r.user_id || r.ip).map((r) => r.user_id ?? r.ip)).size;

  // Chart buckets: seen vs silent.
  const start = since - (since % (step * 1000));
  const buckets: { t: number; seen: number; silent: number }[] = [];
  for (let t = start; t <= now; t += step * 1000) buckets.push({ t, seen: 0, silent: 0 });
  for (const r of all) {
    const i = Math.floor((Date.parse(r.created_at) - start) / (step * 1000));
    if (buckets[i]) buckets[i][r.seen ? "seen" : "silent"] += 1;
  }
  const peak = Math.max(1, ...buckets.map((b) => b.seen + b.silent));

  // Pages where visitors saw the most problems.
  const pageCounts = new Map<string, number>();
  for (const r of all) {
    if (!r.seen || !r.url) continue;
    const path = r.url.replace(/\?.*$/, "");
    pageCounts.set(path, (pageCounts.get(path) ?? 0) + 1);
  }
  const topPages = [...pageCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  // The list, filtered.
  const needle = q.toLowerCase();
  const rows = all.filter((r) => {
    if (type === "seen" && !r.seen) return false;
    if (type && type !== "seen" && r.type !== type) return false;
    if (!needle) return true;
    const who = r.user_id ? people.get(r.user_id) : undefined;
    return [r.ref, r.message, r.url, r.ip, r.user_email, who?.name, who?.phone]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(needle));
  });

  const href = (next: Partial<{ range: string; type: string; q: string }>) => {
    const p = new URLSearchParams();
    const merged = { range, type, q, ...next };
    if (merged.range !== "24h") p.set("range", merged.range);
    if (merged.type) p.set("type", merged.type);
    if (merged.q) p.set("q", merged.q);
    const s = p.toString();
    return `/admin/error-monitor${s ? `?${s}` : ""}`;
  };
  const time = (iso: string) =>
    new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "America/New_York",
    });
  const tick = (t: number) =>
    new Date(t).toLocaleString("en-US", {
      ...(step >= 86_400 ? { month: "short", day: "numeric" } : { hour: "numeric", minute: "2-digit" }),
      timeZone: "America/New_York",
    });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-navy-950 dark:text-white">
            <Bug className="size-6 text-brand-600" aria-hidden />
            Error Monitor
          </h1>
          <p className="mt-1 text-[14px] text-ink-muted">
            Everything that went wrong on the website — server crashes, database errors, browser errors and
            missing pages — with who it happened to. Times are US Eastern.
          </p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-full border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
          {(Object.keys(RANGES) as RangeKey[]).map((key) => (
            <Link
              key={key}
              href={href({ range: key })}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-bold ${
                key === range ? "bg-brand-gradient text-white" : "text-slate-600 hover:bg-brand-50 dark:text-slate-300"
              }`}
            >
              {key}
            </Link>
          ))}
        </div>
      </div>

      {error && (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-800">
          Could not load errors: {error.message}. Has <code>0003_skillsync_parity.sql</code> been run?
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label={`Entries · ${RANGES[range].label}`} value={all.length} />
        <Stat label="Visitors saw an error" value={seenTotal} tone={seenTotal ? "warn" : undefined} />
        <Stat label="People / devices affected" value={affectedPeople} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_320px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-[15px] font-extrabold text-navy-950 dark:text-white">Over time</h2>
            <p className="flex gap-4 text-[12px] font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-red-500" aria-hidden /> Visitor saw it
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-slate-300" aria-hidden /> Silent
              </span>
            </p>
          </div>
          <div className="mt-5 flex h-40 items-end gap-[2px]" role="img" aria-label="Errors over time">
            {buckets.map((b) => (
              <div
                key={b.t}
                className="flex flex-1 flex-col justify-end"
                title={`${tick(b.t)} — ${b.seen} seen, ${b.silent} silent`}
              >
                <div className="w-full rounded-t-sm bg-slate-300 dark:bg-slate-600" style={{ height: `${(b.silent / peak) * 100}%` }} />
                <div className="w-full bg-red-500" style={{ height: `${(b.seen / peak) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11.5px] text-slate-500">
            <span>{tick(buckets[0]?.t ?? since)}</span>
            <span>now</span>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-[15px] font-extrabold text-navy-950 dark:text-white">By type</h2>
          {byType.length === 0 ? (
            <p className="mt-3 text-[13.5px] text-ink-muted">Nothing recorded. 🎉</p>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {byType.map(([t, n]) => (
                <li key={t}>
                  <Link
                    href={href({ type: t })}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-1 text-[13.5px] hover:bg-brand-50 dark:hover:bg-slate-800"
                  >
                    <span className="text-navy-950 dark:text-slate-100">{label(t)}</span>
                    <span className="font-bold tabular-nums text-slate-600 dark:text-slate-300">{n}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {topPages.length > 0 && (
            <>
              <h3 className="mt-5 text-[13px] font-extrabold uppercase tracking-wide text-slate-500">
                Pages where visitors saw errors
              </h3>
              <ul className="mt-2 space-y-1">
                {topPages.map(([path, n]) => (
                  <li key={path} className="flex justify-between gap-3 text-[13px]">
                    <Link href={href({ q: path })} className="truncate font-mono text-brand-700 hover:underline">
                      {path}
                    </Link>
                    <span className="font-bold tabular-nums">{n}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      <form className="mt-6 flex flex-wrap items-center gap-2">
        {range !== "24h" && <input type="hidden" name="range" value={range} />}
        <select
          name="type"
          defaultValue={type}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-[14px] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="">All types</option>
          <option value="seen">Only what visitors saw</option>
          {(Object.keys(ERROR_LABELS) as ErrorType[]).map((t) => (
            <option key={t} value={t}>
              {ERROR_LABELS[t]}
            </option>
          ))}
        </select>
        <div className="relative min-w-[240px] flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            name="q"
            defaultValue={q}
            placeholder="Ref, email, name, phone, page or IP"
            className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-[14px] outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
        <button className="cursor-pointer rounded-xl bg-navy-950 px-4 py-2 text-[13.5px] font-bold text-white">Filter</button>
        {(type || q) && (
          <Link href={href({ type: "", q: "" })} className="text-[13px] font-semibold text-ink-muted hover:text-navy-950">
            Clear filters
          </Link>
        )}
      </form>

      <p className="mt-4 text-[13px] text-ink-muted">
        Showing {Math.min(rows.length, 300)} of {rows.length}
      </p>

      {rows.length > 0 && (
        <div className="mt-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full min-w-[960px] text-left">
            <thead className="border-b border-slate-200 bg-cream dark:border-slate-800 dark:bg-slate-800/50">
              <tr className="text-[12px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">What happened</th>
                <th className="px-4 py-3">Page</th>
                <th className="px-4 py-3">Visitor</th>
                <th className="px-4 py-3">Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.slice(0, 300).map((r) => {
                const who = r.user_id ? people.get(r.user_id) : undefined;
                return (
                  <tr key={r.id} className="align-top text-[13.5px]">
                    <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{time(r.created_at)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-bold ${
                          r.seen ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {r.seen && <Eye className="size-3" aria-label="Visitor saw this" />}
                        {label(r.type)}
                      </span>
                    </td>
                    <td className="max-w-md px-4 py-3">
                      <details>
                        <summary className="cursor-pointer break-words text-navy-950 dark:text-slate-100">
                          {r.message}
                        </summary>
                        <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-[11.5px] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {JSON.stringify(
                            { ...r.details, ip: r.ip, method: r.method, browser: r.user_agent },
                            null,
                            2,
                          )}
                        </pre>
                      </details>
                    </td>
                    <td className="max-w-[220px] break-all px-4 py-3 font-mono text-[12px] text-slate-600 dark:text-slate-300">
                      {r.url ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {who?.name && <p className="font-semibold text-navy-950 dark:text-white">{who.name}</p>}
                      {r.user_email ? (
                        <Link href={href({ q: r.user_email })} className="text-[12.5px] text-brand-700 hover:underline">
                          {r.user_email}
                        </Link>
                      ) : (
                        <p className="text-[12.5px] text-ink-muted">Not signed in</p>
                      )}
                      {who?.phone && <p className="text-[12.5px] text-ink-muted">{who.phone}</p>}
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-slate-600">{r.ref ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <form action={clearErrors} className="mt-8 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-5 dark:border-slate-800">
        <Trash2 className="size-4 text-slate-400" aria-hidden />
        <span className="text-[13px] font-semibold text-ink-muted">Clean up:</span>
        <button name="scope" value="7" className="cursor-pointer rounded-full border border-slate-300 px-3.5 py-1.5 text-[12.5px] font-bold hover:bg-slate-50 dark:border-slate-700">
          Older than 7 days
        </button>
        <button name="scope" value="1" className="cursor-pointer rounded-full border border-slate-300 px-3.5 py-1.5 text-[12.5px] font-bold hover:bg-slate-50 dark:border-slate-700">
          Older than 1 day
        </button>
        <button name="scope" value="all" className="cursor-pointer rounded-full border border-red-200 px-3.5 py-1.5 text-[12.5px] font-bold text-red-700 hover:bg-red-50">
          Everything
        </button>
        <span className="text-[12px] text-ink-muted">Entries older than 30 days are removed automatically.</span>
      </form>
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "warn" }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-[12.5px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold tabular-nums ${tone === "warn" ? "text-red-600" : "text-navy-950 dark:text-white"}`}>
        {value}
      </p>
    </div>
  );
}
