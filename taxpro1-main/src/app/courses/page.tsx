import type { Metadata } from "next";
import { getCourses } from "@/lib/data/catalog";
import { CourseCard } from "@/components/course-card";
import { PageBanner } from "@/components/ui";

export const metadata: Metadata = {
  title: "Self-Study Courses",
  description:
    "Browse self-study CPE and IRS CE courses for accounting, tax, finance, and HR professionals. Learn at your own pace with optional e-Transcripts and slides.",
};

export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <>
      <PageBanner
        title="Self-Study Courses"
        crumb={[
          { href: "/", label: "Home" },
          { href: "/courses", label: "Courses" },
        ]}
      />

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          {courses.length === 0 ? (
            <div className="mx-auto max-w-md rounded-3xl border border-slate-200 px-8 py-16 text-center">
              <h2 className="text-xl font-extrabold text-navy-950">
                Courses are on their way
              </h2>
              <p className="mt-2 text-[15px] text-ink-muted">
                Our self-study catalog is being prepared. Check back soon.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-10 text-[15px] text-ink-muted">
                Showing <strong className="text-navy-950">{courses.length}</strong>{" "}
                self-study courses
              </p>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {courses.map((course) => (
                  <CourseCard key={course.slug} course={course} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
