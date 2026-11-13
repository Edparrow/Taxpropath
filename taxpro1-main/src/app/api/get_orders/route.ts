import { NextResponse } from "next/server";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { feedKeyMatches } from "@/lib/engine";
import { readOrderFeed } from "@/lib/api/order-feed";

export const dynamic = "force-dynamic";

/**
 * Order feed for Ravit's CRM (brief of 12 Nov 2026).
 * GET /api/get_orders?api_key=<KEY>
 *
 *   ORDERS_API_KEY       → every real, paid order line (the live feed)
 *   ORDERS_TEST_API_KEY  → PayPal sandbox order lines only (for testing)
 *   anything else        → 401, no orders
 *
 * Always the full list (no paging, no `since`). The rules are in
 * src/lib/api/order-feed.ts.
 */
export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("api_key");
  const live = feedKeyMatches(key, process.env.ORDERS_API_KEY);
  const test = !live && feedKeyMatches(key, process.env.ORDERS_TEST_API_KEY);
  if (!live && !test) {
    return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured() || !hasServiceRoleKey()) {
    return NextResponse.json({ status: "error", message: "Not configured" }, { status: 503 });
  }

  try {
    const data = await readOrderFeed(createAdminClient(), test);
    return NextResponse.json(
      { status: "success", total_items: data.length, data },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("[get_orders] failed", err);
    return NextResponse.json({ status: "error", message: "Query failed" }, { status: 500 });
  }
}
