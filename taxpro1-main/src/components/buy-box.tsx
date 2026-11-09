"use client";

import { ShoppingCart, Zap } from "lucide-react";
import { usePurchase } from "@/components/use-purchase";
import type { Course } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

/**
 * The course buy box: one base price, and both buttons open the add-on
 * pop-up. Add to Cart lands on the cart page; Buy Now skips straight to
 * checkout.
 */
export function BuyBox({ course }: { course: Course }) {
  const { base, addons, buyNow, addToCart, dialog } = usePurchase(course);
  if (!base) return null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
        Self-Study Course
      </p>
      <p className="mt-2 text-4xl font-extrabold tabular-nums text-navy-950">
        {formatPrice(base.priceCents)}
      </p>
      {addons.length > 0 && (
        <p className="mt-2 text-[13.5px] leading-snug text-ink-muted">
          Optional add-ons: {addons.map((a) => a.label).join(", ")}
        </p>
      )}

      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={buyNow}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-brand-gradient py-4 text-sm font-bold text-white shadow-lg shadow-brand-600/25 transition-transform duration-200 hover:-translate-y-0.5"
        >
          <Zap className="size-4" aria-hidden />
          Buy Now
        </button>
        <button
          type="button"
          onClick={addToCart}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-navy-950 py-[14px] text-sm font-bold text-navy-950 transition-colors duration-200 hover:bg-navy-950 hover:text-white"
        >
          <ShoppingCart className="size-4" aria-hidden />
          Add to Cart
        </button>
      </div>

      {dialog}
    </div>
  );
}
