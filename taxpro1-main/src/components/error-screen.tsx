"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { reportClientError } from "@/components/error-reporter";

/** A short reference for a crash that never reached the server. */
function browserRef() {
  return `C${Date.now().toString(36).toUpperCase()}`;
}

/**
 * What a visitor sees when a page crashes. Shows a reference so support can
 * find the exact entry in Admin > Error Monitor.
 *
 * A server crash already has a digest, logged by instrumentation.ts under the
 * same reference. A crash inside the browser has none, so one is made up here
 * and reported.
 */
export function ErrorScreen({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const ref = useMemo(() => error.digest ?? browserRef(), [error.digest]);

  useEffect(() => {
    if (!error.digest) {
      reportClientError("client_crash", error.message, { r: ref, st: error.stack?.slice(0, 1200) });
    }
  }, [error, ref]);

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <AlertTriangle className="size-7" aria-hidden />
        </span>
        <h1 className="mt-6 text-2xl font-extrabold text-navy-950">Something went wrong on our side</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
          We&rsquo;ve been notified. Please try again in a moment. If it keeps happening,{" "}
          <Link href="/contact" className="font-bold text-brand-700 hover:underline">
            contact us
          </Link>{" "}
          and quote this reference:
        </p>
        <p className="mt-4 inline-block rounded-xl bg-cream px-4 py-2 font-mono text-[14px] font-bold text-navy-950">
          {ref}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-brand-gradient px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-600/25"
          >
            <RotateCcw className="size-4" aria-hidden />
            Try again
          </button>
          <Link
            href="/"
            className="rounded-full border-2 border-slate-300 px-6 py-3 text-sm font-bold text-navy-950 hover:border-brand-600 hover:text-brand-700"
          >
            Go to the homepage
          </Link>
        </div>
      </div>
    </section>
  );
}
