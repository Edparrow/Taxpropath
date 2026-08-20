"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const OFFSET = {
  up: "translate-y-20",
  left: "-translate-x-16",
  right: "translate-x-16",
} as const;

/**
 * Fades + glides its children into place the first time they scroll into
 * view. Dependency-free (IntersectionObserver + a CSS transition) rather than
 * pulling in an animation library for one effect.
 *
 * `direction` picks which way it glides in from ("up" = from below, "left" =
 * from the left, "right" = from the right). `delay` (ms) staggers a group of
 * siblings — pass e.g. `i * 80` when mapping over a list so each card
 * animates a beat after the last.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  direction = "up",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: keyof typeof OFFSET;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect the OS-level "reduce motion" request — show content immediately.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect(); // animate in once, not every scroll pass
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
      className={cn(
        "transition-all duration-[1500ms] ease-out",
        visible ? "translate-x-0 translate-y-0 opacity-100" : `${OFFSET[direction]} opacity-0`,
        className,
      )}
    >
      {children}
    </div>
  );
}
