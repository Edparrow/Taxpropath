import "server-only";

/**
 * PayPal Orders v2. Server-side only — the client secret must never reach the
 * browser, so this module is guarded by `server-only`.
 */

const LIVE = "https://api-m.paypal.com";
const SANDBOX = "https://api-m.sandbox.paypal.com";

export function paypalMode(): "live" | "sandbox" {
  return process.env.PAYPAL_MODE === "live" ? "live" : "sandbox";
}

function apiBase() {
  return paypalMode() === "live" ? LIVE : SANDBOX;
}

export function isPaypalConfigured() {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

// Tokens last ~9 hours; cache until shortly before expiry to avoid a token
// round trip on every checkout.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value;

  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
  ).toString("base64");

  const res = await fetch(`${apiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`PayPal auth failed (${res.status}): ${await res.text()}`);
  }

  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + (json.expires_in - 60) * 1000,
  };
  return json.access_token;
}

async function paypalFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });

  const text = await res.text();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new PaypalError(`PayPal ${path} failed (${res.status})`, res.status, body);
  }
  return body;
}

export class PaypalError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
    this.name = "PaypalError";
  }
}

function toDecimal(cents: number) {
  return (cents / 100).toFixed(2);
}

export type PaypalLine = {
  title: string;
  optionLabel: string;
  unitPriceCents: number;
  quantity: number;
};

/** Creates a PayPal order for an amount the caller has already verified. */
export async function createPaypalOrder(opts: {
  totalCents: number;
  lines: PaypalLine[];
  currency?: string;
  referenceId?: string;
}): Promise<{ id: string; status: string }> {
  const currency = opts.currency ?? "USD";
  const itemTotal = opts.lines.reduce(
    (sum, l) => sum + l.unitPriceCents * l.quantity,
    0,
  );

  // PayPal rejects the order if item_total doesn't equal the sum of the items,
  // so only send the breakdown when it genuinely reconciles.
  const breakdownMatches = itemTotal === opts.totalCents;

  return paypalFetch("/v2/checkout/orders", {
    method: "POST",
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: opts.referenceId ?? "default",
          description: "Taxpropath CPE webinars",
          amount: {
            currency_code: currency,
            value: toDecimal(opts.totalCents),
            ...(breakdownMatches && {
              breakdown: {
                item_total: { currency_code: currency, value: toDecimal(itemTotal) },
              },
            }),
          },
          ...(breakdownMatches && {
            items: opts.lines.map((l) => ({
              name: l.title.slice(0, 127),
              description: l.optionLabel.slice(0, 127),
              quantity: String(l.quantity),
              unit_amount: {
                currency_code: currency,
                value: toDecimal(l.unitPriceCents),
              },
              category: "DIGITAL_GOODS",
            })),
          }),
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            shipping_preference: "NO_SHIPPING",
            user_action: "PAY_NOW",
          },
        },
      },
    }),
  });
}

export type CaptureResult = {
  paypalOrderId: string;
  captureId: string | null;
  status: string;
  capturedCents: number;
  currency: string;
};

/** Captures an approved PayPal order and normalises the amount to cents. */
export async function capturePaypalOrder(
  paypalOrderId: string,
): Promise<CaptureResult> {
  const body = await paypalFetch(`/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: "POST",
    // Guards against a double-click capturing twice.
    headers: { "PayPal-Request-Id": `capture-${paypalOrderId}` },
  });

  const capture = body?.purchase_units?.[0]?.payments?.captures?.[0];
  const amount = capture?.amount ?? {};

  return {
    paypalOrderId: body.id,
    captureId: capture?.id ?? null,
    status: capture?.status ?? body.status,
    capturedCents: Math.round(Number(amount.value ?? 0) * 100),
    currency: amount.currency_code ?? "USD",
  };
}

/** Reads an order back from PayPal without capturing it. */
export async function getPaypalOrder(paypalOrderId: string) {
  return paypalFetch(`/v2/checkout/orders/${paypalOrderId}`);
}
