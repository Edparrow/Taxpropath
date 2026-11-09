import { reportDbError } from "@/lib/errors/log";
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Reads the admin-managed content tables from 0001_initial_schema.sql.
 *
 * Every getter returns [] rather than throwing when Supabase isn't configured or
 * the migration hasn't been applied — the public pages fall back to their
 * built-in copy, so a missing table can never blank the site. RLS already limits
 * anonymous reads to published rows; the explicit is_published filter keeps
 * behaviour identical when an admin is the one browsing.
 */

export type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_href: string | null;
};

export type Industry = {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
};

export type Testimonial = {
  id: string;
  author_name: string;
  author_role: string | null;
  quote: string;
  avatar_url: string | null;
  rating: number | null;
};

export type Brand = {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
};

export type AboutSection = {
  id: string;
  heading: string;
  body: string | null;
  image_url: string | null;
};

async function published<T>(table: string, columns: string): Promise<T[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from(table)
    .select(columns)
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    // Missing table is expected before the migration runs; log once and move on.
    reportDbError(`Loading ${table}`, error);
    return [];
  }
  return (data ?? []) as unknown as T[];
}

export function getBanners() {
  return published<Banner>(
    "banners",
    "id, title, subtitle, image_url, cta_label, cta_href",
  );
}

export function getIndustries() {
  return published<Industry>("industries", "id, name, icon, description");
}

export function getTestimonials() {
  return published<Testimonial>(
    "testimonials",
    "id, author_name, author_role, quote, avatar_url, rating",
  );
}

export function getBrands() {
  return published<Brand>("brands", "id, name, logo_url, website_url");
}

export function getAboutSections() {
  return published<AboutSection>("about_sections", "id, heading, body, image_url");
}

