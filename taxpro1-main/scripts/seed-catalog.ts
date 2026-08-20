/**
 * One-off: copies the hand-transcribed catalog in src/lib/data/webinars.ts into
 * Supabase so it becomes editable from the admin panel.
 *
 *   npx tsx scripts/seed-catalog.ts
 *
 * Idempotent — re-running updates existing rows rather than duplicating them.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { WEBINARS } from "../src/lib/data/webinars";

// .env.local isn't loaded outside Next, so parse it directly.
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Supabase env vars missing");

const db = createClient(url, key, { auth: { persistSession: false } });

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/*
 * Placeholder recordings so the video surfaces aren't empty before real footage
 * is uploaded. Blender Foundation open movies — Creative Commons licensed and
 * long-lived, so the embeds won't rot. Replace them from the admin panel.
 */
const DEMO_VIDEOS = [
  "https://www.youtube.com/watch?v=aqz-KE-bpKQ", // Big Buck Bunny
  "https://www.youtube.com/watch?v=eRsGyueVLvQ", // Sintel
  "https://www.youtube.com/watch?v=R6MlUcmOul8", // Tears of Steel
  "https://www.youtube.com/watch?v=TLkA0RELQ1g", // Elephants Dream
  "https://www.youtube.com/watch?v=Y-rmzh0PI3c", // Cosmos Laundromat
];

/**
 * The video columns arrive in migration 0005. Probe for them so the catalog can
 * still be seeded before that migration is applied, rather than failing outright.
 */
async function hasVideoColumns(): Promise<boolean> {
  const { error } = await db.from("webinars").select("video_url").limit(1);
  return !error;
}

async function main() {
  const withVideo = await hasVideoColumns();
  if (!withVideo) {
    console.warn(
      "! migration 0005 not applied — seeding without video fields.\n" +
        "  Run supabase/migrations/0005_admin.sql, then re-run this script.\n",
    );
  }

  // ---------------------------------------------------------- presenters
  const names = [...new Set(WEBINARS.map((w) => w.presenter))].filter(Boolean);
  const presenterIds = new Map<string, string>();

  for (const name of names) {
    const { data: existing } = await db
      .from("presenters")
      .select("id")
      .eq("name", name)
      .maybeSingle();

    if (existing) {
      presenterIds.set(name, existing.id);
      continue;
    }
    const { data, error } = await db
      .from("presenters")
      .insert({ name, slug: slugify(name) })
      .select("id")
      .single();
    if (error) throw error;
    presenterIds.set(name, data.id);
  }
  console.log(`presenters: ${presenterIds.size}`);

  // ------------------------------------------------------------ webinars
  for (const [index, w] of WEBINARS.entries()) {
    // Every webinar gets a demo recording so no video surface is ever empty.
    const demoUrl = DEMO_VIDEOS[index % DEMO_VIDEOS.length];

    const row = {
      ...(withVideo && { video_url: demoUrl, video_status: "ready" }),
      slug: w.slug,
      title: w.title,
      kind: w.kind,
      presenter_id: presenterIds.get(w.presenter) ?? null,
      event_at: w.eventAt,
      duration_mins: w.durationMins,
      product_code: w.productCode,
      description: w.description.join("\n\n"),
      learning_objectives: w.learningObjectives,
      topics_covered: w.topicsCovered,
      who_should_attend: w.whoShouldAttend,
      cpe_credit: w.cpeCredit,
      field_of_study: w.fieldOfStudy,
      prerequisites: w.prerequisites,
      learning_level: w.learningLevel,
      delivery_method: w.deliveryMethod,
      industry: w.industry,
      is_featured: w.isFeatured,
      ...(withVideo && { is_published: true }),
    };

    const { data: webinar, error } = await db
      .from("webinars")
      .upsert(row, { onConflict: "slug" })
      .select("id")
      .single();
    if (error) throw error;

    // Replace pricing wholesale so re-runs don't accumulate stale rows.
    await db.from("pricing_options").delete().eq("webinar_id", webinar.id);
    const { error: priceError } = await db.from("pricing_options").insert(
      w.pricingOptions.map((o, i) => ({
        webinar_id: webinar.id,
        label: o.label,
        description: o.description,
        price_cents: o.priceCents,
        sort_order: i,
      })),
    );
    if (priceError) throw priceError;

    console.log(`  ✓ ${w.slug} (${w.pricingOptions.length} options)`);
  }

  const { count } = await db
    .from("webinars")
    .select("*", { count: "exact", head: true });
  console.log(`\ndone — ${count} webinars in Supabase`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
