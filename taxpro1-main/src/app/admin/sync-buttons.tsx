"use client";

import { useState, useTransition } from "react";
import { Loader2, Sheet } from "lucide-react";

type Result = { ok: boolean; message: string };

/**
 * "Sync selected" / "Sync all" to Google Sheets. Rows opt in with a checkbox
 * carrying data-sync={group}; a checkbox's value may hold several ids
 * separated by commas (one customer row covering several orders).
 */
export function SyncButtons({
  group,
  action,
}: {
  group: string;
  action: (ids: string[] | null) => Promise<Result>;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<Result | null>(null);

  function run(all: boolean) {
    let ids: string[] | null = null;
    if (!all) {
      ids = [...document.querySelectorAll<HTMLInputElement>(`input[data-sync="${group}"]:checked`)]
        .flatMap((box) => box.value.split(","))
        .filter(Boolean);
      if (ids.length === 0) {
        setResult({ ok: false, message: "Tick at least one row first." });
        return;
      }
    }
    setResult(null);
    startTransition(async () => setResult(await action(ids)));
  }

  function toggleAll(checked: boolean) {
    document
      .querySelectorAll<HTMLInputElement>(`input[data-sync="${group}"]`)
      .forEach((box) => (box.checked = checked));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-ink-muted">
        <input type="checkbox" onChange={(e) => toggleAll(e.target.checked)} className="size-4 accent-brand-600" />
        Select all
      </label>
      <button
        type="button"
        disabled={pending}
        onClick={() => run(false)}
        className="flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-300 px-4 py-2 text-[13px] font-bold text-navy-950 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-100"
      >
        <Sheet className="size-3.5" aria-hidden />
        Sync selected
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => run(true)}
        className="flex cursor-pointer items-center gap-1.5 rounded-full bg-navy-950 px-4 py-2 text-[13px] font-bold text-white hover:bg-brand-600 disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Sheet className="size-3.5" aria-hidden />}
        Sync all to Google Sheets
      </button>
      {result && (
        <p role="status" className={`text-[13px] font-medium ${result.ok ? "text-brand-700" : "text-red-700"}`}>
          {result.message}
        </p>
      )}
    </div>
  );
}
