import Link from "next/link";
import { Copy, Link2, Pencil, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { can } from "@/lib/admin/permissions";
import { ViewOnlyNotice } from "../view-only";
import { formatPrice } from "@/lib/utils";
import { DeleteCourseButton } from "./delete-button";
import { cloneCourse } from "./actions";

export const metadata = { title: "Courses" };

type Row = {
  id: string;
  slug: string;
  title: string;
  cpe_credit: number | string | null;
  is_published: boolean;
  is_featured: boolean;
  engine_delivery_id: string | null;
  presenters: { name: string } | null;
  pricing_options: { code: string | null; price_cents: number }[];
};

export default async function AdminCoursesPage() {
  const admin = await requireAdmin("courses");
  const canEdit = can(admin, "courses", "edit");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("courses")
    .select(
      "id, slug, title, cpe_credit, is_published, is_featured, engine_delivery_id, presenters(name), pricing_options(code, price_cents)",
    )
    .order("created_at", { ascending: false });

  const courses = (data ?? []) as unknown as Row[];

  return (
    <>
      {!canEdit && <ViewOnlyNotice />}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-950">Courses</h1>
          <p className="mt-1 text-[14px] text-ink-muted">
            {courses.length} self-study course{courses.length === 1 ? "" : "s"}
          </p>
        </div>
        {canEdit && (
          <Link
            href="/admin/courses/new"
            className="flex items-center gap-2 rounded-full bg-brand-gradient shadow-md shadow-brand-600/20 px-5 py-2.5 text-[14px] font-bold text-white transition-transform duration-200 hover:-translate-y-0.5"
          >
            <Plus className="size-4" aria-hidden />
            New course
          </Link>
        )}
      </div>

      {error && (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-800">
          Could not load courses: {error.message}
        </p>
      )}

      {!error && courses.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center">
          <p className="text-[15px] font-semibold text-navy-950">No courses yet</p>
          <p className="mt-1 text-[14px] text-ink-muted">
            Create one, or run the seed script to import the sample catalog.
          </p>
        </div>
      )}

      {courses.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[820px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr className="text-[12px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Credit</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Add-ons</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courses.map((c) => {
                const base = c.pricing_options.find((o) => o.code === "SELF_STUDY");
                const addons = c.pricing_options.filter(
                  (o) => o.code === "ETRANSCRIPT" || o.code === "SLIDES",
                ).length;
                return (
                  <tr key={c.id} className="text-[14px]">
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-2">
                        {c.engine_delivery_id && (
                          <Link2
                            className="mt-0.5 size-4 shrink-0 text-brand-600"
                            aria-label="Linked to the course engine"
                          />
                        )}
                        <div>
                          <p className="font-semibold leading-snug text-navy-950">{c.title}</p>
                          <p className="mt-0.5 text-[12.5px] text-ink-muted">
                            {c.presenters?.name ?? "No speaker"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 tabular-nums text-ink-muted">
                      {c.cpe_credit === null ? "—" : c.cpe_credit}
                    </td>
                    <td className="px-5 py-4 tabular-nums text-ink-muted">
                      {base ? formatPrice(base.price_cents) : (
                        <span className="font-semibold text-red-700">Missing</span>
                      )}
                    </td>
                    <td className="px-5 py-4 tabular-nums text-ink-muted">{addons} / 2</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge on={c.is_published} onLabel="Published" offLabel="Draft" />
                        {c.is_featured && <Badge on onLabel="Featured" offLabel="" />}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/courses/${c.id}`}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-[13px] font-semibold text-navy-950 transition-colors duration-200 hover:bg-slate-50"
                        >
                          <Pencil className="size-3.5" aria-hidden />
                          Edit
                        </Link>
                        {canEdit && (
                          <form action={cloneCourse}>
                            <input type="hidden" name="id" value={c.id} />
                            <button
                              type="submit"
                              aria-label={`Clone ${c.title}`}
                              className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-[13px] font-semibold text-navy-950 transition-colors duration-200 hover:bg-slate-50"
                            >
                              <Copy className="size-3.5" aria-hidden />
                              Clone
                            </button>
                          </form>
                        )}
                        {canEdit && <DeleteCourseButton id={c.id} title={c.title} />}
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
