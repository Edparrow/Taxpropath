export type PricingOption = {
  id: string;
  label: string;
  description: string | null;
  priceCents: number;
  /** SELF_STUDY (the course itself) | ETRANSCRIPT | SLIDES (optional add-ons). */
  code: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type Course = {
  id: string;
  slug: string;
  title: string;
  presenter: string;
  /** Speaker photo from Admin > Speakers, when one is set. */
  presenterAvatar?: string | null;
  description: string[];
  learningObjectives: string[];
  topicsCovered: string[];
  whoShouldAttend: string[];
  cpeCredit: number | null;
  fieldOfStudy: string | null;
  prerequisites: string;
  learningLevel: string | null;
  isFeatured: boolean;
  pricingOptions: PricingOption[];
  seoTitle: string | null;
  seoDescription: string | null;
  faq: FaqItem[];
  engineDeliveryId: string | null;
  engineProgramId: string | null;
};

export type CartAddon = {
  code: string; // ETRANSCRIPT | SLIDES
  label: string;
  priceCents: number;
};

/** One course in the cart. A course can only be in the cart once. */
export type CartLine = {
  courseSlug: string;
  title: string;
  /** The SELF_STUDY price, before add-ons. */
  basePriceCents: number;
  addons: CartAddon[];
};

/** Course price including the add-ons chosen for it. */
export function cartLineTotalCents(line: CartLine): number {
  return line.basePriceCents + line.addons.reduce((sum, a) => sum + a.priceCents, 0);
}

/** Pricing option codes for self-study courses. */
export const COURSE_CODES = {
  base: "SELF_STUDY",
  addons: ["ETRANSCRIPT", "SLIDES"],
} as const;
