"use client";

import { useEffect, useRef, useState } from "react";
import { Courier_Prime } from "next/font/google";
import { CircleCheck, Download, Loader2, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { orderRef, receiptDate, type ReceiptData } from "@/lib/receipt";

const mono = Courier_Prime({ weight: ["400", "700"], subsets: ["latin"], display: "swap" });

/**
 * Shown the moment payment settles. Dark navy band on top, cream below, with
 * the printer on the seam: it feeds a white receipt out onto the light half,
 * then Close (to the thank-you page) and Download (PDF) appear.
 */
export function ReceiptDialog({
  receipt,
  onClose,
}: {
  receipt: ReceiptData;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [printed, setPrinted] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  async function download() {
    setError(null);
    setDownloading(true);
    try {
      const { downloadReceiptPdf } = await import("@/lib/receipt-pdf");
      await downloadReceiptPdf(receipt);
    } catch (err) {
      console.error("[receipt] pdf failed", err);
      setError("Couldn't create the PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="receipt-title"
      className="m-auto max-h-[calc(100svh-1.5rem)] w-[min(26rem,calc(100vw-1.5rem))] overflow-y-auto rounded-[2rem] bg-transparent p-0 [scrollbar-width:none] backdrop:bg-navy-950/70 backdrop:backdrop-blur-sm [&::-webkit-scrollbar]:hidden"
    >
      <div className="relative isolate overflow-hidden rounded-[2rem] bg-cream px-6 pb-6 pt-7 sm:px-8">
        {/* Dark band (site banner style) down to the middle of the printer. */}
        <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[5.85rem] overflow-hidden bg-navy-950">
          <div className="absolute -top-24 left-1/2 h-48 w-80 -translate-x-1/2 rounded-full bg-brand-600/45 blur-3xl" />
          <div className="absolute -bottom-20 -right-10 size-48 rounded-full bg-navy-500/40 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:28px_28px]" />
        </div>
        {/* Soft light glows on the cream half. */}
        <div aria-hidden className="absolute -bottom-24 -left-16 -z-10 size-64 rounded-full bg-brand-100/70 blur-3xl" />
        <div aria-hidden className="absolute -bottom-20 -right-16 -z-10 size-56 rounded-full bg-sky-100/80 blur-3xl" />

        <h2 id="receipt-title" className="text-center text-[13px] font-bold uppercase tracking-[0.2em] text-white/75">
          <span aria-live="polite">{printed ? "Your receipt" : "Printing your receipt…"}</span>
        </h2>

        {/* ---------------------------------------------------- printer */}
        <div className={`mt-5 ${printed ? "" : "animate-printer-hum"}`}>
          <div className="relative z-20 flex h-11 items-center justify-between rounded-2xl border border-white/10 bg-gradient-to-b from-[#334061] via-[#1c2540] to-[#111a30] px-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_14px_24px_-10px_rgba(0,0,0,0.7)]">
            <span className="font-display text-[11px] font-bold tracking-[0.3em] text-white/35">
              TAXPROPATH
            </span>
            <span
              aria-hidden
              className={`size-2 rounded-full ${
                printed
                  ? "bg-brand-400 shadow-[0_0_10px_2px_rgba(74,222,128,0.7)]"
                  : "animate-pulse bg-amber-400 shadow-[0_0_10px_2px_rgba(251,191,36,0.6)]"
              }`}
            />
          </div>
          <div className="relative z-10 mx-auto -mt-2 h-4 w-[86%] rounded-b-xl bg-gradient-to-b from-[#111a30] to-[#020617] shadow-[0_6px_10px_-4px_rgba(2,6,23,0.45)]" />
        </div>

        {/* The paper slides out from under the slot. */}
        <div className="relative mx-auto -mt-2.5 w-[82%] overflow-hidden pb-4">
          <div
            onAnimationEnd={() => setPrinted(true)}
            className={`${mono.className} animate-receipt-print bg-white px-5 pb-1 pt-5 text-navy-950 shadow-[0_18px_34px_-14px_rgba(2,6,23,0.35)] ring-1 ring-slate-200/80 motion-reduce:[animation-duration:1ms]`}
          >
            {/* Brand strip along the top edge of the paper. */}
            <div aria-hidden className="-mx-5 -mt-5 mb-4 h-1 bg-brand-gradient" />
            <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-brand-700">
              <CircleCheck className="size-3.5" aria-hidden />
              PAYMENT SUCCESSFUL
            </p>
            <p className="mt-1 text-[28px] font-bold leading-tight tabular-nums">
              {formatPrice(receipt.totalCents)}
            </p>
            <p className="mt-1.5 text-[11px] uppercase tracking-wide text-slate-500">
              {receiptDate(receipt.paidAt)} | Paid
            </p>

            <Dashed />
            <ul className="space-y-2 text-[12px] leading-snug">
              {receipt.lines.map((line) => (
                <li key={line.courseSlug}>
                  <Row label={`1X ${line.title}`} value={formatPrice(line.basePriceCents)} />
                  {line.addons.map((addon) => (
                    <Row
                      key={addon.code}
                      label={`+ ${addon.label}`}
                      value={formatPrice(addon.priceCents)}
                      muted
                    />
                  ))}
                </li>
              ))}
            </ul>

            <Dashed />
            <div className="space-y-1 text-[12px]">
              <Row label="Subtotal" value={formatPrice(receipt.subtotalCents)} />
              {receipt.discountCents > 0 && (
                <Row
                  label={`Discount${receipt.couponCode ? ` (${receipt.couponCode})` : ""}`}
                  value={`-${formatPrice(receipt.discountCents)}`}
                />
              )}
            </div>
            <div className="mt-2.5 flex justify-between gap-4 rounded-lg bg-navy-950 px-3 py-2 text-[13.5px] font-bold text-white">
              <span>TOTAL</span>
              <span className="tabular-nums">{formatPrice(receipt.totalCents)}</span>
            </div>

            <Dashed />
            <div className="space-y-0.5 text-[10.5px] text-slate-500">
              <Row label="Order ref" value={orderRef(receipt.orderId)} />
              {receipt.captureId && <Row label="Payment ref" value={receipt.captureId} />}
            </div>

            <p className="mt-4 text-center text-[11px] font-bold tracking-[0.18em] text-brand-700">
              THANK YOU FOR LEARNING!
            </p>
            {/* Scalloped, torn bottom edge. */}
            <div
              aria-hidden
              className="-mx-5 mt-3 h-3 translate-y-2 bg-[radial-gradient(circle_at_7px_100%,transparent_6px,white_6.5px)] bg-[length:14px_12px]"
            />
          </div>
        </div>

        {/* ---------------------------------------------------- actions */}
        <div
          className={`mt-4 transition-all duration-500 ${
            printed ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
          }`}
          aria-hidden={!printed}
        >
          {error && (
            <p role="alert" className="mb-3 text-center text-[13px] font-semibold text-red-700">
              {error}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => ref.current?.close()}
              tabIndex={printed ? 0 : -1}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-navy-950/15 bg-white px-5 py-3 text-[14px] font-semibold text-navy-950 transition-colors duration-200 hover:border-navy-950"
            >
              <X className="size-4" aria-hidden />
              Close
            </button>
            <button
              type="button"
              onClick={download}
              disabled={downloading}
              tabIndex={printed ? 0 : -1}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-navy-950 px-5 py-3 text-[14px] font-bold text-white shadow-lg shadow-navy-950/25 transition-colors duration-200 hover:bg-brand-700 disabled:cursor-wait disabled:opacity-70"
            >
              {downloading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Download className="size-4" aria-hidden />
              )}
              Download
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}

function Dashed() {
  return <hr className="my-3 border-0 border-t border-dashed border-slate-400/70" />;
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${muted ? "mt-1 pl-3 text-slate-500" : ""}`}>
      <span className="min-w-0 text-left [overflow-wrap:anywhere]">{label}</span>
      <span className="shrink-0 tabular-nums">{value}</span>
    </div>
  );
}
