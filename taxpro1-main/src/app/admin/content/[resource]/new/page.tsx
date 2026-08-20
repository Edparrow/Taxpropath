import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { findResource } from "@/lib/admin/resources";
import { RecordForm } from "../../record-form";
import { loadReferenceOptions } from "../reference-options";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ resource: string }>;
}) {
  const { resource: slug } = await params;
  const resource = findResource(slug);
  return { title: resource ? `New ${resource.label.toLowerCase()}` : "New" };
}

export default async function NewRecordPage({
  params,
}: {
  params: Promise<{ resource: string }>;
}) {
  await requireAdmin();

  const { resource: slug } = await params;
  const resource = findResource(slug);
  if (!resource) notFound();

  const referenceOptions = await loadReferenceOptions(resource);

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
        <span className="text-ink-muted">New</span>
      </nav>

      <h1 className="text-2xl font-extrabold text-navy-950">
        New {resource.label.toLowerCase()}
      </h1>

      <div className="mt-6">
        <RecordForm
          resource={resource}
          recordId={null}
          values={{}}
          referenceOptions={referenceOptions}
        />
      </div>
    </>
  );
}
