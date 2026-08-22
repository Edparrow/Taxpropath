"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex cursor-pointer items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-[14px] font-bold text-white transition-transform duration-200 hover:-translate-y-0.5"
    >
      <Printer className="size-4" aria-hidden />
      Print / Save as PDF
    </button>
  );
}
