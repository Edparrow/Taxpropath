"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { ADMIN_SECTIONS, type Permissions } from "@/lib/admin/permissions";
import type { AccessState } from "./actions";

export type AccessFormValues = {
  name: string;
  email: string;
  role: string;
  isSuper: boolean;
  isActive: boolean;
  permissions: Permissions;
};

const INPUT =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[14px] text-navy-950 outline-none transition-colors duration-200 focus:border-brand-500 disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

export function AccessForm({
  initial,
  isNew,
  action,
}: {
  initial: AccessFormValues;
  isNew: boolean;
  action: (prev: AccessState, form: FormData) => Promise<AccessState>;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  const [isSuper, setIsSuper] = useState(initial.isSuper);

  const groups = [...new Set(ADMIN_SECTIONS.map((s) => s.group))];

  return (
    <form action={formAction} className="space-y-6 pb-24">
      {state.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-[14px] font-medium text-red-800">
          {state.error}
        </p>
      )}

      <div className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 md:grid-cols-2 dark:border-slate-800 dark:bg-slate-900">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-bold text-navy-950 dark:text-slate-100">Name *</span>
          <input name="name" defaultValue={initial.name} required className={INPUT} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-bold text-navy-950 dark:text-slate-100">Email (login) *</span>
          <input
            name="email"
            type="email"
            defaultValue={initial.email}
            required={isNew}
            disabled={!isNew}
            className={INPUT}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-bold text-navy-950 dark:text-slate-100">Role</span>
          <input name="role" list="admin-roles" defaultValue={initial.role} placeholder="e.g. Sales, Support" className={INPUT} />
          <datalist id="admin-roles">
            {["Manager", "Sales", "Support", "Content Editor", "Accounts"].map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-bold text-navy-950 dark:text-slate-100">
            {isNew ? "Password *" : "New password"}
          </span>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required={isNew}
            minLength={8}
            placeholder={isNew ? "8+ characters, a letter and a number" : "Leave empty to keep"}
            className={INPUT}
          />
        </label>
        <div className="flex flex-wrap gap-6 md:col-span-2">
          <label className="flex cursor-pointer items-center gap-2.5 text-[14px] font-semibold text-navy-950 dark:text-slate-100">
            <input type="checkbox" name="is_active" defaultChecked={initial.isActive} className="size-4 accent-brand-600" />
            Active (can sign in)
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 text-[14px] font-semibold text-navy-950 dark:text-slate-100">
            <input
              type="checkbox"
              name="is_super"
              checked={isSuper}
              onChange={(e) => setIsSuper(e.target.checked)}
              className="size-4 accent-brand-600"
            />
            Super Admin (everything, including managing admins)
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-[15px] font-extrabold text-navy-950 dark:text-white">Access Level</h2>
        <p className="mt-1 text-[13px] text-ink-muted">
          {isSuper
            ? "A Super Admin has full access to every section."
            : "View = see lists, details and downloads. Edit = view plus create, change, delete and sync."}
        </p>

        {!isSuper && (
          <div className="mt-5 space-y-6">
            {groups.map((group) => (
              <div key={group}>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">{group}</p>
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                  {ADMIN_SECTIONS.filter((s) => s.group === group).map((section) => {
                    const current = initial.permissions[section.key] ?? "none";
                    const levels = "viewOnly" in section && section.viewOnly
                      ? (["none", "view"] as const)
                      : (["none", "view", "edit"] as const);
                    return (
                      <fieldset key={section.key} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                        <legend className="sr-only">{section.label}</legend>
                        <span className="text-[14px] font-semibold text-navy-950 dark:text-slate-100">{section.label}</span>
                        <span className="flex gap-4">
                          {levels.map((level) => (
                            <label key={level} className="flex cursor-pointer items-center gap-1.5 text-[13px] text-ink-muted">
                              <input
                                type="radio"
                                name={`perm_${section.key}`}
                                value={level}
                                defaultChecked={current === level}
                                className="size-4 accent-brand-600"
                              />
                              {level === "none" ? "No access" : level === "view" ? "View" : "Edit"}
                            </label>
                          ))}
                        </span>
                      </fieldset>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 flex items-center gap-3 border-t border-slate-200 bg-cream/95 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <button
          type="submit"
          disabled={pending}
          className="flex cursor-pointer items-center gap-2 rounded-full bg-brand-gradient shadow-md shadow-brand-600/20 px-7 py-3 text-[14px] font-bold text-white transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {pending ? "Saving…" : isNew ? "Create admin" : "Save changes"}
        </button>
        <Link href="/admin/access" className="rounded-full px-5 py-3 text-[14px] font-semibold text-ink-muted hover:text-navy-950">
          Cancel
        </Link>
      </div>
    </form>
  );
}
