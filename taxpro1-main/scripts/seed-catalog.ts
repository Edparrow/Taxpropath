/**
 * One-off: copies the sample self-study courses in src/lib/data/sample-courses.ts
 * into Supabase so they become editable from the admin panel.
 *
 *   npx tsx scripts/seed-catalog.ts
 *
 * Idempotent — re-running updates existing rows rather than duplicating them.
 * Meant for development databases: the add-on prices are placeholders.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { SAMPLE_COURSES } from "../src/lib/data/sample-courses";

// .env.local isn't loaded outside Next, so parse it directly.
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Supabase env vars missing");

console.log(`Seeding ${url}\n`);

const db = createClient(url, key, { auth: { persistSession: false } });

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function main() {
  // ---------------------------------------------------------- presenters
  const names = [...new Set(SAMPLE_COURSES.map((c) => c.presenter))].filter(Boolean);
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

  // ------------------------------------------------------------- courses
  for (const c of SAMPLE_COURSES) {
    const row = {
      slug: c.slug,
      title: c.title,
      presenter_id: presenterIds.get(c.presenter) ?? null,
      description: c.description.join("\n\n"),
      learning_objectives: c.learningObjectives,
      topics_covered: c.topicsCovered,
      who_should_attend: c.whoShouldAttend,
      cpe_credit: c.cpeCredit,
      field_of_study: c.fieldOfStudy,
      prerequisites: c.prerequisites,
      learning_level: c.learningLevel,
      is_featured: c.isFeatured,
      is_published: true,
    };

    const { data: course, error } = await db
      .from("courses")
      .upsert(row, { onConflict: "slug" })
      .select("id")
      .single();
    if (error) throw error;

    // Replace pricing wholesale so re-runs don't accumulate stale rows.
    await db.from("pricing_options").delete().eq("course_id", course.id);
    const { error: priceError } = await db.from("pricing_options").insert(
      c.pricingOptions.map((o, i) => ({
        course_id: course.id,
        code: o.code,
        label: o.label,
        description: o.description,
        price_cents: o.priceCents,
        sort_order: i,
      })),
    );
    if (priceError) throw priceError;

    console.log(`  ✓ ${c.slug}`);
  }

  const { count } = await db
    .from("courses")
    .select("*", { count: "exact", head: true });
  console.log(`\ndone — ${count} courses in Supabase`);

  // The homepage hero is read only from the banners table. Give a fresh
  // database one starting banner; never touch banners an admin already made.
  const { count: bannerCount } = await db
    .from("banners")
    .select("*", { count: "exact", head: true });
  if (!bannerCount) {
    const { error: bannerError } = await db.from("banners").insert({
      title: "Self-study CPE courses for tax professionals",
      image_url: "/herosection/slider_1__.webp",
      cta_label: "Browse Courses",
      cta_href: "/courses",
      sort_order: 0,
    });
    if (bannerError) throw bannerError;
    console.log("banners: added the starting homepage hero");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
