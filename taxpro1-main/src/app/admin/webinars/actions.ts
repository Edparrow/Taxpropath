"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * Writes go through the caller's own session (not the service role) so the
 * "admins write webinars" RLS policy is the thing actually enforcing access —
 * requireAdmin is defence in depth, not the only lock.
 */

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function lines(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split("\n")
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

  const { data, error } = await supabase
    .from("presenters")
    .insert({ name })
    .select("id")
    .single();
  if (error) {
    console.error("[admin] presenter insert failed", error);
    return null;
  }
  return data.id;
}

type Result = { error: string } | void;

export async function saveWebinar(
  webinarId: string | null,
  _prev: unknown,
  formData: FormData,
): Promise<Result> {
  await requireAdmin();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Title is required." };

  const eventAt = String(formData.get("event_at") ?? "").trim();
  if (!eventAt) return { error: "Event date is required." };

  const slug = slugify(String(formData.get("slug") ?? "") || title);
  if (!slug) return { error: "Could not derive a URL slug from that title." };

  const presenterId = await resolvePresenter(
    supabase,
    String(formData.get("presenter") ?? "").trim(),
  );

  const videoPath = optionalText(formData.get("video_path"));
  const videoUrl = optionalText(formData.get("video_url"));

  const row = {
    slug,
    title,
    kind: formData.get("kind") === "pre_recorded" ? "pre_recorded" : "upcoming",
    presenter_id: presenterId,
    event_at: new Date(eventAt).toISOString(),
    duration_mins: optionalNumber(formData.get("duration_mins")) ?? 60,
    product_code: optionalText(formData.get("product_code")),
    description: String(formData.get("description") ?? "").trim(),
    learning_objectives: lines(formData.get("learning_objectives")),
    topics_covered: lines(formData.get("topics_covered")),
    who_should_attend: lines(formData.get("who_should_attend")),
    cpe_credit: optionalNumber(formData.get("cpe_credit")),
    field_of_study: optionalText(formData.get("field_of_study")),
    prerequisites: optionalText(formData.get("prerequisites")) ?? "None",
    learning_level: optionalText(formData.get("learning_level")),
    delivery_method:
      optionalText(formData.get("delivery_method")) ?? "Group Internet Based",
    industry: optionalText(formData.get("industry")),
    is_featured: formData.get("is_featured") === "on",
    is_published: formData.get("is_published") === "on",
    video_path: videoPath,
    video_url: videoUrl,
    video_status: videoPath || videoUrl ? "ready" : "none",
  };

  let id = webinarId;

  if (id) {
    const { error } = await supabase.from("webinars").update(row).eq("id", id);
    if (error) {
      console.error("[admin] webinar update failed", error);
      return { error: humanise(error.message) };
    }
  } else {
    const { data, error } = await supabase
      .from("webinars")
      .insert(row)
      .select("id")
      .single();
    if (error) {
      console.error("[admin] webinar insert failed", error);
      return { error: humanise(error.message) };
    }
    id = data.id;
  }

  // Pricing rows are replaced wholesale — simpler than diffing, and the form
  // always submits the complete set.
  const labels = formData.getAll("option_label").map(String);
  const prices = formData.getAll("option_price").map(String);
  const descriptions = formData.getAll("option_description").map(String);

  const options = labels
    .map((label, i) => ({
      webinar_id: id!,
      label: label.trim(),
      description: descriptions[i]?.trim() || null,
      price_cents: Math.round(Number(prices[i] ?? 0) * 100),
      sort_order: i,
    }))
    .filter((o) => o.label && Number.isFinite(o.price_cents) && o.price_cents >= 0);

  await supabase.from("pricing_options").delete().eq("webinar_id", id!);
  if (options.length) {
    const { error } = await supabase.from("pricing_options").insert(options);
    if (error) {
      console.error("[admin] pricing insert failed", error);
      return { error: "Webinar saved, but pricing could not be updated." };
    }
  }

  revalidatePath("/admin/webinars");
  revalidatePath("/webinar/upcoming");
  revalidatePath("/webinar/pre-recorded");
  revalidatePath(`/webinar/${slug}`);
  revalidatePath("/");
  redirect("/admin/webinars");
}

export async function deleteWebinar(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { error } = await supabase.from("webinars").delete().eq("id", id);
  if (error) console.error("[admin] webinar delete failed", error);

  revalidatePath("/admin/webinars");
  revalidatePath("/webinar/upcoming");
  revalidatePath("/webinar/pre-recorded");
  revalidatePath("/");
}

function humanise(message: string) {
  if (message.includes("duplicate key") && message.includes("slug")) {
    return "A webinar with that URL slug already exists.";
  }
  if (message.includes("row-level security")) {
    return "You don't have permission to make that change.";
  }
  return "Could not save the webinar. Please try again.";
}
