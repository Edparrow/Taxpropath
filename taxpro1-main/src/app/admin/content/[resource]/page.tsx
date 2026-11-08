import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { can, isAdminSection } from "@/lib/admin/permissions";
import { findResource, RESOURCES } from "@/lib/admin/resources";
import { RowActions } from "../row-actions";

/** Only the configured resources exist as routes. */
export function generateStaticParams() {
  return RESOURCES.map((r) => ({ resource: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ resource: string }>;
}) {
  const { resource: slug } = await params;
  return { title: findResource(slug)?.plural ?? "Content" };
}

type Row = Record<string, unknown> & { id: string; is_published: boolean };

export default async function ContentListPage({
  params,
}: {
  params: Promise<{ resource: string }>;
}) {
  const { resource: slug } = await params;
  const resource = findResource(slug);
  if (!resource || !isAdminSection(resource.slug)) notFound();
  const admin = await requireAdmin(resource.slug);
  const canEdit = can(admin, resource.slug, "edit");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from(resource.table)
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const rows = (data ?? []) as Row[];

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-950">{resource.plural}</h1>
          <p className="mt-1 text-[14px] text-ink-muted">{resource.description}</p>
        </div>
        {canEdit && (
        <Link
          href={`/admin/content/${resource.slug}/new`}
          className="flex shrink-0 items-center gap-2 rounded-full bg-brand-gradient shadow-md shadow-brand-600/20 px-5 py-2.5 text-[14px] font-bold text-white transition-transform duration-200 hover:-translate-y-0.5"
        >
          <Plus className="size-4" aria-hidden />
          Create {resource.label.toLowerCase()}
        </Link>
        )}
      </div>

      {error && (
        <div className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-[14px] leading-relaxed text-amber-900">
          <p className="font-semibold">Could not load {resource.plural.toLowerCase()}.</p>
          <p className="mt-1">{error.message}</p>
          <p className="mt-2">
            If the table is missing, apply{" "}
            <code className="font-mono font-semibold">
              supabase/migrations/0001_initial_schema.sql
            </code>
            .
          </p>
        </div>
      )}

      {!error && rows.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center">
          <p className="text-[15px] font-semibold text-navy-950">
            No {resource.plural.toLowerCase()} yet
          </p>
          <p className="mt-1 text-[14px] text-ink-muted">
            Create the first one to see it here.
          </p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[720px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr className="text-[12px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">#</th>
                {resource.listColumns.map((column) => (
                  <th key={column} className="px-5 py-3">
                    {resource.fields.find((f) => f.name === column)?.label ?? column}
                  </th>
                ))}
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, index) => {
                const primary = String(row[resource.listColumns[0]] ?? "Untitled");
                return (
                  <tr key={row.id} className="text-[14px]">
                    <td className="px-5 py-4 tabular-nums text-slate-400">
                      {index + 1}
                    </td>
                    {resource.listColumns.map((column, i) => (
                      <td
                        key={column}
                        className={
                          i === 0
                            ? "px-5 py-4 font-semibold text-navy-950"
                            : "px-5 py-4 text-ink-muted"
                        }
                      >
                        <span className="line-clamp-2">
                          {String(row[column] ?? "—")}
                        </span>
                      </td>
                    ))}
                    <td className="px-5 py-4 tabular-nums text-ink-muted">
                      {String(row.sort_order ?? 0)}
                    </td>
                    <td className="px-5 py-4">
                      {canEdit ? (
                        <RowActions
                          resourceSlug={resource.slug}
                          recordId={row.id}
                          label={primary}
                          isPublished={Boolean(row.is_published)}
                        />
                      ) : (
                        <span className="block text-right text-[12.5px] text-ink-muted">View only</span>
                      )}
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
