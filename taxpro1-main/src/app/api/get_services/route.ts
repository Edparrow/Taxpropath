import { NextResponse } from "next/server";
import { getCourses } from "@/lib/data/catalog";
import { feedKeyMatches } from "@/lib/engine";

export const dynamic = "force-dynamic";

/**
 * Course mirror for the course engine (join.us-cpe.com) (3 Nov 2026 brief).
 * GET /api/get_services?api_key=…
 *
 * The engine pulls this hourly to mirror the site's self-study catalog and
 * reconcile its own delivery/program ids.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  if (!feedKeyMatches(url.searchParams.get("api_key"), process.env.SERVICES_API_KEY)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const courses = await getCourses();

  const services = courses.map((c) => ({
    service_id: c.id,
    slug: c.slug,
    title: c.title,
    speaker: c.presenter,
    cpe_credit: c.cpeCredit,
    field_of_study: c.fieldOfStudy,
    engine_delivery_id: c.engineDeliveryId,
    engine_program_id: c.engineProgramId,
    prices: Object.fromEntries(
      c.pricingOptions
        .filter((o) => o.code)
        .map((o) => [o.code, (o.priceCents / 100).toFixed(2)]),
    ),
  }));

  return NextResponse.json({ services });
}
