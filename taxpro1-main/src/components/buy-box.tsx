"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Zap } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { AddOnDialog } from "@/components/add-on-dialog";
import { COURSE_CODES, type Course, type PricingOption } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

/** Splits a course's options into the base price and the add-ons it offers. */
function splitCoursePricing(options: PricingOption[]) {
  const base = options.find((o) => o.code === COURSE_CODES.base) ?? null;
  const addons = COURSE_CODES.addons
    .map((code) => options.find((o) => o.code === code))
    .filter((o): o is PricingOption => Boolean(o));
  return { base, addons };
}

/**
 * The course buy box: one base price, and both buttons open the add-on
 * pop-up. Add to Cart lands on the cart page; Buy Now skips straight to
 * checkout.
 */
export function BuyBox({ course }: { course: Course }) {
  const router = useRouter();
  const { addLine } = useCart();
  const { base, addons } = splitCoursePricing(course.pricingOptions);
  const [dialog, setDialog] = useState<"cart" | "buy" | null>(null);

  if (!base) return null;

  function confirm(selectedCodes: string[]) {
    if (!base) return;
    addLine({
      courseSlug: course.slug,
      title: course.title,
      basePriceCents: base.priceCents,
      addons: addons
        .filter((a) => selectedCodes.includes(a.code))
        .map((a) => ({ code: a.code, label: a.label, priceCents: a.priceCents })),
    });
    const target = dialog === "buy" ? "/checkout" : "/cart";
    setDialog(null);
    router.push(target);
  }

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
          onClick={() => setDialog("buy")}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-brand-gradient py-4 text-sm font-bold text-white shadow-lg shadow-brand-600/25 transition-transform duration-200 hover:-translate-y-0.5"
        >
          <Zap className="size-4" aria-hidden />
          Buy Now
        </button>
        <button
          type="button"
          onClick={() => setDialog("cart")}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-navy-950 py-[14px] text-sm font-bold text-navy-950 transition-colors duration-200 hover:bg-navy-950 hover:text-white"
        >
          <ShoppingCart className="size-4" aria-hidden />
          Add to Cart
        </button>
      </div>

      <AddOnDialog
        open={dialog !== null}
        onClose={() => setDialog(null)}
        onConfirm={confirm}
        courseTitle={course.title}
        base={base}
        addons={addons}
        confirmLabel={dialog === "buy" ? "Continue to Checkout" : "Add to Cart"}
      />
    </div>
  );
}
