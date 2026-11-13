import Image from "next/image";
import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { NewsletterForm } from "@/components/newsletter-form";
import { ChatbotWidget } from "@/components/chatbot-widget";
import { COMPANY } from "@/lib/company";

const INDUSTRIES = [
  "Banking & Taxation",
  "Housing & Taxation",
  "Sales & Leadership",
  "Education",
];

const USEFUL_LINKS = [
  { href: "/courses", label: "Self-Study Courses" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/refund-policy", label: "Refund Policy" },
  { href: "/terms-and-conditions", label: "Terms & Conditions" },
  { href: "/contact", label: "Contact Us" },
];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-navy-950 text-slate-400">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-brand-600/[0.07] blur-3xl"
      />

      <div className="relative mx-auto grid max-w-7xl grid-cols-2 gap-x-8 gap-y-8 px-4 py-10 sm:px-6 lg:grid-cols-12 lg:py-12 lg:px-8">
        <div className="col-span-2 lg:col-span-4">
          <Link href="/" className="inline-block rounded-lg bg-white/90 px-3 py-2">
            <Image
              src="/logo.png"
              alt="Taxpropath"
              width={1024}
              height={318}
              className="h-8 w-auto"
            />
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            For almost a decade, we&rsquo;ve been providing high-quality online courses
            led by expert instructors with deep industry experience.
          </p>
          <div className="max-w-xs">
            <NewsletterForm />
          </div>
        </div>

        <div className="lg:col-span-2">
          <FooterHeading>Industries</FooterHeading>
          <ul className="space-y-2.5">
            {INDUSTRIES.map((industry) => (
              <li key={industry} className="text-sm">
                {industry}
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2">
          <FooterHeading>Useful Links</FooterHeading>
          <ul className="space-y-2.5">
            {USEFUL_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block w-fit text-sm font-medium transition-all duration-300 hover:translate-x-1 hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="col-span-2 lg:col-span-4">
          <FooterHeading>Contact Us</FooterHeading>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-sm leading-relaxed">
              <MapPin className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
              <span>
                {COMPANY.addressLines[0]}
                <br />
                {COMPANY.addressLines[1]}
              </span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <Phone className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
              <a
                href={COMPANY.phoneHref}
                className="transition-colors duration-200 hover:text-white"
              >
                {COMPANY.phone}
              </a>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <Mail className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
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

      <div className="relative border-t border-white/[0.05] bg-[#02040a]">
        <p className="mx-auto max-w-7xl px-4 py-4 text-center text-[13px] text-slate-500 sm:px-6 lg:px-8">
          Copyright &copy; 2026 Taxpropath. All Rights Reserved
        </p>
      </div>

      <ChatbotWidget />
    </footer>
  );
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="relative mb-4 pb-2 text-[13px] font-bold uppercase tracking-[0.14em] text-white after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-8 after:rounded-full after:bg-brand-gradient after:content-['']">
      {children}
    </h4>
  );
}
