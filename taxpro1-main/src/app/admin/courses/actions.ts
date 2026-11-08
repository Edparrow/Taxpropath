"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { COURSE_CODES } from "@/lib/types";
import { logActivity } from "@/lib/admin/activity";

/**
 * Self-study course writes. They go through the caller's own session (not the
 * service role) so the admin-only write RLS policy is the thing
 * actually enforcing access — requireAdmin is defence in depth, not the only
 * lock.
 */

const PRICE_LABELS: Record<string, { label: string; description: string; sort: number }> = {
  SELF_STUDY: {
    label: "Self-Study",
    description: "Watch the full course on demand in your portal.",
    sort: 0,
  },
  ETRANSCRIPT: {
    label: "e-Transcript",
    description: "A complete written transcript of the course.",
    sort: 1,
  },
  SLIDES: {
    label: "Slides & Material",
    description: "Downloadable presentation slides and course material.",
    sort: 2,
  },
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function lines(value: FormDataEntryValue | null): string[] {
  const text = String(value ?? "").trim();
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function optionalNumber(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function optionalText(value: FormDataEntryValue | null): string | null {
  const raw = String(value ?? "").trim();
  return raw || null;
}

function optionalUUID(value: FormDataEntryValue | null): string | null {
  const raw = String(value ?? "").trim();
  if (!raw || raw.length !== 36) return null;
  return raw;
}

/** Dollars as typed → cents; null when blank, NaN when not a valid price. */
function priceCents(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : NaN;
}

async function resolvePresenter(
  supabase: Awaited<ReturnType<typeof createClient>>,
  name: string,
): Promise<string | null> {
  if (!name) return null;

  const { data: existing } = await supabase
    .from("presenters")
    .select("id")
    .eq("name", name)
    .maybeSingle();
  if (existing) return existing.id;

  // presenters.slug is NOT NULL UNIQUE, so it has to be supplied here.
  const { data, error } = await supabase
    .from("presenters")
    .insert({ name, slug: slugify(name) || `speaker-${Date.now()}` })
    .select("id")
    .single();
  if (error) {
    console.error("[admin] presenter insert failed", error);
    return null;
  }
  return data.id;
}

type Result = { error: string } | void;

export async function saveCourse(
  courseId: string | null,
  _prev: unknown,
  formData: FormData,
): Promise<Result> {
  const admin = await requireAdmin("courses", "edit");
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Course title is required." };

  const slug = slugify(String(formData.get("slug") ?? "") || title);
  if (!slug) return { error: "Could not derive a URL slug from that title." };

  const prices = Object.fromEntries(
    [COURSE_CODES.base, ...COURSE_CODES.addons].map((code) => [
      code,
      priceCents(formData.get(`price_${code}`)),
    ]),
  ) as Record<string, number | null>;

  if (prices[COURSE_CODES.base] === null) {
    return { error: "The Self-Study course price is required." };
  }
  if (Object.values(prices).some((p) => Number.isNaN(p))) {
    return { error: "Prices must be valid amounts of zero or more." };
  }

  const presenterId = await resolvePresenter(
    supabase,
    String(formData.get("presenter") ?? "").trim(),
  );

  const row = {
    slug,
    title,
    presenter_id: presenterId,

    image_url: optionalText(formData.get("image_url")),
    category_id: optionalUUID(formData.get("category_id")),
    subcategory_id: optionalUUID(formData.get("subcategory_id")),

    description: String(formData.get("description") ?? "").trim(),
    topics_covered: lines(formData.get("topics_covered")),
    who_should_attend: lines(formData.get("who_should_attend")),

    cpe_credit: optionalNumber(formData.get("cpe_credit")),
    field_of_study: optionalText(formData.get("field_of_study")),

    engine_delivery_id: optionalText(formData.get("engine_delivery_id")),
    engine_program_id: optionalText(formData.get("engine_program_id")),

    is_published: formData.get("is_published") === "on",
    is_featured: formData.get("is_featured") === "on",

    seo_title: optionalText(formData.get("meta_title")),
    seo_description: optionalText(formData.get("meta_description")),
    meta_keyword: optionalText(formData.get("meta_keyword")),
  };

  let id = courseId;

  if (id) {
    const { error } = await supabase.from("courses").update(row).eq("id", id);
    if (error) {
      console.error("[admin] course update failed", error);
      return { error: humanise(error.message) };
    }
  } else {
    const { data, error } = await supabase
      .from("courses")
      .insert(row)
      .select("id")
      .single();
    if (error) {
      console.error("[admin] course insert failed", error);
      return { error: humanise(error.message) };
    }
    id = data.id;
  }

  /*
   * Exactly one row per code. Rows are updated in place rather than
   * delete-and-reinsert so their ids stay stable; an emptied add-on removes
   * its row.
   */
  for (const [code, cents] of Object.entries(prices)) {
    const meta = PRICE_LABELS[code];
    if (cents === null) {
      await supabase.from("pricing_options").delete().eq("course_id", id!).eq("code", code);
      continue;
    }

    const { data: existing } = await supabase
      .from("pricing_options")
      .select("id")
      .eq("course_id", id!)
      .eq("code", code)
      .maybeSingle();

    const priceRow = {
      course_id: id!,
      code,
      label: meta.label,
      description: meta.description,
      price_cents: cents,
      sort_order: meta.sort,
    };
    const { error } = existing
      ? await supabase.from("pricing_options").update(priceRow).eq("id", existing.id)
      : await supabase.from("pricing_options").insert(priceRow);
    if (error) {
      console.error(`[admin] pricing upsert failed for ${code}`, error);
      return { error: "Course saved, but pricing could not be updated." };
    }
  }

  await logActivity(admin, courseId ? "UPDATE_COURSE" : "CREATE_COURSE", `${courseId ? "Updated" : "Created"} course "${title}".`, {
    type: "course",
    id: id!,
  });
  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  revalidatePath(`/courses/${slug}`);
  revalidatePath("/");
  redirect("/admin/courses");
}

/** Duplicates a course (and its prices) under a new slug, as an unpublished draft. */
export async function cloneCourse(formData: FormData) {
  const admin = await requireAdmin("courses", "edit");
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { data: source, error: fetchError } = await supabase
    .from("courses")
    .select("*, pricing_options(label, description, price_cents, sort_order, code)")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !source) {
    console.error("[admin] clone course fetch failed", fetchError);
    return;
  }

  const { id: _id, slug, pricing_options, created_at: _createdAt, ...rest } =
    source as Record<string, unknown> & { pricing_options: unknown[] };

  // Find a free "<slug>-copy", "<slug>-copy-2", ... slug.
  let newSlug = `${slug}-copy`;
  for (let i = 2; ; i++) {
    const { data: clash } = await supabase
      .from("courses")
      .select("id")
      .eq("slug", newSlug)
      .maybeSingle();
    if (!clash) break;
    newSlug = `${slug}-copy-${i}`;
  }

  const { data: created, error: insertError } = await supabase
    .from("courses")
    .insert({
      ...rest,
      slug: newSlug,
      title: `${rest.title} (Copy)`,
      is_published: false,
      // Unique per engine recording — a copy must be linked afresh.
      engine_delivery_id: null,
    })
    .select("id")
    .single();

  if (insertError || !created) {
    console.error("[admin] clone course insert failed", insertError);
    return;
  }

  const options = (
    pricing_options as {
      label: string;
      description: string | null;
      price_cents: number;
      sort_order: number;
      code: string | null;
    }[]
  ).map((o) => ({ ...o, course_id: created.id }));
  if (options.length) {
    const { error } = await supabase.from("pricing_options").insert(options);
    if (error) console.error("[admin] clone course pricing insert failed", error);
  }

  await logActivity(admin, "CLONE_COURSE", `Cloned course "${rest.title}" as a draft.`, {
    type: "course",
    id: created.id,
  });
  revalidatePath("/admin/courses");
  redirect(`/admin/courses/${created.id}`);
}

export async function deleteCourse(formData: FormData) {
  const admin = await requireAdmin("courses", "edit");
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { data: deleted, error } = await supabase
    .from("courses")
    .delete()
    .eq("id", id)
    .select("title")
    .maybeSingle();
  if (error) console.error("[admin] course delete failed", error);
  if (deleted) {
    await logActivity(admin, "DELETE_COURSE", `Deleted course "${deleted.title}".`, { type: "course", id });
  }

  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  revalidatePath("/");
}

function humanise(message: string) {
  if (message.includes("duplicate key") && message.includes("slug")) {
    return "A course with that URL slug already exists.";
  }
  if (message.includes("duplicate key") && message.includes("engine_delivery_id")) {
    return "Another course already uses that Engine Delivery ID.";
  }
  if (message.includes("row-level security")) {
    return "You don't have permission to make that change.";
  }
  return "Could not save the course. Please try again.";
}
