"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { FileDown, Loader2, Mail, Pencil, Receipt, Trash2, X } from "lucide-react";
import { deleteOrder, resendConfirmation } from "./actions";

const ICON_BTN =
  "inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-300 p-1.5 text-navy-950 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800";

/**
 * Per-order buttons on Completed Orders: invoice, PDF, edit, resend the
 * confirmation email, and delete — which, as on SkillSync, asks "are you
 * sure?" and then for the admin's own name.
 */
export function OrderRowActions({
  orderId,
  canEdit,
  adminName,
}: {
  orderId: string;
  canEdit: boolean;
  adminName: string;
}) {
  const [step, setStep] = useState<"idle" | "sure" | "name">("idle");
  const [name, setName] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const run = (action: (form: FormData) => Promise<{ ok: boolean; message: string }>, extra: Record<string, string> = {}) =>
    start(async () => {
      const form = new FormData();
      form.set("id", orderId);
      for (const [k, v] of Object.entries(extra)) form.set(k, v);
      const result = await action(form);
      setMessage({ ok: result.ok, text: result.message });
      if (result.ok) setStep("idle");
    });

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex justify-end gap-1.5">
        <Link href={`/admin/orders/${orderId}/invoice`} target="_blank" aria-label="View invoice" title="View invoice" className={ICON_BTN}>
          <Receipt className="size-3.5" aria-hidden />
        </Link>
        <a href={`/admin/orders/${orderId}/invoice/pdf`} aria-label="Download invoice PDF" title="Download invoice PDF" className={ICON_BTN}>
          <FileDown className="size-3.5" aria-hidden />
        </a>
        {canEdit && (
          <>
            <Link href={`/admin/orders/${orderId}/edit`} aria-label="Edit order" title="Edit order" className={ICON_BTN}>
              <Pencil className="size-3.5" aria-hidden />
            </Link>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(resendConfirmation)}
              aria-label="Resend confirmation email"
              title="Resend confirmation email"
              className={ICON_BTN}
            >
              {pending && step === "idle" ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Mail className="size-3.5" aria-hidden />}
            </button>
            <button
              type="button"
              onClick={() => {
                setMessage(null);
                setStep(step === "idle" ? "sure" : "idle");
              }}
              aria-label="Delete order"
              title="Delete order"
              className={`${ICON_BTN} hover:border-red-300 hover:text-red-600`}
            >
              <Trash2 className="size-3.5" aria-hidden />
            </button>
          </>
        )}
      </div>

      {step === "sure" && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-2.5 py-1.5 text-[12.5px] text-red-800">
          Delete this order?
          <button type="button" onClick={() => setStep("name")} className="cursor-pointer font-bold underline">
            Yes
          </button>
          <button type="button" onClick={() => setStep("idle")} aria-label="Cancel" className="cursor-pointer">
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      )}
      {step === "name" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(deleteOrder, { confirm_name: name });
          }}
          className="flex w-60 flex-col gap-1.5 rounded-lg bg-red-50 p-2.5 text-left text-[12px] text-red-800"
        >
          <label htmlFor={`confirm-${orderId}`}>
            Type your name (<strong>{adminName}</strong>) to confirm:
          </label>
          <input
            id={`confirm-${orderId}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="rounded-md border border-red-200 bg-white px-2 py-1 text-[13px] text-navy-950 outline-none focus:border-red-400"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending || !name.trim()}
              className="cursor-pointer rounded-md bg-red-600 px-2.5 py-1 font-bold text-white disabled:opacity-50"
            >
              {pending ? "Deleting…" : "Confirm Delete"}
            </button>
            <button type="button" onClick={() => setStep("idle")} className="cursor-pointer font-semibold">
              Cancel
            </button>
          </div>
        </form>
      )}
      {message && (
        <p role="status" className={`text-[12px] font-semibold ${message.ok ? "text-brand-700" : "text-red-700"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
