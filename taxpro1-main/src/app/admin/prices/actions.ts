"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { logActivity } from "@/lib/admin/activity";
import { formatPrice } from "@/lib/utils";
import { PRICE_CODES, PRICE_LABELS, priceCents, type PriceCode } from "@/lib/admin/pricing";

/**
 * Change Price: one price for many courses at once, or one course's prices.
 * Writes go through the admin's own session, so the "admins write pricing"
 * RLS policy is what actually enforces access (requireAdmin is the first gate).
 */

export type PriceResult = { ok: boolean; message: string };

/** Dollar amounts as typed, per code. */
export type PriceInput = Partial<Record<PriceCode, string>>;

type Supabase = Awaited<ReturnType<typeof createClient>>;

function priceRow(courseId: string, code: PriceCode, cents: number) {
  const meta = PRICE_LABELS[code];
  return {
    course_id: courseId,
    code,
    label: meta.label,
    description: meta.description,
    price_cents: cents,
    sort_order: meta.sort,
  };
}

/** Sets prices (one row per course per code) and removes the listed add-ons. */
async function writePrices(
  supabase: Supabase,
  courseIds: string[],
  set: Partial<Record<PriceCode, number>>,
  remove: PriceCode[],
): Promise<string | null> {
  const rows = Object.entries(set).flatMap(([code, cents]) =>
    courseIds.map((id) => priceRow(id, code as PriceCode, cents!)),
  );
  // Upserts in chunks: unique (course_id, code) keeps one row per code.
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase
      .from("pricing_options")
      .upsert(rows.slice(i, i + 500), { onConflict: "course_id,code" });
    if (error) {
      console.error("[admin] price upsert failed", error);
      return error.message.includes("row-level security")
        ? "You don't have permission to change prices."
        : "Could not save the prices. Please try again.";
    }
  }
  for (const code of remove) {
    if (code === "SELF_STUDY") continue; // every course must keep its own price
    for (let i = 0; i < courseIds.length; i += 200) {
      const { error } = await supabase
        .from("pricing_options")
        .delete()
        .eq("code", code)
        .in("course_id", courseIds.slice(i, i + 200));
      if (error) {
        console.error("[admin] add-on removal failed", error);
        return "Prices saved, but an add-on could not be removed.";
      }
    }
  }
  return null;
}

function refresh() {
  revalidatePath("/admin/prices");
  revalidatePath("/admin/courses");
  // Course cards, detail pages and the homepage all show prices.
  revalidatePath("/", "layout");
}

const NAMES: Record<PriceCode, string> = {
  SELF_STUDY: "Self-Study",
  ETRANSCRIPT: "e-Transcript",
  SLIDES: "Slides",
};

/**
 * Same price for every course, or for the ticked ones. A blank field leaves
 * that price as it is; "remove" stops offering an add-on.
 */
export async function bulkChangePrices(input: {
  scope: "all" | "selected";
  courseIds: string[];
  prices: PriceInput;
  remove: PriceCode[];
}): Promise<PriceResult> {
  const admin = await requireAdmin("courses", "edit");
  const supabase = await createClient();

  const set: Partial<Record<PriceCode, number>> = {};
  for (const code of PRICE_CODES) {
    if (input.remove.includes(code)) continue;
    const cents = priceCents(input.prices[code]);
    if (Number.isNaN(cents)) return { ok: false, message: `${NAMES[code]} price is not a valid amount.` };
    if (cents !== null) set[code] = cents;
  }
  const remove = input.remove.filter((c) => c !== "SELF_STUDY" && PRICE_CODES.includes(c));
  if (Object.keys(set).length === 0 && remove.length === 0) {
    return { ok: false, message: "Enter at least one price to change." };
  }

  let courseIds: string[];
  if (input.scope === "all") {
    const { data, error } = await supabase.from("courses").select("id");
    if (error) return { ok: false, message: "Could not load the courses." };
    courseIds = (data ?? []).map((c) => c.id);
  } else {
    // Only ids that really are courses.
    const wanted = [...new Set(input.courseIds)].slice(0, 2000);
    if (wanted.length === 0) return { ok: false, message: "Tick at least one course first." };
    const { data, error } = await supabase.from("courses").select("id").in("id", wanted);
    if (error) return { ok: false, message: "Could not load the courses." };
    courseIds = (data ?? []).map((c) => c.id);
  }
  if (courseIds.length === 0) return { ok: false, message: "No courses to update." };

  const failure = await writePrices(supabase, courseIds, set, remove);
  if (failure) return { ok: false, message: failure };

  const changes = [
    ...Object.entries(set).map(([code, cents]) => `${NAMES[code as PriceCode]} ${formatPrice(cents!)}`),
    ...remove.map((code) => `${NAMES[code]} removed`),
  ].join(", ");
  const target = input.scope === "all" ? `all ${courseIds.length} courses` : `${courseIds.length} selected course${courseIds.length === 1 ? "" : "s"}`;
  await logActivity(admin, "BULK_CHANGE_PRICE", `Changed prices for ${target}: ${changes}.`);
  refresh();
  return { ok: true, message: `Updated ${target}: ${changes}.` };
}

/** One course's prices. Self-Study is required; a blank add-on is not offered. */
export async function updateCoursePrices(courseId: string, prices: PriceInput): Promise<PriceResult> {
  const admin = await requireAdmin("courses", "edit");
  const supabase = await createClient();

  const { data: course } = await supabase.from("courses").select("id, title").eq("id", courseId).maybeSingle();
  if (!course) return { ok: false, message: "That course no longer exists." };

  const set: Partial<Record<PriceCode, number>> = {};
  const remove: PriceCode[] = [];
  for (const code of PRICE_CODES) {
    const cents = priceCents(prices[code]);
    if (Number.isNaN(cents)) return { ok: false, message: `${NAMES[code]} price is not a valid amount.` };
    if (cents === null) {
      if (code === "SELF_STUDY") return { ok: false, message: "The Self-Study price is required." };
      remove.push(code);
    } else {
      set[code] = cents;
    }
  }

  const failure = await writePrices(supabase, [course.id], set, remove);
  if (failure) return { ok: false, message: failure };

  const summary = PRICE_CODES.map((code) => `${NAMES[code]} ${set[code] === undefined ? "not offered" : formatPrice(set[code]!)}`).join(", ");
  await logActivity(admin, "CHANGE_PRICE", `Changed prices of "${course.title}": ${summary}.`, {
    type: "course",
    id: course.id,
  });
  refresh();
  return { ok: true, message: "Saved." };
}
