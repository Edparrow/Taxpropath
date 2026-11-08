import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { CourseForm, type CourseFormValues } from "../course-form";

export const metadata = { title: "Edit Course" };

type Row = {
  id: string;
  slug: string;
  title: string;
  image_url: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  description: string | null;
  topics_covered: string[] | null;
  who_should_attend: string[] | null;
  cpe_credit: number | string | null;
  field_of_study: string | null;
  engine_delivery_id: string | null;
  engine_program_id: string | null;
  is_published: boolean;
  is_featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  meta_keyword: string | null;
  presenters: { name: string } | null;
  pricing_options: { code: string | null; price_cents: number }[];
};

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin("courses");
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("courses")
    .select(
      `id, slug, title, image_url, category_id, subcategory_id, description,
       topics_covered, who_should_attend, cpe_credit, field_of_study,
       engine_delivery_id, engine_program_id, is_published, is_featured,
       seo_title, seo_description, meta_keyword,
       presenters ( name ),
       pricing_options ( code, price_cents )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const row = data as unknown as Row;

  const price = (code: string) => {
    const found = row.pricing_options.find((o) => o.code === code);
    return found ? (found.price_cents / 100).toFixed(2) : "";
  };

  const initial: CourseFormValues = {
    id: row.id,
    slug: row.slug,
    title: row.title,
    presenter: row.presenters?.name ?? "",

    imageUrl: row.image_url ?? "",
    categoryId: row.category_id ?? "",
    subcategoryId: row.subcategory_id ?? "",

    description: row.description ?? "",
    topicsCovered: (row.topics_covered ?? []).join("\n"),
    whoShouldAttend: (row.who_should_attend ?? []).join("\n"),

    cpeCredit: row.cpe_credit === null ? "" : String(row.cpe_credit),
    fieldOfStudy: row.field_of_study ?? "",

    prices: {
      SELF_STUDY: price("SELF_STUDY"),
      ETRANSCRIPT: price("ETRANSCRIPT"),
      SLIDES: price("SLIDES"),
    },

    engineDeliveryId: row.engine_delivery_id ?? "",
    engineProgramId: row.engine_program_id ?? "",

    isPublished: row.is_published,
    isFeatured: row.is_featured,

    metaTitle: row.seo_title ?? "",
    metaKeyword: row.meta_keyword ?? "",
    metaDescription: row.seo_description ?? "",
  };

  const [{ data: categories }, { data: subcategories }] = await Promise.all([
    supabase.from("categories").select("id, name").order("sort_order"),
    supabase.from("subcategories").select("id, category_id, name").order("sort_order"),
  ]);

  return (
    <>
      <Link
        href="/admin/courses"
        className="mb-4 inline-flex items-center gap-1 text-[13.5px] font-semibold text-ink-muted transition-colors duration-200 hover:text-navy-950"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Back to Courses
      </Link>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-navy-950">{row.title}</h1>
        <Link
          href={`/courses/${row.slug}`}
          target="_blank"
          className="flex items-center gap-1.5 text-[13.5px] font-semibold text-brand-700 hover:underline"
        >
          View on site
          <ExternalLink className="size-3.5" aria-hidden />
        </Link>
      </div>

      <CourseForm
        initial={initial}
        categories={categories || []}
        subcategories={subcategories || []}
      />
    </>
  );
}
