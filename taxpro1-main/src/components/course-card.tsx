import Link from "next/link";
import { Award } from "lucide-react";
import { CourseCardActions } from "@/components/course-card-actions";
import { COURSE_CODES, type Course } from "@/lib/types";
import { topicFor } from "@/lib/course-topic";
import { formatPrice } from "@/lib/utils";

/**
 * Self-study course card, kept deliberately quiet: a clean cover (topic
 * colour + one icon, or the speaker's photo), the title, the speaker, and the
 * price with Add to Cart and Buy Now (both open the add-on pop-up).
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
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-navy-950/[0.07]">
      {/* ------------------------------------------------------- cover */}
      <div
        className={`relative isolate flex h-44 items-center justify-center overflow-hidden ${
          course.presenterAvatar ? "bg-slate-100" : topic.cover
        }`}
      >
        {course.presenterAvatar ? (
          // Admin-uploaded URLs can be any host, so a plain <img>.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.presenterAvatar}
            alt=""
            className="absolute inset-0 -z-10 size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <>
            <span
              aria-hidden
              className="absolute -right-10 -top-16 -z-10 size-48 rounded-full bg-white/10 blur-2xl"
            />
            <span className="flex size-16 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
              <Icon className="size-8" strokeWidth={1.5} aria-hidden />
            </span>
          </>
        )}

        {credit && (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11.5px] font-semibold text-navy-950 shadow-sm">
            <Award className="size-3.5 text-amber-500" aria-hidden />
            {credit.toFixed(1)} CPE
          </span>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-navy-950/30 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
          {topic.label}
        </span>
      </div>

      {/* -------------------------------------------------------- body */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-[16px] font-semibold leading-snug text-navy-950">
          {/* The whole card is clickable through this link's overlay. */}
          <Link
            href={href}
            title={course.title}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {course.title}
          </Link>
        </h3>
        {course.presenter && (
          <p className="mt-2 truncate text-[13.5px] text-slate-500">
            <span className="sr-only">Speaker: </span>
            {course.presenter}
          </p>
        )}

        <div className="mt-auto pt-5">
          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            {base && (
              <p className="text-lg font-bold tabular-nums text-navy-950">
                {formatPrice(base.priceCents)}
              </p>
            )}
            <CourseCardActions course={course} />
          </div>
        </div>
      </div>
    </article>
  );
}
