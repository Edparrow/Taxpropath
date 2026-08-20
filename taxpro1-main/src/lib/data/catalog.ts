import "server-only";
import { createClient as createBrowserlessClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { PricingOption, Webinar } from "@/lib/types";
import { WEBINARS as STATIC_WEBINARS } from "./webinars";

/**
 * Catalog reads. Backed by Supabase so the admin panel can edit content, with
 * the original hand-transcribed data as a fallback for when Supabase isn't
 * configured (fresh clone, CI) — pages then still render instead of 500ing.
 */

type Row = {
  id: string;
  slug: string;
  title: string;
  kind: Webinar["kind"];
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
  video_path?: string | null;
  video_url?: string | null;
  presenters: { name: string } | null;
  pricing_options: {
    id: string;
    label: string;
    description: string | null;
    price_cents: number;
    sort_order: number;
  }[];
};

const BASE_COLUMNS = `
  id, slug, title, kind, event_at, duration_mins, product_code, description,
  learning_objectives, topics_covered, who_should_attend, cpe_credit,
  field_of_study, prerequisites, learning_level, delivery_method, industry,
  is_featured,
  presenters ( name ),
  pricing_options ( id, label, description, price_cents, sort_order )
`;

const VIDEO_COLUMNS = "video_path, video_url,";

/*
 * The video columns arrive in migration 0005. Selecting a column that doesn't
 * exist fails the whole query, which would blank the catalog — so probe once
 * and fall back to the base column list until the migration is applied.
 */
let videoColumnsExist: boolean | null = null;

async function selectClause(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<string> {
  if (videoColumnsExist === null) {
    const { error } = await supabase.from("webinars").select("video_url").limit(1);
    videoColumnsExist = !error;
    if (!error) return `${VIDEO_COLUMNS} ${BASE_COLUMNS}`;
    console.warn(
      "[catalog] video columns missing — apply supabase/migrations/0005_admin.sql",
    );
  }
  return videoColumnsExist ? `${VIDEO_COLUMNS} ${BASE_COLUMNS}` : BASE_COLUMNS;
}

export type CatalogWebinar = Webinar & {
  id: string;
  videoPath: string | null;
  videoUrl: string | null;
};

function toWebinar(row: Row): CatalogWebinar {
  const options: PricingOption[] = [...(row.pricing_options ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((o) => ({
      id: o.id,
      label: o.label,
      description: o.description,
      priceCents: o.price_cents,
    }));

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    kind: row.kind,
    presenter: row.presenters?.name ?? "",
    eventAt: row.event_at,
    durationMins: row.duration_mins,
    productCode: row.product_code,
    // Stored as one text field; paragraphs are blank-line separated.
    description: (row.description ?? "").split(/\n{2,}/).filter(Boolean),
    learningObjectives: row.learning_objectives ?? [],
    topicsCovered: row.topics_covered ?? [],
    whoShouldAttend: row.who_should_attend ?? [],
    cpeCredit: row.cpe_credit === null ? null : Number(row.cpe_credit),
    fieldOfStudy: row.field_of_study,
    prerequisites: row.prerequisites ?? "None",
    learningLevel: row.learning_level,
    deliveryMethod: row.delivery_method ?? "Group Internet Based",
    industry: row.industry ?? "",
    isFeatured: row.is_featured,
    videoPath: row.video_path ?? null,
    videoUrl: row.video_url ?? null,
    pricingOptions: options,
  };
}

const fallback = (w: Webinar): CatalogWebinar => ({
  ...w,
  id: w.slug,
  videoPath: null,
  videoUrl: null,
});

export async function getWebinars(kind?: Webinar["kind"]): Promise<CatalogWebinar[]> {
  if (!isSupabaseConfigured()) {
    const list = kind ? STATIC_WEBINARS.filter((w) => w.kind === kind) : STATIC_WEBINARS;
    return list.map(fallback);
  }

  const supabase = await createClient();
  let query = supabase
    .from("webinars")
    .select(await selectClause(supabase))
    .order("event_at");
  if (kind) query = query.eq("kind", kind);

  const { data, error } = await query;
  if (error) {
    console.error("[catalog] getWebinars failed", error);
    return [];
  }
  return (data as unknown as Row[]).map(toWebinar);
}

export async function getWebinar(slug: string): Promise<CatalogWebinar | null> {
  if (!isSupabaseConfigured()) {
    const found = STATIC_WEBINARS.find((w) => w.slug === slug);
    return found ? fallback(found) : null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("webinars")
    .select(await selectClause(supabase))
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[catalog] getWebinar failed", error);
    return null;
  }
  return data ? toWebinar(data as unknown as Row) : null;
}

export async function getFeatured(limit = 8): Promise<CatalogWebinar[]> {
  const all = await getWebinars();
  const featured = all.filter((w) => w.isFeatured);
  return (featured.length ? featured : all).slice(0, limit);
}

export async function getRelated(slug: string, limit = 6): Promise<CatalogWebinar[]> {
  const all = await getWebinars("upcoming");
  return all.filter((w) => w.slug !== slug).slice(0, limit);
}

/**
 * Slugs for generateStaticParams. Uses a cookie-free client: this runs at build
 * time where there is no request, so the cookie-based server client throws.
 */
export async function getAllSlugs(): Promise<string[]> {
  if (!isSupabaseConfigured()) return STATIC_WEBINARS.map((w) => w.slug);

  const supabase = createBrowserlessClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
  const { data, error } = await supabase.from("webinars").select("slug");
  if (error || !data) {
    console.error("[catalog] getAllSlugs failed", error);
    return STATIC_WEBINARS.map((w) => w.slug);
  }
  return data.map((r) => r.slug as string);
}
