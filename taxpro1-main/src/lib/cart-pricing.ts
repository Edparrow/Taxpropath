import { getCourse } from "@/lib/data/catalog";
import { COURSE_CODES } from "@/lib/types";

export type IncomingLine = {
  courseSlug: string;
  /** Add-ons riding on the course line: codes, or {code} objects from CartLine. */
  addons?: unknown;
};

/** One order_items row, in the shape the place_order RPC expects. */
export type PricedItem = {
  course_slug: string;
  pricing_option_id: string;
  option_code: string | null;
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

const UNAVAILABLE = "One of the items in your cart is no longer available.";

/**
 * Re-derives every line's price from the catalog. Client-supplied prices are
 * ignored entirely — this is the only place an order total is allowed to come
 * from, so a tampered cart can never change what the buyer is charged.
 *
 * Self-study only: each course is priced by (course_slug, code) and becomes one
 * order item per product — the SELF_STUDY base plus each chosen add-on — with
 * quantity fixed at one. A course listed twice is only charged once.
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
  const seen = new Set<string>();

  for (const line of lines as IncomingLine[]) {
    const slug = String(line?.courseSlug ?? "");
    if (seen.has(slug)) continue;
    seen.add(slug);

    const course = await getCourse(slug);
    const base = course?.pricingOptions.find((o) => o.code === COURSE_CODES.base);
    if (!course || !base) return { ok: false, error: UNAVAILABLE };

    items.push({
      course_slug: course.slug,
      pricing_option_id: base.id,
      option_code: COURSE_CODES.base,
      quantity: 1,
      unit_price_cents: base.priceCents,
      title_snapshot: course.title,
      option_snapshot: base.label || "Self-Study",
    });

    const requested = Array.isArray(line.addons)
      ? line.addons.map((a) =>
          typeof a === "string" ? a : String((a as { code?: unknown })?.code ?? ""),
        )
      : [];
    for (const code of COURSE_CODES.addons) {
      if (!requested.includes(code)) continue;
      const addon = course.pricingOptions.find((o) => o.code === code);
      if (!addon) return { ok: false, error: UNAVAILABLE };
      items.push({
        course_slug: course.slug,
        pricing_option_id: addon.id,
        option_code: code,
        quantity: 1,
        unit_price_cents: addon.priceCents,
        title_snapshot: course.title,
        option_snapshot: addon.label,
      });
    }
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
