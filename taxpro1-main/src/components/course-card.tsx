import Image from "next/image";
import Link from "next/link";
import { Award, Plus, UserRound } from "lucide-react";
import { COURSE_CODES, type Course } from "@/lib/types";
import { coverFor } from "@/lib/covers";
import { formatPrice } from "@/lib/utils";

/**
 * Self-study course card (3 Nov 2026 brief): title, speaker, IRS/CPE credit
 * and the base price.
 */
export function CourseCard({
  course,
  position,
}: {
  course: Course;
  /** Index in the surrounding grid, so cover art spreads evenly down a listing. */
  position?: number;
}) {
  const base =
    course.pricingOptions.find((o) => o.code === COURSE_CODES.base) ??
    course.pricingOptions[0];
  const href = `/courses/${course.slug}`;
  const cover = coverFor(course.slug, position);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl hover:shadow-navy-950/[0.06]">
      <div className="relative aspect-[16/10] overflow-hidden bg-brand-gradient">
        {cover ? (
          <>
            <Image
              src={cover}
              alt=""
              fill
              sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(160deg,rgba(2,6,23,0.26)_0%,transparent_35%,transparent_65%,rgba(2,6,23,0.26)_100%)]"
            />
          </>
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white_0,transparent_45%),radial-gradient(circle_at_80%_70%,white_0,transparent_40%)]"
          />
        )}
        <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-700">
          Self-Study
        </span>
        <Link
          href={href}
          aria-label={`View ${course.title}`}
          className="absolute bottom-4 right-4 flex size-9 items-center justify-center rounded-full bg-white text-brand-700 shadow-md transition-transform duration-200 group-hover:scale-110"
        >
          <Plus className="size-5" aria-hidden />
        </Link>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-[17px] font-bold leading-snug text-navy-950">
          <Link href={href} className="transition-colors duration-200 hover:text-brand-700">
            {course.title}
          </Link>
        </h3>

        <dl className="mt-4 space-y-2 text-sm text-ink-muted">
          <div className="flex items-center gap-2">
            <UserRound className="size-4 shrink-0 text-brand-600" aria-hidden />
            <dt className="sr-only">Speaker</dt>
            <dd className="font-medium">{course.presenter}</dd>
          </div>
          {course.cpeCredit ? (
            <div className="flex items-center gap-2">
              <Award className="size-4 shrink-0 text-brand-600" aria-hidden />
              <dt className="sr-only">Credit</dt>
              <dd>
                {course.cpeCredit} IRS CE Credit{course.cpeCredit === 1 ? "" : "s"}
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4">
          {base && (
            <p className="text-2xl font-extrabold tabular-nums text-navy-950">
              {formatPrice(base.priceCents)}
            </p>
          )}
          <Link
            href={href}
            className="rounded-full bg-navy-950 px-5 py-2.5 text-sm font-bold text-white transition-colors duration-200 hover:bg-brand-600"
          >
            Buy Now
          </Link>
        </div>
      </div>
    </article>
  );
}
