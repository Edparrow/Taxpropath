import type { Instrumentation } from "next";

/**
 * Sends every server-side crash (page render, server action, API route, proxy)
 * to the Error Monitor. The digest is the reference Next.js shows on the error
 * page, so a visitor's screenshot can be matched to the entry.
 */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // "Not found" and redirects are thrown internally on purpose; they aren't errors.
  const digest =
    typeof err === "object" && err !== null && "digest" in err ? String(err.digest) : undefined;
  if (digest && /^(NEXT_NOT_FOUND|NEXT_REDIRECT|NEXT_HTTP_ERROR_FALLBACK)/.test(digest)) return;

  const { logError, clientIp, userFromCookieHeader } = await import("@/lib/errors/log");
  const headers = request.headers;
  const header = (name: string) => {
    const value = headers[name];
    return Array.isArray(value) ? value.join("; ") : value;
  };
  const user = userFromCookieHeader(header("cookie"));
  const message = err instanceof Error ? err.message : String(err);

  await logError({
    type:
      context.routeType === "action" ? "action" : context.routeType === "route" ? "route" : "server",
    message,
    // A crashed page or action shows the visitor an error; a failed API call shows up in the page.
    seen: context.routeType === "render" || context.routeType === "action",
    ref: digest ?? null,
    url: request.path,
    method: request.method,
    userId: user.id,
    userEmail: user.email,
    ip: clientIp(headers),
    userAgent: header("user-agent") ?? null,
    details: {
      route: context.routePath,
      routeType: context.routeType,
      renderSource: "renderSource" in context ? context.renderSource : undefined,
      stack: err instanceof Error ? err.stack?.slice(0, 1500) : undefined,
    },
  });
};
