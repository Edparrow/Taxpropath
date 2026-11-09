import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { isAdminSection } from "@/lib/admin/permissions";
import { findResource } from "@/lib/admin/resources";
import { RecordForm } from "../../record-form";
import { loadReferenceOptions } from "../reference-options";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ resource: string; id: string }>;
}) {
  const { resource: slug } = await params;
  const resource = findResource(slug);
  return { title: resource ? `Edit ${resource.label.toLowerCase()}` : "Edit" };
}

export default async function EditRecordPage({
  params,
}: {
  params: Promise<{ resource: string; id: string }>;
}) {
  const { resource: slug, id } = await params;
  const resource = findResource(slug);
  if (!resource || !isAdminSection(resource.slug)) notFound();
  await requireAdmin(resource.slug);

  const supabase = await createClient();
  const [{ data: row, error }, referenceOptions] = await Promise.all([
    supabase
      .from(resource.table)
      .select("*")
      .eq("id", id)
      .match(resource.scope ?? {})
      .maybeSingle(),
    loadReferenceOptions(resource),
  ]);

  if (error) {
    console.error(`[admin] ${resource.table} load failed`, error);
  }
  if (!row) notFound();

  const primaryColumn = resource.listColumns[0];
  const heading = String(
    (row as Record<string, unknown>)[primaryColumn] ?? resource.label,
  );

  return (
    <>
      <nav className="mb-2 text-[13px]">
        <Link
          href={`/admin/content/${resource.slug}`}
          className="font-semibold text-brand-700 hover:underline"
        >
          {resource.plural}
        </Link>
        <span className="mx-2 text-slate-400">/</span>
        <span className="text-ink-muted">Edit</span>
      </nav>

      <h1 className="text-2xl font-extrabold text-navy-950">{heading}</h1>

      <div className="mt-6">
        <RecordForm
          resource={resource}
          recordId={id}
          values={row as Record<string, unknown>}
          referenceOptions={referenceOptions}
        />
      </div>
    </>
  );
}
