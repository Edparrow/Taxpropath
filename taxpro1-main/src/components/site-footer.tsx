import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { NewsletterForm } from "@/components/newsletter-form";

const INDUSTRIES = [
  "Banking & Taxation",
  "Housing & Taxation",
  "Sales & Leadership",
  "Education",
];

const USEFUL_LINKS = [
  { href: "/webinar/upcoming", label: "Upcoming Webinar" },
  { href: "/webinar/pre-recorded", label: "Pre Recorded Webinar" },
  { href: "/blog", label: "Blog" },
  { href: "/gallery", label: "Gallery" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/refund-policy", label: "Refund Policy" },
  { href: "/contact", label: "Contact Us" },
];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-navy-950 text-slate-400">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-brand-600/[0.07] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-24 size-96 rounded-full bg-navy-500/[0.07] blur-3xl"
      />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="lg:col-span-1">
          <Link href="/" className="inline-block rounded-xl bg-white/90 px-4 py-3">
            <Image
              src="/logo.png"
              alt="Taxpropath"
              width={1024}
              height={318}
              className="h-10 w-auto"
            />
          </Link>
          <p className="mt-6 max-w-xs text-[15.5px] leading-relaxed">
            For almost a decade, we&rsquo;ve been providing high-quality online courses
            led by expert instructors with deep industry experience.
          </p>
          <NewsletterForm />
        </div>

        <div>
          <FooterHeading>Industries</FooterHeading>
          <ul className="space-y-4">
            {INDUSTRIES.map((industry) => (
              <li key={industry} className="text-[15.5px]">
                {industry}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <FooterHeading>Useful Links</FooterHeading>
          <ul className="space-y-4">
            {USEFUL_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-block text-[15.5px] font-medium transition-all duration-300 hover:translate-x-2 hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <FooterHeading>Contact Us</FooterHeading>
          <ul className="space-y-5">
            <li className="flex items-start gap-4 text-[15px] leading-relaxed">
              <MapPin className="mt-1 size-[18px] shrink-0 text-brand-600" aria-hidden />
              2117 Pennsylvania Avenue NW, Washington, DC 20037, USA
            </li>
            <li className="flex items-start gap-4 text-[15px]">
              <Mail className="mt-1 size-[18px] shrink-0 text-brand-600" aria-hidden />
              <a
                href="mailto:support@taxpropath.com"
                className="transition-colors duration-200 hover:text-white"
              >
                support@taxpropath.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="relative border-t border-white/[0.03] bg-[#02040a] py-6">
        <p className="mx-auto max-w-7xl px-4 text-center text-[14.5px] tracking-wide text-slate-500 sm:px-6 lg:px-8">
          Copyright &copy; 2026 Taxpropath. All Rights Reserved
        </p>
      </div>
    </footer>
  );
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="relative mb-6 pb-3 text-[1.35rem] font-extrabold tracking-wide text-white after:absolute after:bottom-0 after:left-0 after:h-[3px] after:w-10 after:rounded-full after:bg-brand-gradient after:content-['']">
      {children}
    </h4>
  );
}
