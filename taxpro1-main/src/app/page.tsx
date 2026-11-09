import Link from "next/link";
import {
  Award,
  Briefcase,
  Building2,
  Check,
  Mic2,
  Tag,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { getFeaturedCourses } from "@/lib/data/catalog";
import { TRENDING_LIMIT } from "@/lib/trending";
import {
  getBanners,
  getBrands,
  getIndustries,
  getMentors,
} from "@/lib/data/site-content";
import { CourseCard } from "@/components/course-card";
import { IndustryIcon } from "@/components/industry-icon";
import { Reveal } from "@/components/reveal";
import { TypingRevealCards } from "@/components/typing-reveal-cards";
import { SpeakerCarousel } from "@/components/speaker-carousel";
import { Badge, DarkGlow, PillLink, SectionHeading } from "@/components/ui";

/*
 * Used only when the industries table is empty or unavailable, so the section
 * never renders blank on a fresh database.
 */
const FALLBACK_INDUSTRIES = [
  { id: "banking", name: "Banking & Taxation", icon: "Landmark", description: null },
  { id: "housing", name: "Housing & Taxation", icon: "Hammer", description: null },
  { id: "sales", name: "Sales & Leadership", icon: "LineChart", description: null },
  { id: "education", name: "Education", icon: "GraduationCap", description: null },
];

const PLANS = [
  {
    name: "Annual Unlimited",
    tagline: "Education That Fits Your Life",
    price: "$199",
    unit: "/ year",
    features: [
      { label: "Courses as per your requirements", included: true },
      { label: "5000+ hours of approved CPE courses", included: true },
      { label: "Unlimited self-study courses", included: true },
      { label: "Automated CPE/CE credit tracking", included: true },
      { label: "Downloadable e-Transcripts", included: true },
      { label: "One-on-one mentorship", included: false },
    ],
    cta: "Contact Us",
    href: "/contact",
    featured: true,
  },
  {
    name: "Team & Enterprise",
    tagline: "Flexible Learning, Real Results",
    price: "Custom",
    unit: "",
    features: [
      { label: "Everything in Annual Unlimited", included: true },
      { label: "Customized training for your staff", included: true },
      { label: "Team credit reporting dashboard", included: true },
      { label: "Dedicated account manager", included: true },
      { label: "Private, org-specific sessions", included: true },
    ],
    cta: "Contact Us",
    href: "/contact",
    featured: false,
  },
];

export default async function HomePage() {
  const [featured, industryRows, banners, mentors, brands] = await Promise.all([
    getFeaturedCourses(TRENDING_LIMIT),
    getIndustries(),
    getBanners(),
    getMentors(),
    getBrands(),
  ]);

  const industries = industryRows.length ? industryRows : FALLBACK_INDUSTRIES;
  // The first banner that has an image is the hero; the rest are promo cards.
  const hero = banners.find((b) => b.image_url);
  const promos = banners.filter((b) => b !== hero);

  return (
    <>
      {/* ---------------------------------------------------------------- hero */}
      {/* Comes only from the database (Admin > Content > Banners): the first
          published banner with an image is the hero, and its button label/link
          are the banner's own. Nothing is hard-coded — with no banner, the
          hero simply isn't rendered. Any heading or icons drawn inside the
          image are just pixels, so only the real button below is clickable. */}
      {hero?.image_url && (
        <section className="relative bg-cream">
          {/* Admin-supplied URLs can be any host, so this stays a plain <img>
              rather than next/image, which needs configured domains. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={hero.image_url} alt={hero.title} className="h-auto w-full" />
          {hero.cta_label && hero.cta_href && (
            <div className="absolute bottom-[6%] left-[4%]">
              <PillLink href={hero.cta_href}>{hero.cta_label}</PillLink>
            </div>
          )}
        </section>
      )}

      {/* ---------------------------------------------------- trending courses */}
      {/* Picked in Admin > Courses ("Add to Trending", max 6). With none
          picked, the newest courses fill the section so it's never empty. */}
      {featured.length > 0 && (
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="flex flex-col items-center text-center">
              <Badge>
                <TrendingUp className="size-3.5" aria-hidden />
                Most popular
              </Badge>
              <SectionHeading lead="Trending" accent="Courses" className="mt-4" />
              <p className="mt-3 max-w-xl text-[15.5px] leading-relaxed text-ink-muted">
                Self-study CPE courses professionals are taking right now.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {featured.map((course) => (
                <CourseCard key={course.slug} course={course} />
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <PillLink href="/courses" variant="dark">
                View All Courses
              </PillLink>
            </div>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------- industries */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <Reveal className="flex justify-center">
            <Badge>
              <Briefcase className="size-3.5" aria-hidden />
              Industries We Cover
            </Badge>
          </Reveal>
          <ul className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {industries.map((industry, i) => (
              <li key={industry.id}>
              <Reveal
                delay={1500 + i * 200}
                className="flex h-full flex-col items-center gap-4 rounded-2xl border border-slate-200 p-8 text-center transition-colors duration-300 hover:border-brand-300 hover:bg-brand-50/40"
              >
                <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-gradient text-white">
                  <IndustryIcon name={industry.icon} className="size-7" />
                </span>
                <p className="text-[15px] font-bold text-navy-950">{industry.name}</p>
                {industry.description && (
                  <p className="text-[13px] leading-relaxed text-ink-muted">
                    {industry.description}
                  </p>
                )}
              </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* -------------------------------------------------------- promo banners */}
      {/* Admin-managed; the hero banner above is excluded, so only the rest
          (if any) show here. Absent entirely until a second banner exists. */}
      {promos.length > 0 && (
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
            <ul className="grid gap-6 lg:grid-cols-2">
              {promos.map((banner) => (
                <li
                  key={banner.id}
                  className="relative overflow-hidden rounded-3xl bg-brand-gradient px-8 py-10"
                >
                  {banner.image_url && (
                    // Admin-supplied URLs can be any host, so this stays a plain
                    // <img> rather than next/image, which needs configured domains.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={banner.image_url}
                      alt=""
                      className="absolute inset-0 size-full object-cover opacity-25"
                    />
                  )}
                  <div className="relative">
                    <h3 className="text-2xl font-extrabold leading-snug text-white">
                      {banner.title}
                    </h3>
                    {banner.subtitle && (
                      <p className="mt-3 max-w-lg text-[15.5px] leading-relaxed text-white/90">
                        {banner.subtitle}
                      </p>
                    )}
                    {banner.cta_label && banner.cta_href && (
                      <div className="mt-7">
                        <PillLink href={banner.cta_href} variant="dark">
                          {banner.cta_label}
                        </PillLink>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* --------------------------------------------------------- about strip */}
      <section className="bg-cream">
        <div className="mx-auto max-w-7xl px-4 pt-8 text-center sm:px-6 lg:px-8">
          <Badge className="px-5 py-2 text-sm">
            <Building2 className="size-4" aria-hidden />
            About Taxpropath
          </Badge>
        </div>
        <Reveal
          direction="left"
          className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-8 sm:px-6 lg:grid-cols-2 lg:px-8"
        >
          <div>
            <SectionHeading
              lead="Expertly crafted,"
              accent="high-quality online courses"
              className="mt-6 text-3xl sm:text-4xl"
            />
            <p className="mt-6 font-poppins text-[17px] leading-[1.75] text-ink-muted">
              Taxpropath was founded with a twofold mission: to elevate professional
              education beyond standard CPE credits and to bridge the disconnect
              between content creators and learners. Our web-based video platform is
              purpose-built for Continuing Professional Education (CPE) and Continuing
              Education (CE), serving a wide range of accounting and tax professionals
              — including CPAs, EAs, accountants, CFOs, controllers, tax specialists,
              bookkeepers, Xero Advisors, QuickBooks Pro Advisors, and more.
            </p>
            <div className="mt-9">
              <PillLink href="/about-us" variant="dark">
                Learn More
              </PillLink>
            </div>
          </div>

          <TypingRevealCards
            className="grid gap-4 sm:grid-cols-2"
            cardClassName="rounded-2xl border border-navy-950/[0.07] bg-white p-6"
            speed={24}
            items={[
              {
                title: "Flexible Access",
                body: "Earn credits anytime via our mobile app and seamlessly integrated web platform.",
              },
              {
                title: "Easy Credit Tracking",
                body: "Simplified, automated tracking and management of all your CPE/CE credits.",
              },
              {
                title: "Quality Learning",
                body: "Always up-to-date, high-quality learning resources curated by top industry experts.",
              },
              {
                title: "Professional Focus",
                body: "Intelligently designed to fit the unique needs of busy, modern professionals.",
              },
            ]}
          />
        </Reveal>
      </section>

      {/* ------------------------------------------------------------- pricing */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <Badge>
              <Tag className="size-3.5" aria-hidden />
              Explore our plans
            </Badge>
          </div>

          <div className="mx-auto mt-20 grid max-w-3xl gap-6 sm:grid-cols-2">
            {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={
                    plan.featured
                      ? "relative rounded-3xl bg-navy-950 p-7 text-white shadow-2xl shadow-navy-950/20 sm:-mt-4 sm:pb-10"
                      : "rounded-3xl border border-slate-200 bg-white p-7"
                  }
                >
                  {plan.featured && (
                    <span className="absolute -top-3 right-6 rounded-full bg-brand-gradient px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                      Popular
                    </span>
                  )}

                  <h3
                    className={`text-xl font-extrabold ${plan.featured ? "text-white" : "text-navy-950"}`}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={`mt-1.5 text-[13px] ${plan.featured ? "text-slate-300" : "text-slate-500"}`}
                  >
                    {plan.tagline}
                  </p>

                  <p className="mt-6 flex items-baseline gap-1.5">
                    <span className="text-4xl font-extrabold tabular-nums text-brand-500">
                      {plan.price}
                    </span>
                    <span
                      className={`text-sm font-medium ${plan.featured ? "text-slate-400" : "text-slate-500"}`}
                    >
                      {plan.unit}
                    </span>
                  </p>

                  <ul className="mt-7 space-y-3.5">
                    {plan.features.map((feature) => (
                      <li key={feature.label} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check
                            className="mt-0.5 size-4 shrink-0 text-brand-500"
                            aria-hidden
                          />
                        ) : (
                          <X
                            className="mt-0.5 size-4 shrink-0 text-slate-400"
                            aria-hidden
                          />
                        )}
                        <span
                          className={`text-[13.5px] leading-snug ${
                            feature.included
                              ? plan.featured
                                ? "text-slate-200"
                                : "text-ink-muted"
                              : "text-slate-400 line-through"
                          }`}
                        >
                          {feature.label}
                        </span>
                        <span className="sr-only">
                          {feature.included ? "included" : "not included"}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    <PillLink
                      href={plan.href}
                      variant={plan.featured ? "brand" : "dark"}
                      className="w-full justify-between"
                    >
                      {plan.cta}
                    </PillLink>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- mentors */}
      {/* Speakers from Admin > Speakers; hidden until at least one is published. */}
      {mentors.length > 0 && (
        <section className="bg-cream">
          <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
            <div className="flex justify-center">
              <Badge>
                <Mic2 className="size-3.5" aria-hidden />
                Our Mentors
              </Badge>
            </div>

            <div className="mt-12">
              <SpeakerCarousel
                speakers={mentors.map((m) => ({
                  name: m.name,
                  title: m.title,
                  bio: m.bio,
                  avatarUrl: m.avatar_url,
                  courses: (m.courses ?? []).map((c) => c.title),
                }))}
              />
            </div>
          </div>
        </section>
      )}


      {/* ------------------------------------------------------------- brands */}
      {brands.length > 0 && (
        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <h2 className="text-center text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
              Trusted &amp; Accredited By
            </h2>
            <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
              {brands.map((brand) => {
                const logo = brand.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={brand.logo_url}
                    alt={brand.name}
                    className="h-10 w-auto opacity-70 transition-opacity duration-200 hover:opacity-100"
                  />
                ) : (
                  <span className="text-[15px] font-bold text-slate-400">
                    {brand.name}
                  </span>
                );

                return (
                  <li key={brand.id}>
                    {brand.website_url ? (
                      <a
                        href={brand.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {logo}
                      </a>
                    ) : (
                      logo
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* ----------------------------------------------------------- final CTA */}
      <section className="bg-cream">
        <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="relative isolate overflow-hidden rounded-[2rem] bg-navy-950 px-6 py-16 text-center ring-1 ring-white/10 sm:px-16 lg:py-20">
            <DarkGlow />
            <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-brand-400/60 to-transparent" />

            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[12px] font-bold uppercase tracking-[0.18em] text-brand-300">
              <span className="size-1.5 rounded-full bg-brand-400" aria-hidden />
              Start learning today
            </span>
            <SectionHeading
              lead="Skills for Tomorrow,"
              accent="Starting Today"
              onDark
              className="mx-auto mt-6 max-w-3xl"
            />
            <p className="mx-auto mt-5 max-w-xl text-[16.5px] leading-relaxed text-slate-300">
              Join thousands of CPAs, EAs, and finance professionals earning their
              credits with Taxpropath.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <PillLink href="/register" variant="light">
                Create Your Account
              </PillLink>
              <PillLink href="/courses" variant="ghost">
                Browse Courses
              </PillLink>
            </div>
            <ul className="mt-10 flex flex-wrap justify-center gap-x-7 gap-y-2 text-[13.5px] text-slate-400">
              {["IRS-approved CPE", "Learn at your own pace", "Instant certificates"].map((point) => (
                <li key={point} className="flex items-center gap-2">
                  <Check className="size-4 text-brand-400" aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
