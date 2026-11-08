import { NextResponse } from "next/server";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { feedKeyMatches } from "@/lib/engine";
import { COURSE_CODES } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Engine → site course push (3 Nov 2026 brief).
 * POST /api/create_service  (api_key in query or X-Api-Key header)
 *
 * Upserts a self-study course and its three pricing rows. Idempotent by
 * nature — matched on engine_delivery_id first, then slug — so a retried
 * Idempotency-Key simply lands on the same row again.
 */

const CODE_LABELS: Record<string, { label: string; sort: number }> = {
  SELF_STUDY: { label: "Self-Study", sort: 0 },
  ETRANSCRIPT: { label: "e-Transcript", sort: 1 },
  SLIDES: { label: "Slides", sort: 2 },
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

function toCents(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const key = request.headers.get("x-api-key") ?? url.searchParams.get("api_key");
  if (!feedKeyMatches(key, process.env.SERVICES_API_KEY)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured() || !hasServiceRoleKey()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const title = String(body?.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  const engineDeliveryId = String(body?.engine_delivery_id ?? "").trim() || null;
  const slug = slugify(String(body?.slug ?? "").trim() || title);
  if (!slug) {
    return NextResponse.json({ error: "could not derive a slug" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Find-or-create the presenter by name (courses link presenters by id).
  let presenterId: string | null = null;
  const speaker = String(body?.speaker ?? "").trim();
  if (speaker) {
    const presenterSlug = slugify(speaker);
    const { data: existing } = await admin
      .from("presenters")
      .select("id")
      .eq("slug", presenterSlug)
      .maybeSingle();
    if (existing) {
      presenterId = existing.id as string;
    } else {
      const { data: created, error } = await admin
        .from("presenters")
        .insert({ slug: presenterSlug, name: speaker })
        .select("id")
        .single();
      if (error) {
        console.error("[create_service] presenter insert failed", error);
        return NextResponse.json({ error: "presenter upsert failed" }, { status: 500 });
      }
      presenterId = created.id as string;
    }
  }

  // Match on engine_delivery_id first (the engine's own identity), then slug.
  let courseId: string | null = null;
  if (engineDeliveryId) {
    const { data } = await admin
      .from("courses")
      .select("id")
      .eq("engine_delivery_id", engineDeliveryId)
      .maybeSingle();
    if (data) courseId = data.id as string;
  }
  if (!courseId) {
    const { data } = await admin
      .from("courses")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (data) courseId = data.id as string;
  }

  const fields: Record<string, unknown> = {
    title,
    description: body?.description ? String(body.description) : null,
    cpe_credit: body?.cpe_credit != null ? Number(body.cpe_credit) : null,
    field_of_study: body?.field_of_study ? String(body.field_of_study) : null,
    engine_delivery_id: engineDeliveryId,
    engine_program_id: body?.engine_program_id
      ? String(body.engine_program_id)
      : null,
    ...(presenterId ? { presenter_id: presenterId } : {}),
  };

  if (courseId) {
    const { error } = await admin.from("courses").update(fields).eq("id", courseId);
    if (error) {
      console.error("[create_service] update failed", error);
      return NextResponse.json({ error: "course update failed" }, { status: 500 });
    }
  } else {
    const { data, error } = await admin
      .from("courses")
      .insert({ ...fields, slug })
      .select("id")
      .single();
    if (error) {
      console.error("[create_service] insert failed", error);
      return NextResponse.json({ error: "course insert failed" }, { status: 500 });
    }
    courseId = data.id as string;
  }

  // Exactly three pricing rows per course, upserted by (course_id, code).
  const prices = (body?.prices ?? {}) as Record<string, unknown>;
  const codes = [COURSE_CODES.base, ...COURSE_CODES.addons];
  for (const code of codes) {
    if (prices[code] == null) continue;
    const cents = toCents(prices[code]);
    if (cents === null) {
      return NextResponse.json({ error: `invalid price for ${code}` }, { status: 400 });
    }
    const meta = CODE_LABELS[code];
    const { data: existing } = await admin
      .from("pricing_options")
      .select("id")
      .eq("course_id", courseId)
      .eq("code", code)
      .maybeSingle();
    const row = {
      course_id: courseId,
      code,
      label: meta.label,
      price_cents: cents,
      sort_order: meta.sort,
    };
    const { error } = existing
      ? await admin.from("pricing_options").update(row).eq("id", existing.id as string)
      : await admin.from("pricing_options").insert(row);
    if (error) {
      console.error(`[create_service] pricing upsert failed for ${code}`, error);
      return NextResponse.json({ error: "pricing upsert failed" }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    service_id: courseId,
    slug,
    idempotency_key: request.headers.get("idempotency-key") ?? null,
  });
}
