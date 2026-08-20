"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteWebinar } from "./actions";

/**
 * Deleting a webinar also removes its pricing rows via cascade, so it gets an
 * explicit confirmation step rather than a single click.
 */
export function DeleteWebinarButton({ id, title }: { id: string; title: string }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={`Delete ${title}`}
        className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-[13px] font-semibold text-red-700 transition-colors duration-200 hover:border-red-300 hover:bg-red-50"
      >
        <Trash2 className="size-3.5" aria-hidden />
        Delete
      </button>
    );
  }

  return (
    <form action={deleteWebinar} className="flex items-center gap-1.5">
      <input type="hidden" name="id" value={id} />
      <span className="text-[12.5px] font-semibold text-red-700">Sure?</span>
      <button
        type="submit"
        className="cursor-pointer rounded-lg bg-red-600 px-3 py-1.5 text-[13px] font-bold text-white transition-colors duration-200 hover:bg-red-700"
      >
        Delete
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-[13px] font-semibold text-navy-950 transition-colors duration-200 hover:bg-slate-50"
      >
        Cancel
      </button>
    </form>
  );
}
