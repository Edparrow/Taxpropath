"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, Loader2, Pencil, Trash2, X } from "lucide-react";
import { deleteRecord, togglePublished } from "./actions";

const BUTTON =
  "flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-[13px] font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60";

/** Edit / publish / delete controls for one row of a content list. */
export function RowActions({
  resourceSlug,
  recordId,
  label,
  isPublished,
}: {
  resourceSlug: string;
  recordId: string;
  label: string;
  isPublished: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(work: () => Promise<{ error: string } | void>) {
    setError(null);
    startTransition(async () => {
      const result = await work();
      if (result?.error) setError(result.error);
    });
  }

  if (confirming) {
    return (
      <div className="flex items-center justify-end gap-1.5">
        <span className="text-[12.5px] font-semibold text-red-700">Delete?</span>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => deleteRecord(resourceSlug, recordId))}
          className="cursor-pointer rounded-lg bg-red-600 px-3 py-1.5 text-[13px] font-bold text-white transition-colors duration-200 hover:bg-red-700 disabled:opacity-60"
        >
          {pending ? "Deleting…" : "Yes"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className={`${BUTTON} text-navy-950 hover:bg-slate-50`}
        >
          No
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center justify-end gap-2">
        <Link
          href={`/admin/content/${resourceSlug}/${recordId}`}
          className={`${BUTTON} text-navy-950 hover:bg-slate-50`}
        >
          <Pencil className="size-3.5" aria-hidden />
          Edit
        </Link>

        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(() => togglePublished(resourceSlug, recordId, !isPublished))
          }
          aria-label={
            isPublished ? `Unpublish ${label}` : `Publish ${label}`
          }
          className={`${BUTTON} ${
            isPublished
              ? "text-brand-700 hover:bg-brand-50"
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : isPublished ? (
            <Check className="size-3.5" aria-hidden />
          ) : (
            <X className="size-3.5" aria-hidden />
          )}
          {isPublished ? "Live" : "Hidden"}
        </button>

        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label={`Delete ${label}`}
          className={`${BUTTON} text-red-700 hover:border-red-300 hover:bg-red-50`}
        >
          <Trash2 className="size-3.5" aria-hidden />
        </button>
      </div>

      {error && (
        <p role="alert" className="text-[12px] font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
