"use client";

import { useEffect, useState } from "react";

type Speaker = { name: string; title: string; bio: string };

/**
 * Auto-advancing speaker showcase: description on the left, photo card on
 * the right. Every 2 seconds it steps to the next speaker, fading both
 * halves in together (remounting the keyed elements re-triggers the CSS
 * fade-in animation defined in globals.css).
 */
export function SpeakerCarousel({ speakers }: { speakers: Speaker[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % speakers.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [speakers.length]);

  const current = speakers[index];
  const initials = current.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <div className="grid items-center gap-10 lg:grid-cols-2">
      <div key={`bio-${index}`} className="animate-fade-in">
        <p className="font-poppins text-xl italic leading-relaxed text-ink-muted">
          &ldquo;{current.bio}&rdquo;
        </p>
      </div>

      <div
        key={`card-${index}`}
        className="animate-fade-in mx-auto flex w-full max-w-xs flex-col items-center rounded-2xl bg-white p-8 text-center shadow-lg shadow-navy-950/10"
      >
        <span className="flex size-24 items-center justify-center rounded-full bg-brand-gradient text-2xl font-bold text-white ring-4 ring-brand-100">
          {initials}
        </span>
        <p className="mt-5 font-display text-lg font-bold text-navy-950">
          {current.name}
        </p>
        <p className="mt-1 font-poppins text-[12.5px] font-semibold uppercase tracking-wide text-brand-600">
          {current.title}
        </p>
      </div>
    </div>
  );
}
