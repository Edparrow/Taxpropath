import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { WebinarForm, type WebinarFormValues } from "../webinar-form";

export const metadata = { title: "Edit webinar" };

type Row = {
  id: string;
  slug: string;
  title: string;
  kind: string;
  event_at: string;
  duration_mins: number;
  product_code: string | null;
  description: string | null;
  learning_objectives: string[] | null;
  topics_covered: string[] | null;
  who_should_attend: string[] | null;
  cpe_credit: number | string | null;
  field_of_study: string | null;
  prerequisites: string | null;
  learning_level: string | null;
  delivery_method: string | null;
  industry: string | null;
  is_featured: boolean;
  is_published: boolean;
  video_path: string | null;
  video_url: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  faq?: { question: string; answer: string }[] | null;
  presenters: { name: string } | null;
  pricing_options: {
    label: string;
    description: string | null;
    price_cents: number;
    sort_order: number;
  }[];
};

/** `datetime-local` needs `YYYY-MM-DDTHH:mm` with no timezone suffix. */
function toLocalInput(iso: string) {
  return new Date(iso).toISOString().slice(0, 16);
}

export default async function EditWebinarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("webinars")
    .select(
      `id, slug, title, kind, event_at, duration_mins, product_code, description,
       learning_objectives, topics_covered, who_should_attend, cpe_credit,
       field_of_study, prerequisites, learning_level, delivery_method, industry,
       is_featured, is_published, video_path, video_url, seo_title, seo_description, faq,
       presenters ( name ),
       pricing_options ( label, description, price_cents, sort_order )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const row = data as unknown as Row;

  const initial: WebinarFormValues = {
    id: row.id,
    slug: row.slug,
    title: row.title,
    kind: row.kind,
    presenter: row.presenters?.name ?? "",
    eventAt: toLocalInput(row.event_at),
    durationMins: row.duration_mins,
    productCode: row.product_code ?? "",
    description: row.description ?? "",
    learningObjectives: (row.learning_objectives ?? []).join("\n"),
    topicsCovered: (row.topics_covered ?? []).join("\n"),
    whoShouldAttend: (row.who_should_attend ?? []).join("\n"),
    cpeCredit: row.cpe_credit === null ? "" : String(row.cpe_credit),
    fieldOfStudy: row.field_of_study ?? "",
    prerequisites: row.prerequisites ?? "None",
    learningLevel: row.learning_level ?? "",
    deliveryMethod: row.delivery_method ?? "Group Internet Based",
    industry: row.industry ?? "",
    isFeatured: row.is_featured,
    isPublished: row.is_published,
    videoPath: row.video_path,
    videoUrl: row.video_url ?? "",
    seoTitle: row.seo_title ?? "",
    seoDescription: row.seo_description ?? "",
    faq: row.faq ?? [],
    options: [...row.pricing_options]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((o) => ({
        label: o.label,
        description: o.description ?? "",
        price: (o.price_cents / 100).toFixed(2),
      })),
  };

  return (
    <>
      <Link
        href="/admin/webinars"
        className="mb-4 inline-flex items-center gap-1 text-[13.5px] font-semibold text-ink-muted transition-colors duration-200 hover:text-navy-950"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Back to webinars
      </Link>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-navy-950">{row.title}</h1>
        <Link
          href={`/webinar/${row.slug}`}
          target="_blank"
          className="flex items-center gap-1.5 text-[13.5px] font-semibold text-brand-700 hover:underline"
        >
          View on site
          <ExternalLink className="size-3.5" aria-hidden />
        </Link>
      </div>

      <WebinarForm initial={initial} />
    </>
  );
}
