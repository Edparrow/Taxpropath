import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { Spotlight } from "@/components/spotlight";

/** Pill CTA with the trailing arrow badge used throughout the reference layout. */
export function PillLink({
  href,
  children,
  variant = "brand",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "brand" | "dark" | "outline" | "light" | "ghost";
  className?: string;
}) {
  const styles = {
    brand: "bg-brand-gradient text-white shadow-lg shadow-brand-600/25",
    dark: "bg-navy-950 text-white",
    outline: "border-2 border-navy-950 text-navy-950",
    light: "bg-white text-navy-950 shadow-lg shadow-black/20",
    ghost: "border border-white/25 text-white hover:bg-white/10",
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
          (variant === "outline" || variant === "light") && "bg-navy-950/10",
        )}
      >
        <ArrowRight className="size-4" aria-hidden />
      </span>
    </Link>
  );
}

/** Main section heading: large, in the brand gradient. */
export function SectionHeading({
  lead,
  accent,
  className,
  as: Tag = "h2",
  onDark,
}: {
  lead: string;
  accent: string;
  className?: string;
  as?: "h1" | "h2";
  /** On a dark background: white lead, bright gradient accent. */
  onDark?: boolean;
}) {
  return (
    <Tag
      className={cn(
        "font-display font-bold leading-[1.15] tracking-tight",
        onDark ? "text-white" : "text-navy-950",
        Tag === "h1"
          ? "text-4xl sm:text-5xl lg:text-[3.5rem]"
          : "text-3xl sm:text-4xl lg:text-[2.75rem]",
        className,
      )}
    >
      {lead}{" "}
      {/* Inline span so the gradient follows the words, not the full width. */}
      {onDark ? (
        <span className="text-heading-gradient-light pb-1">{accent}</span>
      ) : (
        <span className="text-heading-gradient pb-1">{accent}</span>
      )}
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

/**
 * Dark backdrop shared by the interior page banners and the homepage CTA:
 * navy base, brand glow from the top, a fine grid fading out.
 */
export function DarkGlow() {
  return (
    <>
      <div
        aria-hidden
        className="absolute left-1/2 top-0 -z-10 h-72 w-[46rem] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-600/35 blur-3xl"
      />
      <div
        aria-hidden
        className="auth-blob-b absolute -bottom-40 -right-24 -z-10 size-96 rounded-full bg-navy-500/30 blur-3xl"
      />
      <div
        aria-hidden
        className="auth-blob-a absolute -left-24 top-1/3 -z-10 size-72 rounded-full bg-teal-500/15 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
      />
      <Spotlight />
    </>
  );
}

/** Breadcrumb trail for the dark banners. The last item is the current page. */
export function DarkBreadcrumb({ crumb }: { crumb: { href: string; label: string }[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[13px]"
    >
      {crumb.map((c, i) => (
        <span key={c.href} className="flex items-center gap-2">
          {i > 0 && <span className="text-slate-500">/</span>}
          {i === crumb.length - 1 ? (
            <span aria-current="page" className="font-semibold text-brand-300">
              {c.label}
            </span>
          ) : (
            <Link
              href={c.href}
              className="font-medium text-slate-300 transition-colors duration-200 hover:text-white"
            >
              {c.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

/** Dark, centred page banner (colourful title, mouse-follow glow) for every interior page. */
export function PageBanner({
  title,
  accent,
  tall,
  crumb,
}: {
  /** Whole title in colour, or, with `accent`, the white first part. */
  title: string;
  /** Optional coloured second part: "Self-Study" + "Courses". */
  accent?: string;
  /** Fills the screen below the header, with a "Scroll" hint to `#page-content`. */
  tall?: boolean;
  crumb: { href: string; label: string }[];
}) {
  return (
    <section className="relative isolate overflow-hidden bg-navy-950">
      <DarkGlow />
      <div
        className={cn(
          "mx-auto flex max-w-7xl flex-col items-center justify-center px-4 text-center sm:px-6 lg:px-8",
          tall ? "min-h-[calc(100svh-3.5rem)] py-24" : "py-16 lg:py-24",
        )}
      >
        <div className="auth-rise" style={{ "--d": "0s" } as CSSProperties}>
          <DarkBreadcrumb crumb={crumb} />
        </div>
        {/* Words rise in one by one; the coloured part keeps a light sweep. */}
        <h1
          aria-label={accent ? `${title} ${accent}` : title}
          className={cn(
            "mt-6 font-display font-bold leading-[1.1] tracking-tight",
            tall ? "text-5xl sm:text-6xl lg:text-7xl xl:text-8xl" : "text-4xl sm:text-5xl lg:text-6xl",
          )}
        >
          <span aria-hidden>
            {[
              ...title.split(" ").map((w) => ({ w, colour: !accent })),
              ...(accent ?? "").split(" ").filter(Boolean).map((w) => ({ w, colour: true })),
            ].map(({ w, colour }, i) => (
              <span key={i}>
                {i > 0 && " "}
                <span className="auth-letter pb-2" style={{ "--i": i * 1.6 } as CSSProperties}>
                  <span className={colour ? "text-shimmer" : "text-white"}>{w}</span>
                </span>
              </span>
            ))}
          </span>
        </h1>
        <div
          aria-hidden
          className="auth-underline mt-6 h-1 w-20 rounded-full bg-brand-gradient"
          style={{ transformOrigin: "center" }}
        />
      </div>
      {tall && (
        <a
          href="#page-content"
          className="auth-rise absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400 transition-colors hover:text-white"
          style={{ "--d": "1.2s" } as CSSProperties}
        >
          Scroll
          <span className="scroll-hint flex size-8 items-center justify-center rounded-full border border-white/20">
            <ChevronDown className="size-4" aria-hidden />
          </span>
        </a>
      )}
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
