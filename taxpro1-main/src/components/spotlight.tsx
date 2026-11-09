"use client";

import { useEffect, useRef } from "react";

/**
 * Mouse-follow glow for the dark sections. Put it inside a `relative isolate
 * overflow-hidden` element: while the pointer is over that element, a soft
 * brand-coloured light and a brighter patch of grid follow the cursor.
 * Touch screens and "reduce motion" users simply don't get the effect.
 */
export function Spotlight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = ref.current;
    const host = layer?.parentElement;
    if (!layer || !host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    function move(event: PointerEvent) {
      if (event.pointerType !== "mouse" || !host || !layer) return;
      const box = host.getBoundingClientRect();
      const x = event.clientX - box.left;
      const y = event.clientY - box.top;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        layer.style.setProperty("--spot-x", `${x}px`);
        layer.style.setProperty("--spot-y", `${y}px`);
        layer.style.opacity = "1";
      });
    }
    function leave() {
      cancelAnimationFrame(frame);
      if (layer) layer.style.opacity = "0";
    }

    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(frame);
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500"
    >
      {/* Coloured light under the cursor. */}
      <div className="absolute inset-0 [background:radial-gradient(520px_circle_at_var(--spot-x,50%)_var(--spot-y,50%),rgba(34,197,94,0.22),rgba(0,102,204,0.14)_40%,transparent_70%)]" />
      {/* The grid lights up near the cursor. */}
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(220px_circle_at_var(--spot-x,50%)_var(--spot-y,50%),black,transparent)]" />
    </div>
  );
}
