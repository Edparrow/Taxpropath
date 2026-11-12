import { NextResponse, after } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { recordCheckoutEvent, type CheckoutEventName } from "@/lib/checkout-events";

/**
 * Checkout steps reported by the buyer's browser (the server records the rest
 * itself: order created, cancelled, declined, paid). Signed-in buyers only,
 * since checkout requires an account; a few dozen events per minute at most.
 */

const CLIENT_EVENTS: CheckoutEventName[] = [
  "viewed",
  "clicked",
  "form_incomplete",
  "paypal_error",
  "sdk_failed",
  "card_failed",
  "left_page",
];

const MAX_BODY = 4000;
const PER_MINUTE = 40;
const hits = new Map<string, { count: number; reset: number }>();

function rateLimited(key: string) {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.reset < now) {
    hits.set(key, { count: 1, reset: now + 60_000 });
    if (hits.size > 5000) hits.clear();
    return false;
  }
  entry.count += 1;
  return entry.count > PER_MINUTE;
}

const str = (value: unknown, max: number) =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY) return new NextResponse(null, { status: 413 });

  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  if (rateLimited(user.id)) return new NextResponse(null, { status: 429 });

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw);
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const event = String(data.event ?? "") as CheckoutEventName;
  if (!CLIENT_EVENTS.includes(event)) return new NextResponse(null, { status: 400 });

  const paypalOrderId = str(data.paypalOrderId, 40);
  const amount = Number(data.amountCents);
  const details =
    data.details && typeof data.details === "object" && !Array.isArray(data.details)
      ? (data.details as Record<string, unknown>)
      : {};

  after(() =>
    recordCheckoutEvent({
      event,
      userId: user.id,
      sessionId: str(data.session, 64),
      paypalOrderId: paypalOrderId && /^[A-Z0-9]{5,32}$/i.test(paypalOrderId) ? paypalOrderId : null,
      method: str(data.method, 30),
      reason: str(data.reason, 300),
      code: str(data.code, 80),
      amountCents: Number.isFinite(amount) ? Math.round(amount) : null,
      details,
    }),
  );
  return new NextResponse(null, { status: 204 });
}
