import Link from "next/link";
import { ArrowUpRight, Clock3 } from "lucide-react";
import { COURSE_CODES, type Course } from "@/lib/types";
import { initials, topicFor } from "@/lib/course-topic";
import { formatPrice } from "@/lib/utils";

/**
 * Self-study course card. No photo needed: the cover is drawn from the course
 * itself — its topic sets the colours and icon, and the CPE credit is the
 * headline. Body: title, speaker and the base price.
 */
export function CourseCard({ course }: { course: Course }) {
  const base =
    course.pricingOptions.find((o) => o.code === COURSE_CODES.base) ??
    course.pricingOptions[0];
  const href = `/courses/${course.slug}`;
  const topic = topicFor(course);
  const Icon = topic.icon;
  const credit = course.cpeCredit ? Number(course.cpeCredit) : null;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl hover:shadow-navy-950/[0.08]">
      {/* ------------------------------------------------ generated cover */}
      <Link
        href={href}
        aria-label={`View ${course.title}`}
        className={`relative isolate flex aspect-[16/9] flex-col justify-between overflow-hidden p-5 text-white ${topic.cover}`}
      >
        {/* Fine grid + soft light, for depth. */}
        <span
          aria-hidden
          className="absolute inset-0 -z-10 opacity-[0.14] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:28px_28px] [mask-image:linear-gradient(to_bottom_left,black,transparent_75%)]"
        />
        <span
          aria-hidden
          className="absolute -left-16 -top-20 -z-10 size-56 rounded-full bg-white/15 blur-3xl"
        />
        {/* Large topic icon as a watermark. */}
        <Icon
          aria-hidden
          strokeWidth={1.25}
          className="absolute -bottom-8 -right-6 -z-10 size-44 rotate-[-10deg] text-white/[0.13] transition-transform duration-500 group-hover:rotate-0 group-hover:scale-105"
        />

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-700">
            Self-Study
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider ring-1 ring-white/25 backdrop-blur-sm">
            <Icon className="size-3.5" aria-hidden />
            {topic.label}
          </span>
        </div>

        <div className="flex items-end justify-between gap-4">
          {credit ? (
            <div>
              <p className="text-5xl font-black leading-none tabular-nums tracking-tight">
                {credit.toFixed(1)}
              </p>
              <p className="mt-1.5 text-[11.5px] font-bold uppercase tracking-[0.18em] text-white/80">
                CPE Credit{credit === 1 ? "" : "s"}
                {course.fieldOfStudy ? ` · ${course.fieldOfStudy}` : ""}
              </p>
            </div>
          ) : (
            <div>
              <p className="flex items-center gap-2 text-3xl font-black leading-none tracking-tight">
                <Clock3 className="size-7" aria-hidden />
                Self-paced
              </p>
              <p className="mt-2 text-[11.5px] font-bold uppercase tracking-[0.18em] text-white/80">
                Learn anytime, anywhere
              </p>
            </div>
          )}
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-navy-950 shadow-lg transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:rotate-45"
          >
            <ArrowUpRight className="size-5" />
          </span>
        </div>
      </Link>

      {/* ------------------------------------------------------- body */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-[17px] font-bold leading-snug text-navy-950">
          <Link
            href={href}
            className="transition-colors duration-200 hover:text-brand-700"
          >
            {course.title}
          </Link>
        </h3>

        {course.presenter && (
          <p className="mt-4 flex items-center gap-2.5 text-sm text-ink-muted">
            <span
              aria-hidden
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11.5px] font-extrabold text-brand-700 ring-1 ring-brand-200"
            >
              {initials(course.presenter)}
            </span>
            <span>
              <span className="sr-only">Speaker: </span>
              <span className="font-semibold text-navy-950">
                {course.presenter}
              </span>
            </span>
          </p>
        )}

        <div className="mt-auto pt-5">
          <div className="flex items-end justify-between border-t border-slate-100 pt-4">
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
      </div>
    </article>
  );
}
