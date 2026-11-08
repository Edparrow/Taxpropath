import "server-only";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ErrorType } from "./types";

export type ErrorEvent = {
  type: ErrorType;
  message: string;
  /** True when the visitor saw an error page or message. */
  seen?: boolean;
  /** Reference shown to the visitor, so a support request can be matched. */
  ref?: string | null;
  url?: string | null;
  method?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  details?: Record<string, unknown>;
};

const KEEP_DAYS = 30;
const cut = (value: string | null | undefined, max: number) =>
  value ? String(value).slice(0, max) : null;

/**
 * Records one Error Monitor entry (Admin > Error Monitor). Never throws and
 * never blocks on failure: logging an error must not cause another one.
 */
export async function logError(event: ErrorEvent): Promise<void> {
  // Always keep a copy in the server log too.
  console.error(`[error-monitor] ${event.type}: ${event.message}`, event.details ?? "");
  if (!isSupabaseConfigured() || !hasServiceRoleKey()) return;

  try {
    const db = createAdminClient();
    const { error } = await db.from("error_events").insert({
      type: event.type,
      message: cut(event.message, 2000) ?? "(no message)",
      seen: event.seen ?? false,
      ref: cut(event.ref, 64),
      url: cut(event.url, 1000),
      method: cut(event.method, 10),
      user_id: event.userId ?? null,
      user_email: cut(event.userEmail?.toLowerCase(), 320),
      ip: cut(event.ip, 64),
      user_agent: cut(event.userAgent, 400),
      details: event.details ?? {},
    });
    if (error) console.error("[error-monitor] insert failed", error.message);

    // Now and then, drop entries older than the retention window.
    if (Math.random() < 0.01) {
      const cutoff = new Date(Date.now() - KEEP_DAYS * 86_400_000).toISOString();
      await db.from("error_events").delete().lt("created_at", cutoff);
    }
  } catch (err) {
    console.error("[error-monitor] logging failed", err);
  }
}

/** Shorthand for a failed Supabase query inside a page or loader. */
export function reportDbError(where: string, error: { message: string; code?: string }) {
  void logError({
    type: "db_error",
    message: `${where}: ${error.message}`,
    details: { where, code: error.code ?? null },
  });
}

/** Client IP from the proxy headers (nginx / Cloudflare set these). */
export function clientIp(headers: Headers | Record<string, string | string[] | undefined>): string | null {
  const get = (name: string) => {
    if (headers instanceof Headers) return headers.get(name);
    const value = headers[name];
    return Array.isArray(value) ? value[0] : value ?? null;
  };
  const forwarded = get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || get("x-real-ip") || get("cf-connecting-ip") || null;
}

/**
 * Who was signed in, read from the Supabase session cookie without a network
 * call. Unverified — good enough to label an error entry, never for access.
 */
export function userFromCookieHeader(cookieHeader: string | null | undefined): {
  id: string | null;
  email: string | null;
} {
  const none = { id: null, email: null };
  if (!cookieHeader) return none;
  try {
    const parts = new Map<string, string>();
    for (const pair of cookieHeader.split(/;\s*/)) {
      const i = pair.indexOf("=");
      if (i > 0) parts.set(pair.slice(0, i), decodeURIComponent(pair.slice(i + 1)));
    }
    // sb-<project>-auth-token, possibly split into .0, .1, … chunks.
    const name = [...parts.keys()].find((k) => /^sb-.+-auth-token(\.0)?$/.test(k));
    if (!name) return none;
    const base = name.replace(/\.0$/, "");
    let raw = parts.get(base) ?? "";
    if (!raw) {
      for (let i = 0; parts.has(`${base}.${i}`); i++) raw += parts.get(`${base}.${i}`);
    }
    if (raw.startsWith("base64-")) raw = Buffer.from(raw.slice(7), "base64url").toString("utf8");
    const session = JSON.parse(raw) as { user?: { id?: string; email?: string } };
    return { id: session.user?.id ?? null, email: session.user?.email ?? null };
  } catch {
    return none;
  }
}
