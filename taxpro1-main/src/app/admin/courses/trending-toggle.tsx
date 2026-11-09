"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { setTrending } from "./actions";

/**
 * One-click "Trending on the homepage" switch for a course row. The server
 * enforces the limit; its message is shown under the button.
 */
export function TrendingToggle({
  id,
  title,
  on,
  disabled,
}: {
  id: string;
  title: string;
  on: boolean;
  /** View-only admins see the state but can't change it. */
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    setError(null);
    startTransition(async () => {
      const result = await setTrending(id, !on);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        disabled={disabled || pending}
        aria-pressed={on}
        aria-label={`${on ? "Remove" : "Add"} ${title} ${on ? "from" : "to"} Trending Courses`}
        className={`flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
          on
            ? "bg-amber-100 text-amber-800 ring-1 ring-amber-300 hover:bg-amber-200"
            : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-navy-950"
        }`}
      >
        <Star className={`size-3.5 ${on ? "fill-amber-500 text-amber-500" : ""}`} aria-hidden />
        {pending ? "Saving…" : on ? "Trending" : "Add to Trending"}
      </button>
      {error && <p className="mt-1.5 max-w-48 text-[12px] font-semibold text-red-700">{error}</p>}
    </div>
  );
}
