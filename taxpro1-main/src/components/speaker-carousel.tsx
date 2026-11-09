"use client";

import { useEffect, useState } from "react";
import { initials } from "@/lib/course-topic";

export type Speaker = {
  name: string;
  title: string | null;
  bio: string | null;
  avatarUrl: string | null;
  /** Titles of the published courses this speaker presents. */
  courses: string[];
};

/**
 * Auto-advancing "Our Mentors" showcase: bio on the left, a card on the right
 * with the photo in a circle (initials when there's no photo), name and
 * title. Every 4 seconds it steps to the next mentor, fading both halves in
 * together (remounting the keyed elements re-triggers the CSS fade-in).
 * A mentor without a bio shows the courses they present instead.
 */
export function SpeakerCarousel({ speakers }: { speakers: Speaker[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (speakers.length < 2) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % speakers.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [speakers.length]);

  const current = speakers[index % speakers.length];
  if (!current) return null;
  const courses = current.courses.slice(0, 3);

  return (
    <div className="grid items-center gap-10 lg:grid-cols-2">
      <div key={`bio-${index}`} className="animate-fade-in">
        {current.bio ? (
          <p className="text-xl italic leading-relaxed text-ink-muted">
            &ldquo;{current.bio}&rdquo;
          </p>
        ) : courses.length > 0 ? (
          <div>
            <p className="text-[13px] font-bold uppercase tracking-wider text-brand-600">
              Teaches
            </p>
            <ul className="mt-3 space-y-2">
              {courses.map((title) => (
                <li key={title} className="text-lg leading-snug text-ink-muted">
                  {title}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-xl italic leading-relaxed text-ink-muted">
            &ldquo;Learn from experienced professionals, at your own pace.&rdquo;
          </p>
        )}
      </div>

      <div
        key={`card-${index}`}
        className="animate-fade-in mx-auto flex w-full max-w-xs flex-col items-center rounded-2xl bg-white p-8 text-center shadow-lg shadow-navy-950/10"
      >
        {current.avatarUrl ? (
          // Admin-uploaded URLs can be any host, so a plain <img>.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.avatarUrl}
            alt={current.name}
            className="size-24 rounded-full object-cover ring-4 ring-brand-100"
          />
        ) : (
          <span className="flex size-24 items-center justify-center rounded-full bg-brand-gradient text-2xl font-bold text-white ring-4 ring-brand-100">
            {initials(current.name)}
          </span>
        )}
        <p className="mt-5 font-display text-lg font-bold text-navy-950">{current.name}</p>
        {current.title && (
          <p className="mt-1 text-[12.5px] font-semibold uppercase tracking-wide text-brand-600">
            {current.title}
          </p>
        )}
      </div>
    </div>
  );
}
