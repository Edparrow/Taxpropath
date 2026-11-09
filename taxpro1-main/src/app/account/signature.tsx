import { Mrs_Saint_Delafield } from "next/font/google";

// Handwritten face for the name on the profile cover (loaded only here).
const script = Mrs_Saint_Delafield({ weight: "400", subsets: ["latin"], display: "swap" });

/**
 * The customer's name as a white signature filling its box (the right half of
 * the cover), with a pen stroke running the full width underneath.
 */
export function Signature({ name }: { name: string }) {
  // Long names get a smaller size so they still fit on one line.
  const size =
    name.length > 22
      ? "text-4xl sm:text-5xl lg:text-6xl"
      : name.length > 14
        ? "text-5xl sm:text-6xl lg:text-7xl"
        : "text-5xl sm:text-7xl lg:text-8xl";

  return (
    <div className="pointer-events-none w-full select-none text-right" aria-hidden>
      <p
        className={`${script.className} ${size} overflow-hidden whitespace-nowrap leading-[1.15] text-white/95 [text-shadow:0_2px_18px_rgba(255,255,255,0.18)]`}
      >
        {name}
      </p>
      <svg
        viewBox="0 0 400 16"
        preserveAspectRatio="none"
        className="-mt-1 h-3.5 w-full text-white/55"
        fill="none"
      >
        <path
          d="M4 11 C 90 3, 200 2, 290 8 S 380 13, 396 4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
