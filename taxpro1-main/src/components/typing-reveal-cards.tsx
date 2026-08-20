"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Item = { title: string; body: string };

/**
 * A grid of cards that type themselves in one at a time — card 2 stays fully
 * invisible until card 1's title + body finish typing, and so on. Triggers
 * once the first time the grid scrolls into view; never repeats.
 *
 * Dependency-free (setInterval-driven reveal), matching the style of a
 * chat-demo "AI is typing" effect but for static feature cards.
 */
export function TypingRevealCards({
  items,
  className,
  cardClassName,
  speed = 18,
}: {
  items: Item[];
  className?: string;
  cardClassName?: string;
  speed?: number;
}) {
  const containerRef = useRef<HTMLUListElement>(null);
  const [started, setStarted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStarted(true);
      setActiveIndex(items.length); // skip straight to "everything done"
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ul ref={containerRef} className={className}>
      {items.map((item, i) => (
        <li key={item.title} className={cn(i > activeIndex && "invisible", cardClassName)}>
          {(started && i <= activeIndex) && (
            <TypingCard
              item={item}
              speed={speed}
              active={i === activeIndex}
              onDone={() => setActiveIndex((cur) => (cur === i ? cur + 1 : cur))}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

function TypingCard({
  item,
  speed,
  active,
  onDone,
}: {
  item: Item;
  speed: number;
  active: boolean;
  onDone: () => void;
}) {
  // Once this card is no longer the active typer, it has already finished —
  // just render the full text statically (no re-animating on re-render).
  const [titleShown, setTitleShown] = useState(active ? "" : item.title);
  const [bodyShown, setBodyShown] = useState(active ? "" : item.body);
  const [typingBody, setTypingBody] = useState(false);

  useEffect(() => {
    if (!active) return;

    let i = 0;
    const titleTimer = setInterval(() => {
      i++;
      setTitleShown(item.title.slice(0, i));
      if (i >= item.title.length) {
        clearInterval(titleTimer);
        setTypingBody(true);
      }
    }, speed);

    return () => clearInterval(titleTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    if (!active || !typingBody) return;

    let j = 0;
    const bodyTimer = setInterval(() => {
      j++;
      setBodyShown(item.body.slice(0, j));
      if (j >= item.body.length) {
        clearInterval(bodyTimer);
        onDone();
      }
    }, speed);

    return () => clearInterval(bodyTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, typingBody]);

  const titleDone = titleShown.length === item.title.length;

  return (
    <>
      <h3 className="text-base font-bold text-navy-950">
        {titleShown}
        {active && !titleDone && <Cursor />}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        {bodyShown}
        {active && titleDone && bodyShown.length < item.body.length && <Cursor />}
      </p>
    </>
  );
}

function Cursor() {
  return (
    <span className="ml-0.5 inline-block h-[1em] w-[2px] animate-pulse bg-brand-500 align-middle" />
  );
}
