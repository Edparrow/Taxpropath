"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { AddOnDialog } from "@/components/add-on-dialog";
import { COURSE_CODES, type Course, type PricingOption } from "@/lib/types";

/** Splits a course's options into the base price and the add-ons it offers. */
export function splitCoursePricing(options: PricingOption[]) {
  const base = options.find((o) => o.code === COURSE_CODES.base) ?? null;
  const addons = COURSE_CODES.addons
    .map((code) => options.find((o) => o.code === code))
    .filter((o): o is PricingOption => Boolean(o));
  return { base, addons };
}

/**
 * Buy Now / Add to Cart for one course, shared by the course page and the
 * course cards. Both open the add-on pop-up first (skipped when the course
 * has no add-ons); Buy Now then goes straight to checkout, Add to Cart to the
 * cart. Render `dialog` once alongside the buttons.
 */
export function usePurchase(course: Course) {
  const router = useRouter();
  const { addLine } = useCart();
  const { base, addons } = splitCoursePricing(course.pricingOptions);
  const [mode, setMode] = useState<"cart" | "buy" | null>(null);

  function finish(kind: "cart" | "buy", selectedCodes: string[]) {
    if (!base) return;
    addLine({
      courseSlug: course.slug,
      title: course.title,
      basePriceCents: base.priceCents,
      addons: addons
        .filter((a) => selectedCodes.includes(a.code))
        .map((a) => ({ code: a.code, label: a.label, priceCents: a.priceCents })),
    });
    setMode(null);
    router.push(kind === "buy" ? "/checkout" : "/cart");
  }

  function start(kind: "cart" | "buy") {
    if (addons.length === 0) finish(kind, []);
    else setMode(kind);
  }

  const dialog = base ? (
    <AddOnDialog
      open={mode !== null}
      onClose={() => setMode(null)}
      onConfirm={(codes) => mode && finish(mode, codes)}
      courseTitle={course.title}
      base={base}
      addons={addons}
      confirmLabel={mode === "buy" ? "Continue to Checkout" : "Add to Cart"}
    />
  ) : null;

  return {
    base,
    addons,
    buyNow: () => start("buy"),
    addToCart: () => start("cart"),
    dialog,
  };
}
