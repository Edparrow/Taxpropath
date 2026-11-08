import { unpaidFeed } from "@/lib/api/unpaid-feed";

export const dynamic = "force-dynamic";

/**
 * GET /api/get_abandoned_analysis?api_key=…[&since=ISO]
 * Unpaid checkouts plus a per-customer summary (attempts, recovered or not).
 */
export function GET(request: Request) {
  return unpaidFeed(request, true);
}
