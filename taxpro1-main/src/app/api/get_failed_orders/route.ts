import { unpaidFeed } from "@/lib/api/unpaid-feed";

export const dynamic = "force-dynamic";

/** GET /api/get_failed_orders?api_key=…[&since=ISO] — unpaid checkouts, one row per order. */
export function GET(request: Request) {
  return unpaidFeed(request, false);
}
