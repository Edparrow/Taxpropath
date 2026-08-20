/**
 * Validates a `?next=` destination before redirecting to it.
 *
 * Only same-origin absolute paths are allowed. Without this, `?next=` on the
 * auth pages would be an open redirect: an attacker could send a Taxpropath
 * login link that bounces to their own site after sign-in.
 */
export function safeNextPath(value: string | null | undefined, fallback = "/"): string {
  if (!value) return fallback;
  // Reject protocol-relative ("//evil.com") and absolute ("https://evil.com") URLs.
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
