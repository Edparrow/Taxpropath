import Link from "next/link";
import {
  Building2,
  FolderTree,
  Image as ImageIcon,
  Info,
  Layers,
  MessageSquareQuote,
  Plus,
  ShoppingBag,
  Tags,
  Users,
  Video,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { RESOURCES } from "@/lib/admin/resources";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

type Icon = typeof Video;

/** Icons per content resource, kept here so the config stays presentation-free. */
const RESOURCE_ICONS: Record<string, Icon> = {
  banners: ImageIcon,
  categories: FolderTree,
  subcategories: Layers,
  about: Info,
  testimonials: MessageSquareQuote,
  industries: Building2,
  brands: Tags,
};

export default async function AdminDashboard() {
  await requireAdmin();
  const supabase = await createClient();

  const [webinars, orders, ...contentCounts] = await Promise.all([
    supabase.from("webinars").select("id, is_published, video_path, video_url"),
    supabase.from("orders").select("status, subtotal_cents"),
    /*
     * head+exact gives a count without transferring rows. A missing table (the
     * 0006 migration not yet applied) resolves to an error rather than throwing,
     * so the card shows an em dash instead of taking the page down.
     */
    ...RESOURCES.map(async (resource) => {
      const { count, error } = await supabase
        .from(resource.table)
        .select("id", { count: "exact", head: true });
      return { slug: resource.slug, count: error ? null : count ?? 0 };
    }),
  ]);

  const countBySlug = new Map(contentCounts.map((c) => [c.slug, c.count]));

  const allWebinars = webinars.data ?? [];
  const allOrders = orders.data ?? [];
  const paid = allOrders.filter((o) => o.status === "paid");
  const failed = allOrders.filter((o) =>
    ["cancelled", "refunded"].includes(o.status),
  );

  const stats = [
    { label: "Webinars", value: String(allWebinars.length) },
    {
      label: "Published",
      value: String(allWebinars.filter((w) => w.is_published).length),
    },
    {
      label: "With recordings",
      value: String(allWebinars.filter((w) => w.video_path || w.video_url).length),
    },
    { label: "Paid orders", value: String(paid.length) },
    {
      label: "Revenue",
      value: formatPrice(paid.reduce((s, o) => s + o.subtotal_cents, 0)),
    },
  ];

  const missingTables = contentCounts.filter((c) => c.count === null).length;

  return (
    <>
      <h1 className="text-2xl font-extrabold text-navy-950">Dashboard</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-4"
          >
            <p className="text-[12.5px] font-semibold uppercase tracking-wide text-slate-500">
              {s.label}
            </p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums text-navy-950">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {missingTables > 0 && (
        <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-[14px] leading-relaxed text-amber-900">
          {missingTables} content table
          {missingTables === 1 ? " is" : "s are"} missing. Apply{" "}
          <code className="font-mono font-semibold">
            supabase/migrations/0006_site_content.sql
          </code>{" "}
          to enable those sections.
        </p>
      )}

      <h2 className="mt-10 text-[13px] font-bold uppercase tracking-wider text-slate-500">
        Catalog
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          href="/admin/webinars/new"
          icon={Plus}
          title="Add a webinar"
          body="Create a session with pricing and content."
        />
        <Card
          href="/admin/webinars"
          icon={Video}
          title="Service"
          body="Edit details, pricing, and recordings."
          count={allWebinars.length}
        />
        <Card
          href="/admin/users"
          icon={Users}
          title="Register User"
          body="Accounts, confirmation and sign-in activity."
        />
      </div>

      <h2 className="mt-10 text-[13px] font-bold uppercase tracking-wider text-slate-500">
        Site content
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {RESOURCES.map((resource) => (
          <Card
            key={resource.slug}
            href={`/admin/content/${resource.slug}`}
            icon={RESOURCE_ICONS[resource.slug] ?? Layers}
            title={resource.plural}
            body={resource.description}
            count={countBySlug.get(resource.slug) ?? null}
          />
        ))}
      </div>

      <h2 className="mt-10 text-[13px] font-bold uppercase tracking-wider text-slate-500">
        Orders
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          href="/admin/orders?status=paid"
          icon={ShoppingBag}
          title="Completed Orders"
          body="Settled payments and revenue."
          count={paid.length}
        />
        <Card
          href="/admin/orders?status=failed"
          icon={ShoppingBag}
          title="Failed Orders"
          body="Cancelled and refunded payments."
          count={failed.length}
        />
        <Card
          href="/admin/orders"
          icon={ShoppingBag}
          title="All Orders"
          body="Every order in one list, any status."
          count={allOrders.length}
        />
      </div>
    </>
  );
}

function Card({
  href,
  icon: Icon,
  title,
  body,
  count,
}: {
  href: string;
  icon: Icon;
  title: string;
  body: string;
  /** null renders an em dash — used when the table isn't there yet. */
  count?: number | null;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300"
    >
      <div className="flex items-start justify-between gap-3">
        <Icon className="size-5 text-brand-600" aria-hidden />
        {count !== undefined && (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[12px] font-bold tabular-nums text-slate-600">
            {count === null ? "—" : count}
          </span>
        )}
      </div>
      <p className="mt-3 text-[15px] font-extrabold text-navy-950">{title}</p>
      <p className="mt-1 text-[13.5px] leading-relaxed text-ink-muted">{body}</p>
    </Link>
  );
}
