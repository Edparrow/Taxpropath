"use client";

import { useActionState } from "react";
import { Loader2, Lock, Mail } from "lucide-react";
import { adminLogin, type LoginState } from "./actions";

const INITIAL: LoginState = { error: null };

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(adminLogin, INITIAL);

  return (
    <form action={action} className="mt-8 space-y-4">
      {state.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-[13.5px] font-medium text-red-800">
          {state.error}
        </p>
      )}

      <label className="block">
        <span className="mb-1.5 block text-[13px] font-bold text-navy-950">Email</span>
        <span className="relative block">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            name="email"
            type="email"
            required
            autoComplete="username"
            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3.5 text-[14px] text-navy-950 outline-none transition-colors duration-200 focus:border-brand-500"
          />
        </span>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[13px] font-bold text-navy-950">Password</span>
        <span className="relative block">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3.5 text-[14px] text-navy-950 outline-none transition-colors duration-200 focus:border-brand-500"
          />
        </span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-brand-gradient py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-600/25 transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
