import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, UserRound } from "lucide-react";
import { getCourse, getCourses } from "@/lib/data/catalog";
import { CourseCard } from "@/components/course-card";
import { BuyBox } from "@/components/buy-box";
import { SectionHeading } from "@/components/ui";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) return { title: "Course not found" };
  return {
    title: course.seoTitle || course.title,
    description: course.seoDescription || course.description[0]?.slice(0, 160),
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();

  const related = (await getCourses()).filter((c) => c.slug !== slug).slice(0, 3);
  const credits = [
    course.cpeCredit && { label: "IRS CE credit", value: `${course.cpeCredit}` },
    course.fieldOfStudy && { label: "Field of study", value: course.fieldOfStudy },
    { label: "Prerequisites", value: course.prerequisites },
    course.learningLevel && { label: "Learning level", value: course.learningLevel },
    { label: "Delivery method", value: "QAS Self-Study" },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <>
      {/* ------------------------------------------------------------- banner */}
      <section className="border-b border-cream-dark bg-cream">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap gap-2 text-sm">
            <Link
              href="/"
              className="font-medium text-ink-muted transition-colors duration-200 hover:text-brand-700"
            >
              Home
            </Link>
            <span className="text-slate-400">/</span>
            <Link
              href="/courses"
              className="font-medium text-ink-muted transition-colors duration-200 hover:text-brand-700"
            >
              Self-Study Courses
            </Link>
          </nav>

          <h1 className="max-w-4xl text-3xl font-extrabold leading-tight tracking-tight text-navy-950 sm:text-4xl lg:text-[2.75rem]">
            {course.title}
          </h1>

          <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
            <Meta icon={UserRound} label="Speaker" value={course.presenter} />
            {course.cpeCredit && (
              <Meta
                icon={Award}
                label="IRS CE credit"
                value={`${course.cpeCredit} ${course.fieldOfStudy ?? ""}`.trim()}
              />
            )}
          </dl>
        </div>
      </section>

      {/* -------------------------------------------------------------- body */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_400px] lg:px-8">
          <div>
            {course.description.map((paragraph, i) => (
              <p key={i} className="mb-5 text-[16.5px] leading-[1.8] text-ink-muted">
                {paragraph}
              </p>
            ))}

            {course.learningObjectives.length > 0 && (
              <BulletSection
                title="Learning Objectives"
                items={course.learningObjectives}
              />
            )}
            {course.topicsCovered.length > 0 && (
              <BulletSection title="Topics Covered" items={course.topicsCovered} />
            )}
            {course.whoShouldAttend.length > 0 && (
              <BulletSection
                title="Who Should Attend"
                items={course.whoShouldAttend}
              />
            )}

            <h2 className="mb-5 mt-12 text-2xl font-extrabold text-navy-950">
              Credits and Other Information
            </h2>
            <dl className="grid gap-x-8 gap-y-4 rounded-2xl bg-cream p-6 sm:grid-cols-2">
              {credits.map((c) => (
                <div key={c.label} className="flex flex-col">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {c.label}
                  </dt>
                  <dd className="mt-1 text-[15px] font-semibold text-navy-950">
                    {c.value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-[15px] text-ink-muted">
              Watch on your schedule in your portal — access never expires.
            </p>

            {course.faq && course.faq.length > 0 && (
              <>
                <h2 className="mb-5 mt-12 text-2xl font-extrabold text-navy-950">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-3">
                  {course.faq.map((item, i) => (
                    <details
                      key={i}
                      className="group rounded-2xl border border-slate-200 px-5 py-4 open:bg-cream"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15.5px] font-bold text-navy-950">
                        {item.question}
                        <span className="shrink-0 text-brand-600 transition-transform duration-200 group-open:rotate-45">
                          +
                        </span>
                      </summary>
                      <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
                        {item.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </>
            )}
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <BuyBox course={course} />
          </aside>
        </div>
      </section>

      {/* ----------------------------------------------------------- related */}
      {related.length > 0 && (
        <section className="border-t border-slate-200 bg-cream">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <SectionHeading lead="You may also" accent="be interested in" />
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item, i) => (
                <CourseCard key={item.slug} course={item} position={i} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="size-5 shrink-0 text-brand-600" aria-hidden />
      <div>
        <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {label}
        </dt>
        <dd className="text-[15px] font-semibold text-navy-950">{value}</dd>
      </div>
    </div>
  );
}

function BulletSection({ title, items }: { title: string; items: string[] }) {
  return (
    <>
      <h2 className="mb-5 mt-12 text-2xl font-extrabold text-navy-950">{title}</h2>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span
              aria-hidden
              className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-500"
            />
            <span className="text-[16px] leading-[1.7] text-ink-muted">{item}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
