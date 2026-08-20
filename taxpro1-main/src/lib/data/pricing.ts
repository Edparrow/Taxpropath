import type { PricingOption } from "@/lib/types";

const LIVE = "Attend the webinar LIVE with real-time Q&A and instructor interaction.";
const TRANSCRIPT = "Get a complete written transcript of the webinar session.";
const ON_DEMAND = "Watch the webinar anytime at your convenience after the event.";
const DOWNLOAD = "Download the webinar video and watch it offline anytime.";

/**
 * Every webinar sells the same 11 delivery formats in the same order — only the
 * dollar amounts differ — so callers pass just the price list.
 */
const FORMATS = [
  { label: "LIVE", description: LIVE },
  { label: "e-TRANSCRIPT", description: TRANSCRIPT },
  { label: "On-Demand + e-TRANSCRIPT", description: `${ON_DEMAND} ${TRANSCRIPT}` },
  { label: "LIVE + Web Download", description: `${LIVE} ${DOWNLOAD}` },
  { label: "On-Demand", description: ON_DEMAND },
  { label: "LIVE + e-TRANSCRIPT", description: `${LIVE} ${TRANSCRIPT}` },
  { label: "Web Download + e-Transcript", description: `${DOWNLOAD} ${TRANSCRIPT}` },
  { label: "Unlimited Access", description: "Unlimited access to the full course library." },
  { label: "Web Download", description: DOWNLOAD },
  {
    label: "Live + On-Demand + e-TRANSCRIPT",
    description: `${LIVE} ${ON_DEMAND} ${TRANSCRIPT}`,
  },
  { label: "On-Demand + Web Download", description: `${ON_DEMAND} ${DOWNLOAD}` },
] as const;

export type PriceList = [
  number, number, number, number, number, number,
  number, number, number, number, number,
];

export function makePricing(slug: string, dollars: PriceList): PricingOption[] {
  return FORMATS.map((format, i) => ({
    id: `${slug}--${i}`,
    label: format.label,
    description: format.description,
    priceCents: Math.round(dollars[i] * 100),
  }));
}
