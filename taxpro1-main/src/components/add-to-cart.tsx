"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import type { Webinar } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export function AddToCart({ webinar }: { webinar: Webinar }) {
  const router = useRouter();
  const { addLine } = useCart();
  const [optionId, setOptionId] = useState(webinar.pricingOptions[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);

  const selected = webinar.pricingOptions.find((o) => o.id === optionId);

  function handleAdd() {
    if (!selected) return;
    addLine({
      webinarSlug: webinar.slug,
      title: webinar.title,
      optionId: selected.id,
      optionLabel: selected.label,
      unitPriceCents: selected.priceCents,
      quantity,
    });
    router.push("/cart");
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7">
      <h2 className="text-lg font-extrabold text-navy-950">Available Options</h2>

      <fieldset className="mt-5">
        <legend className="sr-only">Choose a delivery format</legend>
        <div className="max-h-[26rem] space-y-2 overflow-y-auto pr-1">
          {webinar.pricingOptions.map((option) => {
            const active = option.id === optionId;
            return (
              <label
                key={option.id}
                className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition-colors duration-200 ${
                  active
                    ? "border-brand-500 bg-brand-50/60"
                    : "border-slate-200 hover:border-brand-300 hover:bg-brand-50/30"
                }`}
              >
                <input
                  type="radio"
                  name="pricing-option"
                  value={option.id}
                  checked={active}
                  onChange={() => setOptionId(option.id)}
                  className="mt-1 size-4 shrink-0 accent-brand-600"
                />
                <span className="flex-1">
                  <span className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-[14.5px] font-bold text-navy-950">
                      {option.label}
                    </span>
                    <span className="text-[15px] font-extrabold tabular-nums text-brand-700">
                      {formatPrice(option.priceCents)}
                    </span>
                  </span>
                  {option.description && (
                    <span className="mt-1 block text-[13px] leading-snug text-ink-muted">
                      {option.description}
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-6 flex items-center gap-4 border-t border-slate-100 pt-6">
        <span className="text-sm font-bold text-navy-950">Qty</span>
        <div className="flex items-center rounded-full border border-slate-200">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex size-11 cursor-pointer items-center justify-center rounded-l-full text-ink-muted transition-colors duration-200 hover:bg-slate-50 disabled:opacity-40"
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            <Minus className="size-4" aria-hidden />
          </button>
          <span
            className="w-12 text-center text-[15px] font-bold tabular-nums text-navy-950"
            aria-live="polite"
          >
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="flex size-11 cursor-pointer items-center justify-center rounded-r-full text-ink-muted transition-colors duration-200 hover:bg-slate-50"
            aria-label="Increase quantity"
          >
            <Plus className="size-4" aria-hidden />
          </button>
        </div>
        {selected && (
          <p className="ml-auto text-right">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total
            </span>
            <span className="text-xl font-extrabold tabular-nums text-navy-950">
              {formatPrice(selected.priceCents * quantity)}
            </span>
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-brand-gradient py-4 text-sm font-bold text-white shadow-lg shadow-brand-600/25 transition-transform duration-200 hover:-translate-y-0.5"
      >
        <ShoppingCart className="size-4" aria-hidden />
        Add to Cart
      </button>
    </div>
  );
}
