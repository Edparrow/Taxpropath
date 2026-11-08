import { reportDbError } from "@/lib/errors/log";
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Course, FaqItem, PricingOption } from "@/lib/types";
import { SAMPLE_COURSES } from "./sample-courses";

/**
 * Course catalog reads. Backed by Supabase so the admin panel can edit
 * content, with sample courses as a fallback when Supabase isn't configured
 * (fresh clone, CI) — pages then still render instead of 500ing.
 */

type Row = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  learning_objectives: string[] | null;
  topics_covered: string[] | null;
  who_should_attend: string[] | null;
  cpe_credit: number | string | null;
  field_of_study: string | null;
  prerequisites: string | null;
  learning_level: string | null;
  is_featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  faq: FaqItem[] | null;
  engine_delivery_id: string | null;
  engine_program_id: string | null;
  presenters: { name: string } | null;
  pricing_options: {
    id: string;
    code: string;
    label: string;
    description: string | null;
    price_cents: number;
    sort_order: number;
  }[];
};

const COLUMNS = `
  id, slug, title, description, learning_objectives, topics_covered,
  who_should_attend, cpe_credit, field_of_study, prerequisites, learning_level,
  is_featured, seo_title, seo_description, faq, engine_delivery_id,
  engine_program_id,
  presenters ( name ),
  pricing_options ( id, code, label, description, price_cents, sort_order )
`;

function toCourse(row: Row): Course {
  const options: PricingOption[] = [...(row.pricing_options ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((o) => ({
      id: o.id,
      code: o.code,
      label: o.label,
      description: o.description,
      priceCents: o.price_cents,
    }));

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    presenter: row.presenters?.name ?? "",
    // Stored as one text field; paragraphs are blank-line separated.
    description: (row.description ?? "").split(/\n{2,}/).filter(Boolean),
    learningObjectives: row.learning_objectives ?? [],
    topicsCovered: row.topics_covered ?? [],
    whoShouldAttend: row.who_should_attend ?? [],
    cpeCredit: row.cpe_credit === null ? null : Number(row.cpe_credit),
    fieldOfStudy: row.field_of_study,
    prerequisites: row.prerequisites ?? "None",
    learningLevel: row.learning_level,
    isFeatured: row.is_featured,
    pricingOptions: options,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    faq: row.faq ?? [],
    engineDeliveryId: row.engine_delivery_id,
    engineProgramId: row.engine_program_id,
  };
}

/** Every published course, newest first. Drafts are never shown or sold. */
export async function getCourses(): Promise<Course[]> {
  if (!isSupabaseConfigured()) return SAMPLE_COURSES;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select(COLUMNS)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) {
    reportDbError("Loading the course list", error);
    return [];
  }
  return (data as unknown as Row[]).map(toCourse);
}

export async function getCourse(slug: string): Promise<Course | null> {
  if (!isSupabaseConfigured()) {
    return SAMPLE_COURSES.find((c) => c.slug === slug) ?? null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select(COLUMNS)
    .eq("is_published", true)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    reportDbError(`Loading course ${slug}`, error);
    return null;
  }
  return data ? toCourse(data as unknown as Row) : null;
}

/** Featured courses for the homepage, falling back to the newest ones. */
export async function getFeaturedCourses(limit = 3): Promise<Course[]> {
  const all = await getCourses();
  const featured = all.filter((c) => c.isFeatured);
  return (featured.length ? featured : all).slice(0, limit);
}
