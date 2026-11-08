import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Course engine (join.us-cpe.com) integration (3 Nov 2026 brief).
 *
 * The doorbell is only a hurry-up: the engine's hourly pull of /api/get_orders
 * is the truth, so a failed POST here is logged and swallowed — it must never
 * fail a checkout that has already settled.
 */
export async function fireOrderDoorbell(payload: {
  order_id: string;
  action: "paid" | "refund";
}): Promise<void> {
  const url = process.env.ENGINE_HOOK_URL;
  if (!url) return; // engine not wired up yet

  const body = JSON.stringify({
    site: "taxpropath",
    ...payload,
    sent_at: new Date().toISOString(),
  });

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const secret = process.env.ENGINE_HOOK_SECRET;
  if (secret) {
    headers["X-Signature"] = createHmac("sha256", secret).update(body).digest("hex");
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.warn(`[engine] doorbell returned ${res.status} for order ${payload.order_id}`);
    }
  } catch (err) {
    console.warn(`[engine] doorbell failed for order ${payload.order_id}`, err);
  }
}

/**
 * Constant-time api_key check for the pull feeds (get_orders, get_services,
 * create_service). Returns false when the expected key isn't configured, so a
 * fresh deploy exposes nothing by accident.
 */
export function feedKeyMatches(provided: string | null, expected: string | undefined): boolean {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
