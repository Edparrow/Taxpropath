export type WebinarKind = "upcoming" | "pre_recorded";

export type PricingOption = {
  id: string;
  label: string;
  description: string | null;
  priceCents: number;
};

export type Webinar = {
  slug: string;
  title: string;
  kind: WebinarKind;
  presenter: string;
  eventAt: string;
  durationMins: number;
  productCode: string | null;
  description: string[];
  learningObjectives: string[];
  topicsCovered: string[];
  whoShouldAttend: string[];
  cpeCredit: number | null;
  fieldOfStudy: string | null;
  prerequisites: string;
  learningLevel: string | null;
  deliveryMethod: string;
  industry: string;
  isFeatured: boolean;
  pricingOptions: PricingOption[];
};

export type CartLine = {
  webinarSlug: string;
  title: string;
  optionId: string;
  optionLabel: string;
  unitPriceCents: number;
  quantity: number;
};
