import Link from "next/link";
import {
  Award,
  Building2,
  Check,
  Users,
  X,
} from "lucide-react";
import { getFeatured } from "@/lib/data/catalog";
import {
  getBanners,
  getBrands,
  getIndustries,
  getTestimonials,
} from "@/lib/data/site-content";
import { WebinarCard } from "@/components/webinar-card";
import { IndustryIcon } from "@/components/industry-icon";
import { Badge, PillLink, SectionHeading } from "@/components/ui";

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
    name: "Single Session",
    tagline: "Learn Smarter. Achieve Faster.",
    price: "$169",
    unit: "/ webinar",
    features: [
      { label: "Attend one LIVE session", included: true },
      { label: "Real-time Q&A with the instructor", included: true },
      { label: "Certificate of completion", included: true },
      { label: "On-demand replay access", included: false },
      { label: "Downloadable e-Transcript", included: false },
    ],
    cta: "Browse Webinars",
    href: "/webinar/upcoming",
    featured: false,
  },
  {
    name: "Annual Unlimited",
    tagline: "Education That Fits Your Life",
    price: "$199",
    unit: "/ year",
    features: [
      { label: "5000+ hours of approved CPE courses", included: true },
      { label: "Unlimited LIVE & on-demand webinars", included: true },
      { label: "Automated CPE/CE credit tracking", included: true },
      { label: "Downloadable e-Transcripts", included: true },
      { label: "One-on-one mentorship", included: false },
    ],
    cta: "Get Unlimited",
    href: "/register",
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
    cta: "Contact Sales",
    href: "/contact",
    featured: false,
  },
];

export default async function HomePage() {
  const [featured, industryRows, banners, testimonials, brands] = await Promise.all([
    getFeatured(3),
    getIndustries(),
    getBanners(),
    getTestimonials(),
    getBrands(),
  ]);

  const industries = industryRows.length ? industryRows : FALLBACK_INDUSTRIES;

  return (
    <>
      {/* ---------------------------------------------------------------- hero */}
      {/* Admin-managed via Content > Banners (the "banners" resource is
          documented as "hero slides shown at the top of the homepage").
          The first published banner becomes the hero image; falls back to
          the bundled image until one exists. Heading/icons/buttons are
          pixels baked into the image itself, not real elements — whatever
          image is used, its buttons won't be clickable. */}
      <section className="relative bg-cream">
        {banners[0]?.image_url ? (
          // Admin-supplied URLs can be any host, so this stays a plain <img>
          // rather than next/image, which needs configured domains.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={banners[0].image_url} alt={banners[0].title} className="h-auto w-full" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/herosection/slider_1__.webp"
            alt="A presenter leads a live CPE webinar on tax planning strategies for a room of remote participants"
            className="h-auto w-full"
          />
        )}
        <div className="absolute bottom-[6%] left-[4%]">
          <PillLink href="/webinar/upcoming">Browse Webinars</PillLink>
        </div>
      </section>

      {/* ---------------------------------------------------------- industries */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-center text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
            Industries We Cover
          </h2>
          <ul className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {industries.map((industry) => (
              <li
                key={industry.id}
                className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 p-8 text-center transition-colors duration-300 hover:border-brand-300 hover:bg-brand-50/40"
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
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* -------------------------------------------------------- promo banners */}
      {/* Admin-managed; banners[0] became the hero above, so only the rest
          (if any) show here. Absent entirely until a second banner exists. */}
      {banners.length > 1 && (
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
            <ul className="grid gap-6 lg:grid-cols-2">
              {banners.slice(1).map((banner) => (
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

      {/* ----------------------------------------------------- trending grid */}
      {/* TEMP: disabled per request. Remove the `false &&` below to restore. */}
      {false && (
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              lead="Unlock premium knowledge"
              accent="at a fraction of the price"
              className="max-w-2xl"
            />
            <PillLink href="/webinar/upcoming" variant="dark">
              View All
            </PillLink>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((webinar, i) => (
              <WebinarCard key={webinar.slug} webinar={webinar} position={i} />
            ))}
          </div>
        </div>
      </section>
      )}

      {/* --------------------------------------------------------- about strip */}
      <section className="bg-cream">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <Badge>
              <Building2 className="size-3.5" aria-hidden />
              About Taxpropath
            </Badge>
            <SectionHeading
              lead="Expertly crafted,"
              accent="high-quality online courses"
              className="mt-6"
            />
            <p className="mt-6 text-[17px] leading-[1.75] text-ink-muted">
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

          <ul className="grid gap-4 sm:grid-cols-2">
            {[
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
            ].map((item) => (
              <li
                key={item.title}
                className="rounded-2xl border border-navy-950/[0.07] bg-white p-6"
              >
                <h3 className="text-base font-bold text-navy-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------------- pricing */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_2fr] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <SectionHeading lead="World-Class Learning," accent="At Your Fingertips" />
              <p className="mt-6 text-[16.5px] leading-relaxed text-ink-muted">
                Buy a single session, or unlock the entire library for a year. Every
                plan includes approved CPE/CE credit and automated tracking.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
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
        </div>
      </section>

      {/* ------------------------------------------------------- testimonials */}
      {testimonials.length > 0 && (
        <section className="bg-cream">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <SectionHeading
              lead="Trusted by professionals"
              accent="who keep coming back"
              className="max-w-2xl"
            />
            <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial) => (
                <li
                  key={testimonial.id}
                  className="flex flex-col rounded-2xl border border-navy-950/[0.07] bg-white p-6"
                >
                  {testimonial.rating !== null && (
                    <p
                      className="text-[15px] tracking-widest text-brand-600"
                      aria-label={`${testimonial.rating} out of 5`}
                    >
                      {"★".repeat(Math.max(0, Math.min(5, testimonial.rating)))}
                    </p>
                  )}
                  <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed text-ink-muted">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
                  <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                    {testimonial.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={testimonial.avatar_url}
                        alt=""
                        className="size-10 rounded-full object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden
                        className="flex size-10 items-center justify-center rounded-full bg-brand-gradient text-[13px] font-bold text-white"
                      >
                        {testimonial.author_name.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <div>
                      <p className="text-[14px] font-bold text-navy-950">
                        {testimonial.author_name}
                      </p>
                      {testimonial.author_role && (
                        <p className="text-[12.5px] text-ink-muted">
                          {testimonial.author_role}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
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
          <div className="overflow-hidden rounded-3xl bg-brand-gradient px-8 py-14 text-center sm:px-16">
            <SectionHeading
              lead="Skills for Tomorrow,"
              accent="Starting Today"
              className="!text-white [&_span]:decoration-white/70"
            />
            <p className="mx-auto mt-5 max-w-xl text-[16.5px] leading-relaxed text-white/90">
              Join thousands of CPAs, EAs, and finance professionals earning their
              credits with Taxpropath.
            </p>
            <div className="mt-9 flex justify-center">
              <PillLink href="/register" variant="dark">
                Create Your Account
              </PillLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
