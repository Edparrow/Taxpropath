import "server-only";
import { createClient } from "@/lib/supabase/server";

export type CourseOption = {
  id: string;
  title: string;
  prices: { code: string; label: string; cents: number }[];
};

/** Every course with its prices, for the manual order and order edit forms. */
export async function loadCourseOptions(): Promise<CourseOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select("id, title, pricing_options ( code, label, price_cents, sort_order )")
    .order("title");

  return (data ?? []).map((c) => ({
    id: c.id,
    title: c.title,
    prices: [...(c.pricing_options as { code: string; label: string; price_cents: number; sort_order: number }[])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((p) => ({ code: p.code, label: p.label, cents: p.price_cents })),
  }));
}
