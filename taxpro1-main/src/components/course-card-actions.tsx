"use client";

import { ShoppingCart, Zap } from "lucide-react";
import { usePurchase } from "@/components/use-purchase";
import type { Course } from "@/lib/types";

/** Add to Cart (icon) and Buy Now on a course card; both open the add-on pop-up. */
export function CourseCardActions({ course }: { course: Course }) {
  const { base, buyNow, addToCart, dialog } = usePurchase(course);
  if (!base) return null;

  return (
    // Above the card's full-size link overlay, so these stay clickable.
    <div className="relative z-10 flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={addToCart}
        aria-label={`Add ${course.title} to cart`}
        title="Add to Cart"
        className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-slate-300 text-navy-950 transition-colors duration-200 hover:border-navy-950 hover:bg-navy-950 hover:text-white"
      >
        <ShoppingCart className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={buyNow}
        aria-label={`Buy ${course.title} now`}
        className="flex cursor-pointer items-center gap-1.5 rounded-full bg-brand-gradient px-4 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-brand-600/20 transition-transform duration-200 hover:-translate-y-0.5"
      >
        <Zap className="size-3.5" aria-hidden />
        Buy Now
      </button>
      {dialog}
    </div>
  );
}
