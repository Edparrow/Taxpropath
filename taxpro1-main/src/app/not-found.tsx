import Link from "next/link";
import { SearchX } from "lucide-react";
import { NotFoundReporter } from "@/components/not-found-reporter";

export const metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <section className="bg-white">
      <NotFoundReporter />
      <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <SearchX className="size-7" aria-hidden />
        </span>
        <h1 className="mt-6 text-2xl font-extrabold text-navy-950">We couldn&rsquo;t find that page</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
          The link may be old or mistyped. Try our courses, or head back home.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/courses"
            className="rounded-full bg-brand-gradient px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-600/25"
          >
            Browse Courses
          </Link>
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
