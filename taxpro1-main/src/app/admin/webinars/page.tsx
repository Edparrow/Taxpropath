import Link from "next/link";
import { Copy, Pencil, Plus, Video } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { formatEventDate, formatPrice } from "@/lib/utils";
import { DeleteWebinarButton } from "./delete-button";
import { cloneWebinar } from "./actions";

export const metadata = { title: "Webinars" };

type Row = {
  id: string;
  slug: string;
  title: string;
  kind: string;
  event_at: string;
  is_published: boolean;
  is_featured: boolean;
  video_path: string | null;
  presenters: { name: string } | null;
  pricing_options: { price_cents: number }[];
};

export default async function AdminWebinarsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("webinars")
    .select(
      "id, slug, title, kind, event_at, is_published, is_featured, video_path, presenters(name), pricing_options(price_cents)",
    )
    .order("event_at", { ascending: false });

  const webinars = (data ?? []) as unknown as Row[];

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-950">Webinars</h1>
          <p className="mt-1 text-[14px] text-ink-muted">
            {webinars.length} in the catalog
          </p>
        </div>
        <Link
          href="/admin/webinars/new"
          className="flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-[14px] font-bold text-white transition-transform duration-200 hover:-translate-y-0.5"
        >
          <Plus className="size-4" aria-hidden />
          New webinar
        </Link>
      </div>

      {error && (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-800">
          Could not load webinars: {error.message}
        </p>
      )}

      {!error && webinars.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center">
          <p className="text-[15px] font-semibold text-navy-950">
            No webinars yet
          </p>
          <p className="mt-1 text-[14px] text-ink-muted">
            Run the seed script to import the existing catalog, or create one.
          </p>
        </div>
      )}

      {webinars.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[820px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr className="text-[12px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">From</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {webinars.map((w) => {
                const lowest = w.pricing_options.length
                  ? Math.min(...w.pricing_options.map((o) => o.price_cents))
                  : null;
                return (
                  <tr key={w.id} className="text-[14px]">
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-2">
                        {w.video_path && (
                          <Video
                            className="mt-0.5 size-4 shrink-0 text-brand-600"
                            aria-label="Has video"
                          />
                        )}
                        <div>
                          <p className="font-semibold leading-snug text-navy-950">
                            {w.title}
                          </p>
                          <p className="mt-0.5 text-[12.5px] text-ink-muted">
                            {w.presenters?.name ?? "No presenter"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-ink-muted">
                      {w.kind === "pre_recorded" ? "Pre-recorded" : "Upcoming"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-ink-muted">
                      {formatEventDate(w.event_at)}
                    </td>
                    <td className="px-5 py-4 tabular-nums text-ink-muted">
                      {lowest === null ? "—" : formatPrice(lowest)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge on={w.is_published} onLabel="Published" offLabel="Draft" />
                        {w.is_featured && <Badge on onLabel="Featured" offLabel="" />}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/webinars/${w.id}`}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-[13px] font-semibold text-navy-950 transition-colors duration-200 hover:bg-slate-50"
                        >
                          <Pencil className="size-3.5" aria-hidden />
                          Edit
                        </Link>
                        <form action={cloneWebinar}>
                          <input type="hidden" name="id" value={w.id} />
                          <button
                            type="submit"
                            aria-label={`Clone ${w.title}`}
                            className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-[13px] font-semibold text-navy-950 transition-colors duration-200 hover:bg-slate-50"
                          >
                            <Copy className="size-3.5" aria-hidden />
                            Clone
                          </button>
                        </form>
                        <DeleteWebinarButton id={w.id} title={w.title} />
                      </div>
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

function Badge({
  on,
  onLabel,
  offLabel,
}: {
  on: boolean;
  onLabel: string;
  offLabel: string;
}) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-bold ${
        on ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-500"
      }`}
    >
      {on ? onLabel : offLabel}
    </span>
  );
}
