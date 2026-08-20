import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Pill CTA with the trailing arrow badge used throughout the reference layout. */
export function PillLink({
  href,
  children,
  variant = "brand",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "brand" | "dark" | "outline";
  className?: string;
}) {
  const styles = {
    brand: "bg-brand-gradient text-white shadow-lg shadow-brand-600/25",
    dark: "bg-navy-950 text-white",
    outline: "border-2 border-navy-950 text-navy-950",
  }[variant];

  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-3 rounded-full py-2 pl-7 pr-2 text-sm font-bold transition-transform duration-200 hover:-translate-y-0.5",
        styles,
        className,
      )}
    >
      {children}
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-full transition-transform duration-200 group-hover:translate-x-0.5",
          variant === "brand" ? "bg-white/20" : "bg-white/15",
          variant === "outline" && "bg-navy-950/10",
        )}
      >
        <ArrowRight className="size-4" aria-hidden />
      </span>
    </Link>
  );
}

/** Two-line section heading: plain first line, italic-underlined accent second line. */
export function SectionHeading({
  lead,
  accent,
  className,
  as: Tag = "h2",
}: {
  lead: string;
  accent: string;
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <Tag
      className={cn(
        "font-display font-extrabold leading-[1.15] tracking-tight text-navy-950",
        Tag === "h1"
          ? "text-4xl sm:text-5xl lg:text-[3.5rem]"
          : "text-3xl sm:text-4xl",
        className,
      )}
    >
      {lead}{" "}
      <span className="heading-accent decoration-brand-500">{accent}</span>
    </Tag>
  );
}

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-700",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Cream page banner used at the top of every interior page. */
export function PageBanner({
  title,
  crumb,
}: {
  title: string;
  crumb: { href: string; label: string }[];
}) {
  return (
    <section className="border-b border-cream-dark bg-cream">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-navy-950 sm:text-5xl">
          {title}
        </h1>
        <nav aria-label="Breadcrumb" className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          {crumb.map((c, i) => (
            <span key={c.href} className="flex items-center gap-2">
              {i > 0 && <span className="text-slate-400">/</span>}
              {i === crumb.length - 1 ? (
                <span className="font-semibold text-brand-700">{c.label}</span>
              ) : (
                <Link
                  href={c.href}
                  className="font-medium text-ink-muted transition-colors duration-200 hover:text-brand-700"
                >
                  {c.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      </div>
    </section>
  );
}

/** Shared prose styling for the long-form policy pages. */
export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 [&_h2]:mb-4 [&_h2]:mt-12 [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:text-navy-950 [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-navy-950 [&_li]:mb-2 [&_li]:text-[16.5px] [&_li]:leading-relaxed [&_li]:text-ink-muted [&_p]:mb-4 [&_p]:text-[16.5px] [&_p]:leading-[1.75] [&_p]:text-ink-muted [&_ul]:mb-6 [&_ul]:list-disc [&_ul]:pl-6">
      {children}
    </div>
  );
}
