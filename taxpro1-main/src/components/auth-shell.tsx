import type { CSSProperties, ReactNode } from "react";
import { Award, BadgeCheck, BookOpenCheck, Clock3, GraduationCap } from "lucide-react";

/**
 * Frame for the auth pages (login, register, reset password): one rounded
 * card centred on a cream band, so the page sits cleanly between the header
 * and the dark footer. Inside the card: a dark brand panel (animated word,
 * selling points, trust chips) and the form. On phones the panel becomes a
 * short band above the form.
 */

const POINTS = [
  { icon: BookOpenCheck, text: "Self-study CPE courses, ready when you are" },
  { icon: Clock3, text: "Learn at your own pace, on any device" },
  { icon: Award, text: "Certificates in your learning portal" },
];

const CHIPS = [
  { icon: GraduationCap, label: "CPE credits" },
  { icon: BadgeCheck, label: "IRS approved" },
  { icon: Award, label: "Certificates" },
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
    <section className="relative isolate overflow-hidden bg-cream px-4 py-10 sm:px-6 sm:py-16 lg:py-20">
      {/* Soft background glow so the card doesn't float on a flat colour. */}
      <div
        aria-hidden
        className="absolute -left-40 top-10 -z-10 size-[28rem] rounded-full bg-brand-200/40 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -right-40 bottom-0 -z-10 size-[30rem] rounded-full bg-navy-200/40 blur-3xl"
      />

      <div
        className={`mx-auto grid overflow-hidden rounded-[2rem] border border-white bg-white shadow-2xl shadow-navy-950/10 ${
          wide
            ? "max-w-6xl lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]"
            : "max-w-5xl lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
        }`}
      >
        {/* ------------------------------------------------ brand panel */}
        <div className="relative isolate overflow-hidden bg-navy-950 px-7 py-10 text-white sm:px-10 lg:flex lg:flex-col lg:justify-between lg:p-12">
          <div aria-hidden className="auth-grid absolute inset-0 -z-10" />
          <div
            aria-hidden
            className="auth-blob-a absolute -left-24 -top-24 -z-10 size-80 rounded-full bg-brand-600/45 blur-3xl"
          />
          <div
            aria-hidden
            className="auth-blob-b absolute -bottom-32 -right-24 -z-10 size-96 rounded-full bg-navy-500/50 blur-3xl"
          />

          <div>
            <p
              className="auth-rise text-[12px] font-bold uppercase tracking-[0.25em] text-brand-300"
              style={{ "--d": "0s" } as CSSProperties}
            >
              Taxpropath
            </p>
            <h1
              className="mt-3 text-5xl font-extrabold leading-none tracking-tight sm:text-6xl"
              aria-label={word}
            >
              <span aria-hidden>
                {letters.map((ch, i) => (
                  <span key={i} className="auth-letter" style={{ "--i": i } as CSSProperties}>
                    {ch === " " ? " " : ch}
                  </span>
                ))}
                <span
                  className="auth-letter ml-1"
                  style={{ "--i": letters.length } as CSSProperties}
                >
                  <span className="auth-dot inline-block size-2.5 rounded-full bg-brand-400 sm:size-3" />
                </span>
              </span>
            </h1>
            <div aria-hidden className="auth-underline mt-5 h-1.5 w-24 rounded-full bg-brand-gradient" />
            <p className="auth-rise mt-5 max-w-sm text-[15px] leading-relaxed text-slate-300">
              {tagline}
            </p>

            <ul className="mt-8 hidden space-y-3 sm:block">
              {POINTS.map(({ icon: Icon, text }, i) => (
                <li
                  key={text}
                  className="auth-rise flex items-center gap-3 text-[14px] text-slate-200"
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

          {/* Trust chips: in the flow, so they never cover the text. */}
          <ul className="mt-10 hidden flex-wrap gap-2 lg:flex" aria-label="Why Taxpropath">
            {CHIPS.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 py-1.5 pl-1.5 pr-3 text-[12px] font-bold backdrop-blur-md"
              >
                <span className="flex size-7 items-center justify-center rounded-lg bg-brand-gradient">
                  <Icon className="size-3.5" aria-hidden />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        {/* ------------------------------------------------------- form */}
        <div className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
          <div className={`w-full ${wide ? "max-w-2xl" : "max-w-sm"}`}>{children}</div>
        </div>
      </div>
    </section>
  );
}
