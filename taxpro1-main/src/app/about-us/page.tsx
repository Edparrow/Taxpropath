import type { Metadata } from "next";
import {
  BadgeCheck,
  CalendarCheck,
  GraduationCap,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { getAboutSections } from "@/lib/data/site-content";
import { Badge, PageBanner, PillLink, SectionHeading } from "@/components/ui";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Taxpropath brings together expert speakers and industry leaders to deliver engaging, practical, and up-to-date professional training.",
};

const OFFERINGS = [
  {
    icon: CalendarCheck,
    title: "Flexible Access",
    body: "Earn credits anytime via our mobile app and seamlessly integrated web platform.",
  },
  {
    icon: BadgeCheck,
    title: "Easy Credit Tracking",
    body: "Simplified, automated tracking and management of all your CPE/CE credits.",
  },
  {
    icon: GraduationCap,
    title: "Quality Learning",
    body: "Always up-to-date, high-quality learning resources curated by top industry experts.",
  },
  {
    icon: Target,
    title: "Professional Focus",
    body: "Intelligently designed to fit the unique needs of busy, modern professionals.",
  },
];

export default async function AboutPage() {
  const sections = await getAboutSections();
  return (
    <>
      <PageBanner
        title="About Us"
        crumb={[
          { href: "/", label: "Home" },
          { href: "/about-us", label: "About Us" },
        ]}
      />

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <Badge>
                <Sparkles className="size-3.5" aria-hidden />
                Core Values
              </Badge>
              <SectionHeading
                lead="Redefining Learning."
                accent="Empowering Careers."
                className="mt-6"
              />
              <p className="mt-6 text-[17px] leading-[1.75] text-ink-muted">
                At <strong className="font-bold text-navy-950">Taxpropath</strong>,
                whether you&rsquo;re an employer seeking efficient, customized training
                for your employees, a professional eager to upgrade your skills and move
                forward in your career, or someone pursuing CEUs or recertification,
                we&rsquo;re here to redefine professional development. We bring together
                some of the brightest minds in the industry to offer engaging,
                practical, and up-to-date online training modules that make learning
                effective and relevant.
              </p>
              <p className="mt-5 text-[17px] leading-[1.75] text-ink-muted">
                Taxpropath is poised to transform the learning experience. Our platform
                brings together expert speakers and industry leaders to share their
                insights and practical knowledge, ensuring training is not only engaging
                but also highly actionable.
              </p>
              <div className="mt-9">
                <PillLink href="/courses">Explore Our Courses</PillLink>
              </div>
            </div>

            <div className="rounded-3xl bg-cream p-8 sm:p-10">
              <h2 className="text-2xl font-extrabold text-navy-950">What We Offer</h2>
              <ul className="mt-8 space-y-6">
                {OFFERINGS.map(({ icon: Icon, title, body }) => (
                  <li key={title} className="flex gap-5">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-white">
                      <Icon className="size-6" aria-hidden />
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-navy-950">{title}</h3>
                      <p className="mt-1.5 text-[15px] leading-relaxed text-ink-muted">
                        {body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {sections.length > 0 && (
        <section className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="space-y-14">
              {sections.map((section) => (
                <article key={section.id}>
                  <h2 className="text-2xl font-extrabold tracking-tight text-navy-950">
                    {section.heading}
                  </h2>
                  {section.image_url && (
                    // Admin-supplied URLs can be any host, so this stays a plain
                    // <img> rather than next/image, which needs configured domains.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={section.image_url}
                      alt=""
                      className="mt-6 w-full rounded-2xl object-cover"
                    />
                  )}
                  {section.body && (
                    <div className="mt-4 space-y-4">
                      {/* Blank lines separate paragraphs, as in the course copy. */}
                      {section.body
                        .split(/\n{2,}/)
                        .filter(Boolean)
                        .map((paragraph, i) => (
                          <p
                            key={i}
                            className="text-[16.5px] leading-[1.75] text-ink-muted"
                          >
                            {paragraph}
                          </p>
                        ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-slate-200 bg-cream">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <Users className="size-8 text-brand-600" aria-hidden />
            <p className="max-w-3xl text-lg font-medium leading-relaxed text-navy-950">
              For almost a decade, we&rsquo;ve been providing high-quality online
              courses led by expert instructors with deep industry experience.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
