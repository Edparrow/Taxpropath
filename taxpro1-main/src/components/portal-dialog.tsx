"use client";

import { useEffect, useRef } from "react";
import { ExternalLink, PartyPopper, X } from "lucide-react";
import { PORTAL_URL } from "@/lib/portal";

/**
 * Shown once payment settles: the pop-up that hands the customer over to the
 * portal at portal.taxpropath.com, where their course, materials and
 * certificates live. The same button also sits in the header while signed in.
 */
export function PortalDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-auto w-[min(24rem,calc(100vw-2rem))] rounded-3xl p-0 shadow-2xl backdrop:bg-navy-950/50 backdrop:backdrop-blur-sm"
    >
      <div className="p-7 text-center">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 cursor-pointer rounded-full p-1.5 text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-navy-950"
        >
          <X className="size-5" aria-hidden />
        </button>

        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-50">
          <PartyPopper className="size-7 text-brand-600" aria-hidden />
        </span>
        <h2 className="mt-5 text-xl font-extrabold text-navy-950">
          You&rsquo;re all set!
        </h2>
        <p className="mt-2 text-[14.5px] leading-relaxed text-ink-muted">
          Your course is ready in your portal — sign in with your purchase email
          to start watching, download materials, and collect certificates.
        </p>

        <a
          href={PORTAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand-gradient py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-600/25 transition-transform duration-200 hover:-translate-y-0.5"
        >
          Open My Portal
          <ExternalLink className="size-4" aria-hidden />
        </a>
      </div>
    </dialog>
  );
}
