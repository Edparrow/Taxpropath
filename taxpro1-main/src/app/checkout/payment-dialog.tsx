"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Lock, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";

/**
 * The payment pop-up: PayPal and "Debit or Credit Card" live in here rather
 * than in the order summary, so nothing sits under the chat bot.
 *
 * Deliberately a plain fixed overlay, not a modal <dialog>: showModal() makes
 * the rest of the page inert and moves the dialog to the top layer, and
 * PayPal's inline card form (which draws parts of itself on the page) then
 * renders greyed out and ignores clicks. The payment buttons mount only while
 * it's open, because PayPal must measure a visible container to draw them.
 *
 * It's mounted as soon as the checkout loads, just invisible (laid out, so
 * PayPal can measure it, but transparent, unclickable and out of the tab
 * order). PayPal's script, buttons and card fields load in the background
 * while the buyer checks their details, so "Pay" opens it instantly.
 */
const noop = () => () => {};
export function PaymentDialog({
  open,
  onClose,
  totalCents,
  children,
}: {
  open: boolean;
  onClose: () => void;
  totalCents: number;
  children: React.ReactNode;
}) {
  // Esc closes; the page behind doesn't scroll while it's open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // The chat bot sits outside <body> at the highest z-index, so it would
    // float over the payment window; hide it while paying.
    const bot = document.getElementById("agy-chatbot-host");
    const botVisibility = bot?.style.visibility ?? "";
    if (bot) bot.style.visibility = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      if (bot) bot.style.visibility = botVisibility;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // Portals need the browser's <body>; nothing to show during server render.
  const isClient = useSyncExternalStore(noop, () => true, () => false);
  if (!isClient) return null;

  // Portalled to <body>: the order summary is position:sticky, which would
  // otherwise trap this overlay under the site header and the chat bot.
  return createPortal(
    <div
      aria-hidden={!open}
      inert={!open}
      className={`fixed inset-0 z-[2147483647] flex items-center justify-center p-3 transition-opacity duration-200 ${
        open ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <button
        type="button"
        aria-label="Close payment"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-navy-950/60 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-title"
        className="relative max-h-[calc(100svh-1.5rem)] w-[min(30rem,100%)] overflow-y-auto rounded-[1.75rem] bg-white shadow-2xl"
      >
        {/* Dark header, light body: the site's contrast. */}
        <div className="relative isolate overflow-hidden bg-navy-950 px-6 pb-6 pt-6 sm:px-7">
          <div aria-hidden className="absolute -top-20 left-1/3 -z-10 h-40 w-72 rounded-full bg-brand-600/40 blur-3xl" />
          <div aria-hidden className="absolute -bottom-16 -right-10 -z-10 size-40 rounded-full bg-navy-500/40 blur-3xl" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-brand-300">
                Secure payment
              </p>
              <h2 id="payment-title" className="mt-1 text-[15px] font-semibold text-white/80">
                Total to pay
              </h2>
              <p className="text-3xl font-bold tabular-nums text-white">{formatPrice(totalCents)}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="cursor-pointer rounded-full p-1.5 text-white/60 transition-colors duration-200 hover:bg-white/10 hover:text-white"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 pt-6 sm:px-7">
          <p className="mb-4 text-[13.5px] text-ink-muted">
            Pay with your PayPal account, or with a debit or credit card (no PayPal account
            needed).
          </p>
          {children}
          <p className="mt-5 flex items-center justify-center gap-1.5 text-[12.5px] text-slate-500">
            <Lock className="size-3.5" aria-hidden />
            Payments are processed securely by PayPal
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
