import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { clientIp, logError } from "@/lib/errors/log";
import { BROWSER_TYPES, type BrowserErrorType } from "@/lib/errors/types";

/**
 * Browser error reports from <ErrorReporter /> (script errors, files that fail
 * to load, failed requests, 404s, crashed pages). Only accepts reports about
 * this site's own pages, at most a few per visitor per minute.
 */

const MAX_BODY = 6000;
const PER_MINUTE = 20;
const hits = new Map<string, { count: number; reset: number }>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.reset < now) {
    hits.set(key, { count: 1, reset: now + 60_000 });
    if (hits.size > 5000) hits.clear(); // keep memory bounded
    return false;
  }
  entry.count += 1;
  return entry.count > PER_MINUTE;
}

const str = (value: unknown, max: number) =>
  typeof value === "string" && value ? value.slice(0, max) : null;

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY) return new NextResponse(null, { status: 413 });

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw);
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const kind = String(data.k ?? "");
  const pageUrl = str(data.u, 1000);
  if (!(BROWSER_TYPES as readonly string[]).includes(kind) || !pageUrl) {
    return new NextResponse(null, { status: 400 });
  }

  // Only reports about pages of this site.
  const host = request.headers.get("host")?.toLowerCase();
  let pageHost: string | null = null;
  try {
    pageHost = new URL(pageUrl).host.toLowerCase();
  } catch {
    // fall through
  }
  if (!host || pageHost !== host) return new NextResponse(null, { status: 403 });

  const ip = clientIp(request.headers);
  if (rateLimited(ip ?? "unknown")) return new NextResponse(null, { status: 429 });

  let userId: string | null = null;
  let userEmail: string | null = null;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: claims } = await supabase.auth.getClaims();
    userId = claims?.claims.sub ?? null;
    userEmail = (claims?.claims.email as string | undefined) ?? null;
  }

  const url = new URL(pageUrl);
  await logError({
    type: kind as BrowserErrorType,
    message: str(data.m, 1000) ?? "(no message)",
    seen: kind === "client_crash",
    ref: str(data.r, 64),
    url: url.pathname + url.search,
    method: "GET",
    userId,
    userEmail,
    ip,
    userAgent: request.headers.get("user-agent"),
    details: {
      file: str(data.s, 300),
      line: typeof data.l === "number" ? data.l : undefined,
      stack: str(data.st, 1500),
      request: str(data.rq, 300),
      status: typeof data.st_code === "number" ? data.st_code : undefined,
      referrer: str(data.rf, 300),
    },
  });

  return new NextResponse(null, { status: 204 });
}
