import { COURSE_CODES } from "@/lib/types";

/**
 * The three things a course sells, in display order: the course itself plus
 * two optional add-ons. Shared by the course form and the Change Price page so
 * a price row always gets the same label and description.
 */
export const PRICE_CODES = [COURSE_CODES.base, ...COURSE_CODES.addons] as const;
export type PriceCode = (typeof PRICE_CODES)[number];

export const PRICE_LABELS: Record<PriceCode, { label: string; description: string; sort: number }> = {
  SELF_STUDY: {
    label: "Self-Study",
    description: "Watch the full course on demand in your portal.",
    sort: 0,
  },
  ETRANSCRIPT: {
    label: "e-Transcript",
    description: "A complete written transcript of the course.",
    sort: 1,
  },
  SLIDES: {
    label: "Slides & Material",
    description: "Downloadable presentation slides and course material.",
    sort: 2,
  },
};

/** Dollars as typed → cents; null when blank, NaN when not a valid price. */
export function priceCents(value: unknown): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 && n <= 100000 ? Math.round(n * 100) : NaN;
}
