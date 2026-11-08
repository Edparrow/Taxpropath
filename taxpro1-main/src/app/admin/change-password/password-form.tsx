"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { changePassword, type PasswordState } from "../account/actions";

const INITIAL: PasswordState = { error: null, done: false };

const INPUT =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[14px] text-navy-950 outline-none transition-colors duration-200 focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, INITIAL);

  return (
    <form action={action} className="max-w-md space-y-5 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      {state.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-[13.5px] font-medium text-red-800">
          {state.error}
        </p>
      )}
      {state.done && (
        <p role="status" className="rounded-lg bg-brand-50 px-4 py-3 text-[13.5px] font-medium text-brand-800">
          Password changed.
        </p>
      )}

      {[
        { name: "current_password", label: "Current password", auto: "current-password" },
        { name: "new_password", label: "New password (8+ characters)", auto: "new-password" },
        { name: "confirm_password", label: "Confirm new password", auto: "new-password" },
      ].map((f) => (
        <label key={f.name} className="block">
          <span className="mb-1.5 block text-[13px] font-bold text-navy-950 dark:text-slate-100">
            {f.label}
          </span>
          <input name={f.name} type="password" required autoComplete={f.auto} className={INPUT} />
        </label>
      ))}

      <button
        type="submit"
        disabled={pending}
        className="flex cursor-pointer items-center gap-2 rounded-full bg-brand-gradient shadow-md shadow-brand-600/20 px-7 py-3 text-[14px] font-bold text-white transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {pending ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}
