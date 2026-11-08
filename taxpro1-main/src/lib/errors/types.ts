/** Error Monitor vocabulary, shared by the loggers and the admin page. */

export const ERROR_TYPES = [
  "server",
  "action",
  "route",
  "db_error",
  "email",
  "client_crash",
  "js",
  "js_resource",
  "js_ajax",
  "not_found",
] as const;

export type ErrorType = (typeof ERROR_TYPES)[number];

export const ERROR_LABELS: Record<ErrorType, string> = {
  server: "Server error page",
  action: "Form / button action failed",
  route: "API request crashed",
  db_error: "Database error",
  email: "Email could not be sent",
  client_crash: "Page crashed in the browser",
  js: "Browser: script error",
  js_resource: "Browser: file failed to load",
  js_ajax: "Browser: request failed",
  not_found: "Page not found (404)",
};

/** Kinds the browser is allowed to report through /api/track-error. */
export const BROWSER_TYPES = ["js", "js_resource", "js_ajax", "not_found", "client_crash"] as const;
export type BrowserErrorType = (typeof BROWSER_TYPES)[number];

export const isErrorType = (value: string): value is ErrorType =>
  (ERROR_TYPES as readonly string[]).includes(value);
