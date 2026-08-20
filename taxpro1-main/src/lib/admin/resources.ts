/**
 * Declarative definitions for the admin's content sections.
 *
 * The seven content tables from 0006_site_content.sql are structurally the same
 * (sort_order / is_published / created_at + a handful of scalar fields), so one
 * generic list + form + action set drives all of them from this config. Adding a
 * section means adding an entry here and a table in a migration — no new pages.
 *
 * Webinars and orders are deliberately NOT here: they have bespoke screens
 * (pricing rows, video upload, payment reconciliation) that a generic form
 * can't express.
 */

import { INDUSTRY_ICON_NAMES } from "@/components/industry-icon";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "url"
  | "select"
  | "reference";

export type ResourceField = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  hint?: string;
  /** For type "select": the allowed values. */
  options?: readonly string[];
  /** For type "reference": the table to offer options from. */
  refTable?: string;
  /** For type "reference": the column shown in the dropdown. */
  refLabelColumn?: string;
};

export type Resource = {
  /** URL segment under /admin/content/. */
  slug: string;
  table: string;
  label: string;
  plural: string;
  description: string;
  fields: ResourceField[];
  /** Field names shown as columns in the list view. */
  listColumns: string[];
};

/** Shared by every content table, appended to each resource's own fields. */
const COMMON_FIELDS: ResourceField[] = [
  {
    name: "sort_order",
    label: "Sort order",
    type: "number",
    hint: "Lower numbers appear first.",
  },
  {
    name: "is_published",
    label: "Published",
    type: "boolean",
    hint: "Unpublished rows are hidden from the public site.",
  },
];

function resource(r: Omit<Resource, "fields"> & { fields: ResourceField[] }): Resource {
  return { ...r, fields: [...r.fields, ...COMMON_FIELDS] };
}

export const RESOURCES: Resource[] = [
  resource({
    slug: "banners",
    table: "banners",
    label: "Banner",
    plural: "Banners",
    description: "Hero slides shown at the top of the homepage.",
    listColumns: ["title", "subtitle"],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "subtitle", label: "Subtitle", type: "textarea" },
      { name: "image_url", label: "Image URL", type: "url" },
      { name: "cta_label", label: "Button label", type: "text" },
      {
        name: "cta_href",
        label: "Button link",
        type: "text",
        hint: "A path such as /webinar/upcoming.",
      },
    ],
  }),
  resource({
    slug: "categories",
    table: "categories",
    label: "Category",
    plural: "Categories",
    description: "Top-level product grouping, e.g. Webinar.",
    listColumns: ["name", "slug"],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      {
        name: "slug",
        label: "Slug",
        type: "text",
        hint: "Leave blank to generate from the name.",
      },
      { name: "description", label: "Description", type: "textarea" },
    ],
  }),
  resource({
    slug: "subcategories",
    table: "subcategories",
    label: "Subcategory",
    plural: "Subcategories",
    description: "Sits under a category, e.g. Upcoming Webinar.",
    listColumns: ["name", "slug"],
    fields: [
      {
        name: "category_id",
        label: "Category",
        type: "reference",
        refTable: "categories",
        refLabelColumn: "name",
      },
      { name: "name", label: "Name", type: "text", required: true },
      {
        name: "slug",
        label: "Slug",
        type: "text",
        hint: "Leave blank to generate from the name.",
      },
      { name: "description", label: "Description", type: "textarea" },
    ],
  }),
  resource({
    slug: "industries",
    table: "industries",
    label: "Industry",
    plural: "Industries",
    description: "The industry tiles on the homepage.",
    listColumns: ["name", "icon"],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      {
        name: "icon",
        label: "Icon",
        type: "select",
        // Constrained to what IndustryIcon can actually render, so a typo can't
        // silently fall back to the generic tile.
        options: INDUSTRY_ICON_NAMES,
        hint: "Shown in the homepage industry tile.",
      },
      { name: "description", label: "Description", type: "textarea" },
    ],
  }),
  resource({
    slug: "brands",
    table: "brands",
    label: "Brand",
    plural: "Brands",
    description: "Partner and accreditation logos.",
    listColumns: ["name", "website_url"],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "logo_url", label: "Logo URL", type: "url" },
      { name: "website_url", label: "Website", type: "url" },
    ],
  }),
  resource({
    slug: "testimonials",
    table: "testimonials",
    label: "Testimonial",
    plural: "Testimonials",
    description: "Quotes from attendees.",
    listColumns: ["author_name", "author_role"],
    fields: [
      { name: "author_name", label: "Author", type: "text", required: true },
      { name: "author_role", label: "Role / company", type: "text" },
      { name: "quote", label: "Quote", type: "textarea", required: true },
      { name: "avatar_url", label: "Avatar URL", type: "url" },
      { name: "rating", label: "Rating", type: "number", hint: "1 to 5." },
    ],
  }),
  resource({
    slug: "about",
    table: "about_sections",
    label: "About section",
    plural: "About",
    description: "Blocks of copy on the About Us page.",
    listColumns: ["heading"],
    fields: [
      { name: "heading", label: "Heading", type: "text", required: true },
      { name: "body", label: "Body", type: "textarea" },
      { name: "image_url", label: "Image URL", type: "url" },
    ],
  }),
];

export function findResource(slug: string): Resource | undefined {
  return RESOURCES.find((r) => r.slug === slug);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}
