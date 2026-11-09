/**
 * Admin "Access Level": which admin may open which part of the panel.
 *
 * A Super Admin sees everything and is the only one who manages admins. Every
 * other admin has, per section below, no access, "view" (lists, details,
 * downloads) or "edit" (view + create, change, delete, sync). The grants are
 * stored as JSON in admin_users.permissions and checked on the server for
 * every admin page and action — the sidebar only mirrors them.
 */

export type AccessLevel = "view" | "edit";

export const ADMIN_SECTIONS = [
  { key: "dashboard", label: "Dashboard", group: "Home", viewOnly: true },
  { key: "courses", label: "Courses", group: "Content" },
  { key: "banners", label: "Banner", group: "Content" },
  { key: "categories", label: "Category", group: "Content" },
  { key: "subcategories", label: "SubCategory", group: "Content" },
  { key: "industries", label: "Industries", group: "Content" },
  { key: "brands", label: "Brands", group: "Content" },
  { key: "about", label: "About", group: "Content" },
  { key: "testimonials", label: "Testimonial", group: "Content" },
  { key: "orders", label: "Completed Orders", group: "Orders" },
  { key: "order_sheet", label: "Order Sheet", group: "Orders" },
  { key: "failed_orders", label: "Failed Orders", group: "Orders" },
  { key: "abandoned", label: "Abandoned Analysis", group: "Orders" },
  { key: "coupons", label: "Coupons", group: "Orders" },
  { key: "users", label: "Register User", group: "Users & CRM" },
  { key: "enquiries", label: "Contact Queries", group: "Users & CRM" },
  { key: "subscribers", label: "Subscribers", group: "Users & CRM" },
  { key: "activity_logs", label: "Activity Logs", group: "Admin", viewOnly: true },
] as const satisfies readonly {
  key: string;
  label: string;
  group: string;
  viewOnly?: boolean;
}[];

export type AdminSection = (typeof ADMIN_SECTIONS)[number]["key"];

export type Permissions = Partial<Record<AdminSection, AccessLevel>>;

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  isSuper: boolean;
  /** Free-text job title, e.g. "Sales" (shown in the top bar). */
  role: string | null;
  permissions: Permissions;
};

const SECTION_KEYS = new Set<string>(ADMIN_SECTIONS.map((s) => s.key));
const VIEW_ONLY = new Set<string>(
  ADMIN_SECTIONS.filter((s) => "viewOnly" in s && s.viewOnly).map((s) => s.key),
);

export function isAdminSection(key: string): key is AdminSection {
  return SECTION_KEYS.has(key);
}

/** Keeps only known sections and levels (view-only sections can't be "edit"). */
export function cleanPermissions(input: unknown): Permissions {
  const out: Permissions = {};
  if (!input || typeof input !== "object") return out;
  for (const [key, level] of Object.entries(input as Record<string, unknown>)) {
    if (!isAdminSection(key)) continue;
    if (level === "view" || (level === "edit" && !VIEW_ONLY.has(key))) {
      out[key] = level;
    }
  }
  return out;
}

/** May this admin open the section at this level? */
export function can(
  admin: Pick<AdminUser, "isSuper" | "permissions">,
  section: AdminSection,
  level: AccessLevel = "view",
): boolean {
  if (admin.isSuper) return true;
  const granted = admin.permissions[section];
  return granted === "edit" || (granted === "view" && level === "view");
}
