import { getWebinar } from "@/lib/data/catalog";

export type IncomingLine = {
  webinarSlug: string;
  optionId: string;
  quantity: number;
};

export type PricedItem = {
  webinar_slug: string;
  pricing_option_id: string;
  quantity: number;
  unit_price_cents: number;
  title_snapshot: string;
  option_snapshot: string;
};

export const BILLING_FIELDS = [
  "first_name",
  "last_name",
  "email",
  "phone",
  "company",
  "address1",
  "address2",
  "city",
  "zip",
  "ptin",
  "country",
  "region",
] as const;

/**
 * Re-derives every line's price from the catalog. Client-supplied prices are
 * ignored entirely — this is the only place an order total is allowed to come
 * from, so a tampered cart can never change what the buyer is charged.
 */
export async function priceCart(
  lines: unknown,
): Promise<
  { ok: true; items: PricedItem[]; totalCents: number } | { ok: false; error: string }
> {
  if (!Array.isArray(lines) || lines.length === 0) {
    return { ok: false, error: "Your cart is empty." };
  }
  if (lines.length > 50) {
    return { ok: false, error: "Too many items in cart." };
  }

  const items: PricedItem[] = [];

  for (const line of lines as IncomingLine[]) {
    const webinar = await getWebinar(String(line?.webinarSlug));
    const option = webinar?.pricingOptions.find((o) => o.id === line?.optionId);
    if (!webinar || !option) {
      return { ok: false, error: "One of the items in your cart is no longer available." };
    }

    const quantity = Math.floor(Number(line.quantity));
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 99) {
      return { ok: false, error: "Invalid quantity." };
    }

    items.push({
      webinar_slug: webinar.slug,
      pricing_option_id: option.id,
      quantity,
      unit_price_cents: option.priceCents,
      title_snapshot: webinar.title,
      option_snapshot: option.label,
    });
  }

  return {
    ok: true,
    items,
    totalCents: items.reduce((sum, i) => sum + i.unit_price_cents * i.quantity, 0),
  };
}

export function sanitizeBilling(input: unknown): Record<string, string> {
  const raw = (input ?? {}) as Record<string, unknown>;
  return Object.fromEntries(
    BILLING_FIELDS.map((key) => [key, String(raw[key] ?? "").trim().slice(0, 300)]),
  );
}
