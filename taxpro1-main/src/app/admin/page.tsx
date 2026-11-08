import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  DollarSign,
  GraduationCap,
  Mail,
  Plus,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { ADMIN_SECTIONS, can, type AdminSection } from "@/lib/admin/permissions";
import { customerEmail, customerName, unpaidCutoffIso } from "@/lib/admin/orders";
import { formatPrice } from "@/lib/utils";
import { DashboardCalendar } from "@/components/dashboard-calendar";

export const metadata = { title: "Dashboard" };

type PaidOrder = {
  id: string;
  subtotal_cents: number;
  discount_cents: number | null;
  created_at: string;
  paid_at: string | null;
  billing: Record<string, string> | null;
  guest_email: string | null;
  order_items: {
    title_snapshot: string;
    course_slug: string;
    option_code: string | null;
    unit_price_cents: number;
    quantity: number;
  }[];
};

// Business days follow US Eastern time, as on SkillSync.
const TZ = "America/New_York";
const dayKey = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: TZ }); // YYYY-MM-DD
const monthKey = (d: Date) => dayKey(d).slice(0, 7); // YYYY-MM

/** The time this request is served (server components render once per request). */
const requestTime = () => new Date();

const OPTION_LABELS: Record<string, string> = {
  SELF_STUDY: "Self-Study",
  ETRANSCRIPT: "e-Transcript",
  SLIDES: "Slides",
};

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string; chart?: string }>;
}) {
  const admin = await requireAdmin();
  const { denied, chart: chartParam } = await searchParams;
  const chart = chartParam === "12m" ? "12m" : "30d";
  const deniedLabel = denied
    ? denied === "access"
      ? "Access Level"
      : (ADMIN_SECTIONS.find((s) => s.key === denied)?.label ?? denied)
    : null;
  const notice = deniedLabel && (
    <p
      role="alert"
      className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-[14px] text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
    >
      You don&rsquo;t have permission for <strong>{deniedLabel}</strong>. Ask a Super Admin to change your
      Access Level.
    </p>
  );

  // Without the Dashboard section an admin gets a plain welcome, not the numbers.
  if (!can(admin, "dashboard")) {
    return (
      <>
        {notice}
        <div className="relative overflow-hidden rounded-3xl bg-brand-gradient p-10 text-white">
          <h1 className="text-2xl font-extrabold">Welcome, {admin.name}</h1>
          <p className="mt-2 text-[15px] text-white/85">Use the menu to open the sections you have access to.</p>
        </div>
      </>
    );
  }

  const supabase = await createClient();
  const now = requestTime();
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000).toISOString();

  const [paidRes, unpaidRes, coursesRes, customersRes, subscribersRes, queriesRes] = await Promise.all([
    supabase
      .from("orders")
      .select(
        `id, subtotal_cents, discount_cents, created_at, paid_at, billing, guest_email,
         order_items ( title_snapshot, course_slug, option_code, unit_price_cents, quantity )`,
      )
      .eq("status", "paid")
      .is("deleted_at", null)
      .order("paid_at", { ascending: false }),
    supabase
      .from("orders")
      .select("created_at")
      .in("status", ["pending", "cancelled"])
      .is("deleted_at", null)
      .gte("created_at", weekAgo)
      .lt("created_at", unpaidCutoffIso()),
    supabase.from("courses").select("id, is_published, pricing_options ( code )"),
    supabase.from("profiles").select("created_at"),
    supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("contact_messages").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
  ]);

  const paid = (paidRes.data ?? []) as unknown as PaidOrder[];
  const total = (o: PaidOrder) => o.subtotal_cents - (o.discount_cents ?? 0);
  const when = (o: PaidOrder) => new Date(o.paid_at ?? o.created_at);

  const today = dayKey(now);
  const thisMonthKey = monthKey(now);
  const lastMonthDate = new Date(now);
  lastMonthDate.setDate(15);
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonthKey = monthKey(lastMonthDate);

  const sum = (list: PaidOrder[]) => list.reduce((s, o) => s + total(o), 0);
  const inMonth = (key: string) => paid.filter((o) => monthKey(when(o)) === key);
  const thisMonth = inMonth(thisMonthKey);
  const lastMonth = inMonth(lastMonthKey);
  const todays = paid.filter((o) => dayKey(when(o)) === today);
  const change = (a: number, b: number) => (b > 0 ? Math.round(((a - b) / b) * 100) : null);
  const revenueChange = change(sum(thisMonth), sum(lastMonth));
  const ordersChange = change(thisMonth.length, lastMonth.length);

  // Registered users: total, this week, today.
  const profiles = (customersRes.data ?? []) as { created_at: string }[];
  const usersWeek = profiles.filter((p) => p.created_at >= weekAgo).length;
  const usersToday = profiles.filter((p) => dayKey(new Date(p.created_at)) === today).length;

  // Chart: last 30 days (daily) or last 12 months (monthly).
  const buckets: { key: string; label: string; cents: number; count: number }[] = [];
  if (chart === "30d") {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86_400_000);
      buckets.push({
        key: dayKey(d),
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: TZ }),
        cents: 0,
        count: 0,
      });
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(15);
      d.setMonth(d.getMonth() - i);
      buckets.push({
        key: monthKey(d),
        label: d.toLocaleDateString("en-US", { month: "short", timeZone: TZ }),
        cents: 0,
        count: 0,
      });
    }
  }
  const bucketOf = (o: PaidOrder) => (chart === "30d" ? dayKey(when(o)) : monthKey(when(o)));
  const byKey = new Map(buckets.map((b) => [b.key, b]));
  for (const o of paid) {
    const b = byKey.get(bucketOf(o));
    if (b) {
      b.cents += total(o);
      b.count += 1;
    }
  }
  const peak = Math.max(1, ...buckets.map((b) => b.cents));
  const chartRevenue = buckets.reduce((s, b) => s + b.cents, 0);
  const chartOrders = buckets.reduce((s, b) => s + b.count, 0);

  // What people buy, and top courses — over the last 12 months.
  const yearAgo = new Date(now.getTime() - 365 * 86_400_000);
  const recentYear = paid.filter((o) => when(o) >= yearAgo);
  const formats = new Map<string, { count: number; cents: number }>();
  const coursesTop = new Map<string, { title: string; cents: number; orders: number }>();
  for (const o of recentYear) {
    for (const item of o.order_items) {
      const code = item.option_code ?? "OTHER";
      const f = formats.get(code) ?? { count: 0, cents: 0 };
      f.count += item.quantity;
      f.cents += item.unit_price_cents * item.quantity;
      formats.set(code, f);
    }
    const first = o.order_items[0];
    if (first) {
      const c = coursesTop.get(first.course_slug) ?? { title: first.title_snapshot, cents: 0, orders: 0 };
      c.cents += total(o);
      c.orders += 1;
      coursesTop.set(first.course_slug, c);
    }
  }
  const formatTotal = [...formats.values()].reduce((s, f) => s + f.count, 0);
  const formatRows = [...formats.entries()].sort((a, b) => b[1].count - a[1].count);
  const topCourses = [...coursesTop.values()].sort((a, b) => b.cents - a.cents).slice(0, 5);

  const courses = (coursesRes.data ?? []) as { id: string; is_published: boolean; pricing_options: { code: string }[] }[];
  const published = courses.filter((c) => c.is_published).length;
  const unpriced = courses.filter((c) => !c.pricing_options.some((p) => p.code === "SELF_STUDY")).length;

  const unpaid = (unpaidRes.data ?? []) as { created_at: string }[];
  const failedToday = unpaid.filter((o) => dayKey(new Date(o.created_at)) === today).length;

  type Attention = { section: AdminSection; href: string; count: number; text: string };
  const candidates: Attention[] = [
    { section: "failed_orders", href: "/admin/orders/failed", count: failedToday, text: "checkouts failed or were left unpaid today" },
    { section: "failed_orders", href: "/admin/orders/failed?week=1", count: unpaid.length - failedToday, text: "more failed checkouts earlier this week" },
    { section: "enquiries", href: "/admin/enquiries", count: queriesRes.count ?? 0, text: "contact queries in the last 7 days" },
    { section: "courses", href: "/admin/courses", count: unpriced, text: "courses have no Self-Study price, so they can't be bought" },
  ];
  const attention = candidates.filter((a) => a.count > 0 && can(admin, a.section));

  const recent = paid.slice(0, 6);

  const quick = [
    { href: "/admin/courses/new", label: "New Course", icon: Plus, show: can(admin, "courses", "edit") },
    { href: "/admin/orders/new", label: "Manual Order", icon: ShoppingBag, show: can(admin, "orders", "edit") },
    { href: "/admin/orders/sheet", label: "Order Sheet", icon: ClipboardList, show: can(admin, "order_sheet") },
  ].filter((q) => q.show);

  return (
    <div className="space-y-6">
      {notice}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-950 dark:text-white">Welcome back, {admin.name}</h1>
          <p className="mt-0.5 text-[13.5px] text-ink-muted">
            {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: TZ })}
          </p>
        </div>
        {quick.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {quick.map(({ href, label, icon: Icon }, i) => (
              <Link
                key={href}
                href={href}
                className={
                  i === 0
                    ? "inline-flex items-center gap-2 rounded-full bg-brand-gradient px-5 py-2.5 text-[13.5px] font-bold text-white shadow-md shadow-brand-600/20 transition-transform duration-200 hover:-translate-y-0.5"
                    : "inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-[13.5px] font-bold text-navy-950 hover:border-brand-600 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                }
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile
          icon={DollarSign}
          title="Revenue this month"
          value={formatPrice(sum(thisMonth))}
          change={revenueChange}
          lines={[`Today ${formatPrice(sum(todays))}`, `All-time ${formatPrice(sum(paid))}`]}
          highlight
        />
        <Tile
          icon={ShoppingBag}
          title="Orders this month"
          value={String(thisMonth.length)}
          change={ordersChange}
          lines={[`Today ${todays.length}`, `All-time ${paid.length}`]}
        />
        <Tile
          icon={Users}
          title="Registered users"
          value={String(profiles.length)}
          lines={[`This week +${usersWeek}`, `Today +${usersToday}`]}
        />
        <Tile
          icon={GraduationCap}
          title="Published courses"
          value={`${published} / ${courses.length}`}
          lines={[unpriced ? `${unpriced} without a price` : "All priced", `${subscribersRes.count ?? 0} newsletter subscribers`]}
        />
      </div>

      {attention.length > 0 && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-6 dark:border-amber-900/50 dark:bg-amber-950/20">
          <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-amber-900 dark:text-amber-200">
            <TriangleAlert className="size-4" aria-hidden />
            Needs attention
          </h2>
          <ul className="mt-3 space-y-2">
            {attention.map((a) => (
              <li key={a.href}>
                <Link href={a.href} className="group flex items-center gap-3 text-[14px] text-amber-950 dark:text-amber-100">
                  <span className="flex min-w-8 items-center justify-center rounded-full bg-amber-200/70 px-2 py-0.5 text-[13px] font-extrabold tabular-nums dark:bg-amber-900/60">
                    {a.count}
                  </span>
                  <span className="group-hover:underline">{a.text}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-navy-950 dark:text-white">Revenue &amp; orders</h2>
              <p className="text-[12.5px] font-semibold text-slate-400">
                {formatPrice(chartRevenue)} from {chartOrders} paid order{chartOrders === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex gap-1 rounded-full border border-slate-200 p-1 dark:border-slate-700">
              {(["30d", "12m"] as const).map((k) => (
                <Link
                  key={k}
                  href={k === "30d" ? "/admin" : "/admin?chart=12m"}
                  className={`rounded-full px-3.5 py-1 text-[12.5px] font-bold ${
                    chart === k ? "bg-brand-gradient text-white" : "text-slate-600 hover:bg-brand-50 dark:text-slate-300"
                  }`}
                >
                  {k === "30d" ? "30 days" : "12 months"}
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-6 flex h-56 items-end gap-[3px] border-b border-slate-100 pb-1 sm:gap-1.5 dark:border-slate-800">
            {buckets.map((b) => (
              <div
                key={b.key}
                className="flex h-full flex-1 flex-col justify-end"
                title={`${b.label}: ${formatPrice(b.cents)} from ${b.count} order(s)`}
              >
                <div
                  className={`w-full rounded-t-md ${b.cents ? "bg-brand-gradient" : "bg-slate-100 dark:bg-slate-800"}`}
                  style={{ height: `${Math.max(2, (b.cents / peak) * 100)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11.5px] font-semibold text-slate-400">
            <span>{buckets[0]?.label}</span>
            {chart === "12m" && <span>{buckets[6]?.label}</span>}
            <span>{buckets[buckets.length - 1]?.label}</span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-extrabold text-navy-950 dark:text-white">What people buy</h2>
          <p className="text-[12.5px] font-semibold text-slate-400">Items sold, last 12 months</p>
          {formatRows.length === 0 ? (
            <p className="py-10 text-center text-[13.5px] text-slate-400">No sales yet.</p>
          ) : (
            <ul className="mt-5 space-y-4">
              {formatRows.map(([code, f]) => {
                const pct = Math.round((f.count / formatTotal) * 100);
                return (
                  <li key={code}>
                    <div className="flex justify-between text-[13.5px]">
                      <span className="font-bold text-navy-950 dark:text-white">{OPTION_LABELS[code] ?? "Other"}</span>
                      <span className="tabular-nums text-ink-muted">
                        {f.count} · {pct}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1 text-[11.5px] text-slate-400">{formatPrice(f.cents)} before discounts</p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-navy-950 dark:text-white">
            <Trophy className="size-5 text-amber-500" aria-hidden />
            Top courses
          </h2>
          <p className="text-[12.5px] font-semibold text-slate-400">By revenue, last 12 months</p>
          {topCourses.length === 0 ? (
            <p className="py-10 text-center text-[13.5px] text-slate-400">No sales yet.</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {topCourses.map((c, i) => (
                <li key={c.title} className="flex items-center gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-cream text-[12.5px] font-extrabold text-navy-950 dark:bg-slate-800 dark:text-white">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-navy-950 dark:text-white">{c.title}</span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[14px] font-extrabold tabular-nums text-navy-950 dark:text-white">{formatPrice(c.cents)}</span>
                    <span className="block text-[11.5px] text-slate-400">{c.orders} order{c.orders === 1 ? "" : "s"}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-navy-950 dark:text-white">Recent orders</h2>
            {can(admin, "orders") && (
              <Link href="/admin/orders" className="flex items-center gap-1 text-[13px] font-bold text-brand-700 hover:underline dark:text-brand-400">
                View all <ArrowRight className="size-3" aria-hidden />
              </Link>
            )}
          </div>
          {recent.length === 0 ? (
            <p className="flex flex-1 items-center justify-center py-10 text-[13.5px] text-slate-400">No sales yet.</p>
          ) : (
            <ul className="space-y-4">
              {recent.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-bold text-navy-950 dark:text-white">
                      {o.order_items[0]?.title_snapshot ?? "Course order"}
                    </p>
                    <p className="truncate text-[12px] text-slate-500 dark:text-slate-400">
                      {customerName(o) || customerEmail(o)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[14px] font-extrabold tabular-nums text-navy-950 dark:text-white">{formatPrice(total(o))}</p>
                    <p className="text-[11px] font-semibold text-slate-400">
                      {when(o).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: TZ })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <DashboardCalendar />
        </div>
        <div className="flex flex-col justify-center rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
          <p className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-widest text-slate-400">
            <Mail className="size-4" aria-hidden />
            Newsletter
          </p>
          <p className="mt-2 text-4xl font-extrabold tabular-nums text-navy-950 dark:text-white">
            {subscribersRes.count ?? 0}
          </p>
          <p className="mt-1 text-[14px] text-ink-muted">active subscribers</p>
        </div>
      </div>
    </div>
  );
}

function Tile({
  title,
  value,
  icon: Icon,
  change,
  lines,
  highlight,
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  change?: number | null;
  lines: string[];
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "relative overflow-hidden rounded-3xl bg-brand-gradient p-5 text-white shadow-lg shadow-brand-600/20"
          : "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      }
    >
      <div className="flex items-center justify-between">
        <span
          className={`flex size-10 items-center justify-center rounded-xl ${
            highlight ? "bg-white/20 text-white" : "bg-brand-50 text-brand-700 dark:bg-slate-800 dark:text-brand-400"
          }`}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        {change !== undefined && change !== null && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-bold ${
              highlight
                ? "bg-white/20 text-white"
                : change >= 0
                  ? "bg-brand-50 text-brand-700"
                  : "bg-red-50 text-red-700"
            }`}
            title="Compared with last month"
          >
            {change >= 0 ? <TrendingUp className="size-3" aria-hidden /> : <TrendingDown className="size-3" aria-hidden />}
            {change >= 0 ? "+" : ""}
            {change}%
          </span>
        )}
      </div>
      <p className={`mt-4 text-[12.5px] font-bold ${highlight ? "text-white/80" : "text-slate-500 dark:text-slate-400"}`}>{title}</p>
      <p className={`mt-1 text-2xl font-black tabular-nums tracking-tight ${highlight ? "" : "text-navy-950 dark:text-white"}`}>{value}</p>
      <p className={`mt-2 text-[12px] font-semibold ${highlight ? "text-white/80" : "text-slate-400"}`}>{lines.join(" · ")}</p>
    </div>
  );
}
