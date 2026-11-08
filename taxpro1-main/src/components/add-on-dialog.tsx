"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { PricingOption } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

/**
 * The add-on pop-up (3 Nov 2026 brief): a native <dialog> that offers the two
 * optional add-ons (e-Transcript, Slides) on top of the base self-study price,
 * with a running total. Open to guests — checkout is where sign-in is gated.
 */
export function AddOnDialog({
  open,
  onClose,
  onConfirm,
  courseTitle,
  base,
  addons,
  confirmLabel,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (selectedCodes: string[]) => void;
  courseTitle: string;
  base: PricingOption;
  addons: PricingOption[];
  confirmLabel: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setSelected([]);
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function toggle(code: string) {
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }

  const totalCents =
    base.priceCents +
    addons
      .filter((a) => selected.includes(a.code))
      .reduce((sum, a) => sum + a.priceCents, 0);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        // A click on the backdrop lands on the <dialog> element itself.
        if (e.target === ref.current) onClose();
      }}
      className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-3xl p-0 shadow-2xl backdrop:bg-navy-950/50 backdrop:backdrop-blur-sm"
    >
      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold leading-snug text-navy-950">
              Add optional materials?
            </h2>
            <p className="mt-1 text-[13px] leading-snug text-ink-muted">{courseTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-full p-1.5 text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-navy-950"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="mt-5 flex items-baseline justify-between rounded-2xl bg-cream px-4 py-3">
          <p className="text-[14px] font-bold text-navy-950">Self-Study Course</p>
          <p className="text-[15px] font-extrabold tabular-nums text-navy-950">
            {formatPrice(base.priceCents)}
          </p>
        </div>

        <div className="mt-3 space-y-2">
          {addons.map((addon) => {
            const { code } = addon;
            const active = selected.includes(code);
            return (
              <label
                key={addon.id}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors duration-200 ${
                  active
                    ? "border-brand-500 bg-brand-50/60"
                    : "border-slate-200 hover:border-brand-300 hover:bg-brand-50/30"
                }`}
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => toggle(code)}
                  className="mt-0.5 size-4 shrink-0 accent-brand-600"
                />
                <span className="flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="text-[14px] font-bold text-navy-950">
                      {addon.label}
                    </span>
                    <span className="text-[14px] font-extrabold tabular-nums text-brand-700">
                      +{formatPrice(addon.priceCents)}
                    </span>
                  </span>
                  {addon.description && (
                    <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-muted">
                      {addon.description}
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </div>

        <div className="mt-5 flex items-baseline justify-between border-t border-slate-100 pt-4">
          <p className="text-sm font-bold text-navy-950">Total</p>
          <p
            className="text-2xl font-extrabold tabular-nums text-navy-950"
            aria-live="polite"
          >
            {formatPrice(totalCents)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onConfirm(selected)}
          className="mt-5 w-full cursor-pointer rounded-full bg-brand-gradient py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-600/25 transition-transform duration-200 hover:-translate-y-0.5"
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
