import Link from "next/link";
import { Award, Clock3, PlayCircle, UserRound } from "lucide-react";
import { COURSE_CODES, type Course } from "@/lib/types";
import { topicFor } from "@/lib/course-topic";
import { formatPrice } from "@/lib/utils";

/**
 * Self-study course card, laid out like a service card: picture on the left,
 * details on the right, price and "Buy Now" at the bottom.
 * The picture is the speaker's photo when Admin > Speakers has one; otherwise
 * a cover drawn from the course's topic, so no photo is ever required.
 */
export function CourseCard({ course }: { course: Course }) {
  const base =
    course.pricingOptions.find((o) => o.code === COURSE_CODES.base) ??
    course.pricingOptions[0];
  const href = `/courses/${course.slug}`;
  const topic = topicFor(course);
  const Icon = topic.icon;
  const credit = course.cpeCredit ? Number(course.cpeCredit) : null;
  const subtitle = [topic.label, course.fieldOfStudy]
    .filter((v, i, all) => v && all.indexOf(v) === i)
    .join(" · ");

  return (
    <article className="group flex gap-4 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-navy-950/[0.08]">
      {/* ------------------------------------------------------- picture */}
      <Link
        href={href}
        aria-label={`View ${course.title}`}
        className={`relative isolate flex min-h-48 w-[38%] max-w-40 shrink-0 items-center justify-center overflow-hidden rounded-2xl ${
          course.presenterAvatar ? "bg-slate-100" : topic.cover
        }`}
      >
        {credit && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-lg bg-white/95 px-1.5 py-1 text-[11px] font-bold text-navy-950 shadow-sm">
            <Award className="size-3.5 text-amber-500" aria-hidden />
            {credit.toFixed(1)} CPE
          </span>
        )}
        {course.presenterAvatar ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={course.presenterAvatar}
              alt={course.presenter}
              className="absolute inset-0 -z-10 size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <span className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-lg bg-white/90 text-navy-950 shadow-sm">
              <Icon className="size-4" aria-hidden />
            </span>
          </>
        ) : (
          <>
            <span
              aria-hidden
              className="absolute inset-0 -z-10 opacity-[0.14] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:20px_20px]"
            />
            <Icon
              aria-hidden
              strokeWidth={1.25}
              className="absolute -bottom-6 -right-6 -z-10 size-28 rotate-[-10deg] text-white/[0.14] transition-transform duration-500 group-hover:rotate-0"
            />
            <span className="flex size-14 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/30 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
              <Icon className="size-7" aria-hidden />
            </span>
            <span className="absolute inset-x-2 bottom-2 rounded-lg bg-white/95 px-2 py-1 text-center text-[10px] font-bold uppercase tracking-wider text-brand-700">
              Self-Study
            </span>
          </>
        )}
      </Link>

      {/* -------------------------------------------------------- details */}
      <div className="flex min-w-0 flex-1 flex-col py-1 pr-1">
        <h3 className="line-clamp-3 text-[15.5px] font-bold leading-snug text-navy-950">
          <Link
            href={href}
            title={course.title}
            className="transition-colors duration-200 hover:text-brand-700"
          >
            {course.title}
          </Link>
        </h3>
        {subtitle && (
          <p className="mt-1 truncate text-[12.5px] text-slate-400">
            {subtitle}
          </p>
        )}

        <ul className="mt-2.5 space-y-1.5 text-[13px] text-ink-muted">
          {course.presenter && (
            <li className="flex items-center gap-2">
              <UserRound
                className="size-4 shrink-0 text-slate-400"
                aria-hidden
              />
              <span className="truncate">
                <span className="sr-only">Speaker: </span>
                {course.presenter}
              </span>
            </li>
          )}
          <li className="flex items-center gap-2">
            <PlayCircle
              className="size-4 shrink-0 text-slate-400"
              aria-hidden
            />
            On-demand video
          </li>
          {!credit && (
            <li className="flex items-center gap-2">
              <Clock3 className="size-4 shrink-0 text-slate-400" aria-hidden />
              Self-paced, learn anytime
            </li>
          )}
        </ul>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          {base && (
            <div>
              <p className="text-[11.5px] text-slate-400">Start from</p>
              <p className="text-xl font-extrabold leading-tight tabular-nums text-navy-950">
                {formatPrice(base.priceCents)}
              </p>
            </div>
          )}
          <Link
            href={href}
            className="shrink-0 rounded-xl bg-brand-gradient px-4 py-2.5 text-[13px] font-bold text-white shadow-md shadow-brand-600/20 transition-transform duration-200 hover:-translate-y-0.5"
          >
            Buy Now
          </Link>
        </div>
      </div>
    </article>
  );
}
