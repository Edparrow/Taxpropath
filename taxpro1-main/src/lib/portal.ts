/**
 * The customer portal (CRM-hosted). Courses play there, not on this site.
 * NEXT_PUBLIC_ so client components (header, paid-state dialog) can link to it.
 */
export const PORTAL_URL =
  process.env.NEXT_PUBLIC_PORTAL_URL ?? "https://portal.taxpropath.com";
