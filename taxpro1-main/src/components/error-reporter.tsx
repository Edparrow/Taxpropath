"use client";

import { useEffect } from "react";
import type { BrowserErrorType } from "@/lib/errors/types";

/**
 * Error Monitor, browser side: reports script errors, images/files that fail
 * to load, and this site's /api requests that fail, to /api/track-error.
 * At most 5 reports per page view, so one broken page can't flood the log.
 */

const MAX_PER_PAGE = 5;
const ENDPOINT = "/api/track-error";
let sent = 0;

type Extra = { s?: string; l?: number; st?: string; rq?: string; st_code?: number; r?: string };

export function reportClientError(kind: BrowserErrorType, message: string, extra: Extra = {}) {
  if (typeof window === "undefined" || sent >= MAX_PER_PAGE) return;
  sent += 1;
  try {
    const body = JSON.stringify({
      k: kind,
      m: String(message || "").slice(0, 500),
      u: window.location.href,
      rf: document.referrer || undefined,
      ...extra,
    });
    const beacon = navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: "application/json" }));
    if (!beacon) {
      void fetch(ENDPOINT, { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } });
    }
  } catch {
    // Reporting must never break the page.
  }
}

/** Noise from browser extensions and harmless browser quirks. */
function ignored(message: string, source?: string) {
  return (
    /ResizeObserver loop|Script error\.?$|AbortError|NEXT_REDIRECT|NEXT_NOT_FOUND/i.test(message) ||
    /^(chrome|moz|safari|safari-web)-extension:/.test(source ?? "")
  );
}

let fetchPatched = false;

export function ErrorReporter() {
  useEffect(() => {
    function onError(event: Event) {
      // Files that fail to load fire a non-bubbling "error" on the element itself.
      const target = event.target as HTMLElement | null;
      if (target && target !== (window as unknown as HTMLElement) && "tagName" in target) {
        const src =
          (target as HTMLImageElement).currentSrc ||
          (target as HTMLImageElement).src ||
          (target as HTMLLinkElement).href ||
          "";
        if (src && !ignored("", src)) {
          reportClientError("js_resource", `${target.tagName.toLowerCase()} failed to load`, { s: src.slice(0, 300) });
        }
        return;
      }
      const e = event as ErrorEvent;
      if (ignored(e.message ?? "", e.filename)) return;
      reportClientError("js", e.message, {
        s: e.filename,
        l: e.lineno,
        st: e.error instanceof Error ? e.error.stack?.slice(0, 1200) : undefined,
      });
    }

    function onRejection(event: PromiseRejectionEvent) {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason);
      if (ignored(message)) return;
      reportClientError("js", `Unhandled promise rejection: ${message}`, {
        st: reason instanceof Error ? reason.stack?.slice(0, 1200) : undefined,
      });
    }

    window.addEventListener("error", onError, true);
    window.addEventListener("unhandledrejection", onRejection);

    // Requests to this site's own API that fail on the server or don't arrive.
    if (!fetchPatched) {
      fetchPatched = true;
      const original = window.fetch.bind(window);
      window.fetch = async (input, init) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        const ours = url.startsWith("/api/") || url.startsWith(`${window.location.origin}/api/`);
        const watched = ours && !url.includes(ENDPOINT);
        try {
          const res = await original(input, init);
          if (watched && res.status >= 500) {
            reportClientError("js_ajax", `HTTP ${res.status} from ${new URL(url, window.location.origin).pathname}`, {
              rq: url.slice(0, 300),
              st_code: res.status,
            });
          }
          return res;
        } catch (err) {
          if (watched && !(err instanceof DOMException && err.name === "AbortError")) {
            reportClientError("js_ajax", `Request failed: ${new URL(url, window.location.origin).pathname}`, {
              rq: url.slice(0, 300),
            });
          }
          throw err;
        }
      };
    }

    return () => {
      window.removeEventListener("error", onError, true);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
