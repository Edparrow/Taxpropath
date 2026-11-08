import type { CSSProperties, ReactNode } from "react";
import { Award, BadgeCheck, BookOpenCheck, Clock3, GraduationCap } from "lucide-react";

/**
 * Split-screen frame for the auth pages (login, register, reset password).
 * Left: dark brand panel with drifting colour blobs, a fading grid, floating
 * cards and the page word animating in letter by letter. Right: the form.
 * On phones the panel becomes a short band above the form.
 */

const POINTS = [
  { icon: BookOpenCheck, text: "Self-study CPE courses, ready when you are" },
  { icon: Clock3, text: "Learn at your own pace, on any device" },
  { icon: Award, text: "Certificates in your learning portal" },
];

export function AuthShell({
  word,
  tagline,
  children,
  wide,
}: {
  /** The big animated word, e.g. "Login". */
  word: string;
  tagline: string;
  children: ReactNode;
  /** Wider form column (the register form has two columns of fields). */
  wide?: boolean;
}) {
  const letters = [...word];

  return (
    <section className="grid grid-cols-[minmax(0,1fr)] bg-white lg:min-h-[calc(100svh-3.5rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* ------------------------------------------------ animated brand panel */}
      <div className="relative isolate overflow-hidden bg-navy-950 px-6 py-14 text-white sm:px-10 lg:sticky lg:top-14 lg:flex lg:h-[calc(100svh-3.5rem)] lg:flex-col lg:justify-center lg:px-14 xl:px-20">
        <div aria-hidden className="auth-grid absolute inset-0 -z-10" />
        <div
          aria-hidden
          className="auth-blob-a absolute -left-24 -top-24 -z-10 size-[26rem] rounded-full bg-brand-600/45 blur-3xl"
        />
        <div
          aria-hidden
          className="auth-blob-b absolute -bottom-32 -right-20 -z-10 size-[30rem] rounded-full bg-navy-500/50 blur-3xl"
        />
        <div
          aria-hidden
          className="auth-blob-a absolute right-1/4 top-1/3 -z-10 size-56 rounded-full bg-emerald-400/20 blur-3xl [animation-delay:-6s]"
        />

        {/* Floating cards (decoration, large screens only). */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 hidden lg:block">
          <FloatCard className="right-[10%] top-[12%]" tilt="6deg" delay="0s" icon={GraduationCap} label="CPE credits" />
          <FloatCard className="bottom-[14%] right-[14%]" tilt="-5deg" delay="-2s" icon={BadgeCheck} label="IRS approved" />
          <FloatCard className="bottom-[8%] left-[12%]" tilt="4deg" delay="-4s" icon={Award} label="Certificate" />
        </div>

        <div className="relative max-w-md">
          <p className="auth-rise text-[13px] font-bold uppercase tracking-[0.25em] text-brand-300" style={{ "--d": "0s" } as CSSProperties}>
            Taxpropath
          </p>
          <h1 className="mt-3 text-6xl font-black leading-none tracking-tight sm:text-7xl xl:text-8xl" aria-label={word}>
            <span aria-hidden>
              {letters.map((ch, i) => (
                <span key={i} className="auth-letter" style={{ "--i": i } as CSSProperties}>
                  {ch === " " ? " " : ch}
                </span>
              ))}
              <span className="auth-letter ml-1" style={{ "--i": letters.length } as CSSProperties}>
                <span className="auth-dot inline-block size-3 rounded-full bg-brand-400 sm:size-4" />
              </span>
            </span>
          </h1>
          <div aria-hidden className="auth-underline mt-5 h-1.5 w-28 rounded-full bg-brand-gradient" />
          <p className="auth-rise mt-6 text-[16px] leading-relaxed text-slate-300 sm:text-[17px]">{tagline}</p>

          <ul className="mt-8 hidden space-y-3.5 sm:block">
            {POINTS.map(({ icon: Icon, text }, i) => (
              <li
                key={text}
                className="auth-rise flex items-center gap-3 text-[14.5px] text-slate-200"
                style={{ "--d": `${1.05 + i * 0.12}s` } as CSSProperties}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-brand-300 ring-1 ring-white/15">
                  <Icon className="size-4" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ------------------------------------------------------------ form */}
      <div className="flex items-start justify-center px-4 py-12 sm:px-8 lg:items-center lg:py-16">
        <div className={`w-full ${wide ? "max-w-2xl" : "max-w-md"}`}>{children}</div>
      </div>
    </section>
  );
}

function FloatCard({
  className,
  tilt,
  delay,
  icon: Icon,
  label,
}: {
  className: string;
  tilt: string;
  delay: string;
  icon: typeof Award;
  label: string;
}) {
  return (
    <div
      className={`auth-float absolute flex items-center gap-2.5 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-[13px] font-bold text-white shadow-2xl shadow-black/30 backdrop-blur-md ${className}`}
      style={{ "--tilt": tilt, animationDelay: delay } as CSSProperties}
    >
      <span className="flex size-8 items-center justify-center rounded-xl bg-brand-gradient">
        <Icon className="size-4" />
      </span>
      {label}
    </div>
  );
}
