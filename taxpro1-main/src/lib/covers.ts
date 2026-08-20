/**
 * Card cover art. Files live in public/webinars/ and are listed here rather than
 * discovered on disk: the dev server is launched with `--prefix`, so its cwd is
 * not the app root and a readdir probe would silently find nothing.
 *
 * To swap in new artwork, either overwrite the file keeping its name, or add the
 * new filename below. Anything listed must exist, or the card renders a broken
 * image instead of falling back to the gradient.
 */

/** Per-webinar art, keyed by slug. Takes precedence over the rotation. */
const BY_SLUG: Record<string, string> = {};

/** Generic covers, assigned in a stable rotation across the catalog. */
const GENERIC = [
  "/webinars/cover-1.svg",
  "/webinars/cover-2.svg",
  "/webinars/cover-3.svg",
];

/** Stable non-negative hash so a slug always lands on the same generic cover. */
function hash(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * `position` is the card's index in its grid. Passing it spreads the generic
 * covers evenly down a listing; without it the slug hash keeps the choice
 * stable but can repeat one cover within a single row.
 */
export function coverFor(slug: string, position?: number): string | null {
  const exact = BY_SLUG[slug];
  if (exact) return exact;
  if (!GENERIC.length) return null;

  const key = position ?? hash(slug);
  return GENERIC[key % GENERIC.length];
}
