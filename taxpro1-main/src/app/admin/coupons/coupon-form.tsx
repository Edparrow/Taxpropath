"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { saveCoupon } from "./actions";

export type CouponFormValues = {
  id: string | null;
  code: string;
  description: string;
  discountType: "fixed" | "percent";
  discountValue: string; // dollars if fixed, 1-100 if percent
  minOrder: string; // dollars
  maxRedemptions: string;
  startsAt: string; // datetime-local
  expiresAt: string; // datetime-local
  isActive: boolean;
};

const INPUT =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[14px] text-navy-950 transition-colors duration-200 outline-none focus:border-brand-500";

export function CouponForm({ initial }: { initial: CouponFormValues }) {
  const action = saveCoupon.bind(null, initial.id);
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="max-w-3xl">
      {state?.error && (
        <p
          role="alert"
          className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-[14px] font-medium text-red-800"
        >
          {state.error}
        </p>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Code" required>
            <input
              name="code"
              defaultValue={initial.code}
              required
              placeholder="WELCOME20"
              className={`${INPUT} font-mono uppercase`}
            />
          </Field>
          <Field label="Active" >
            <label className="flex h-full items-center gap-2.5 text-[14px] font-semibold text-navy-950">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={initial.isActive}
                className="size-4 accent-brand-600"
              />
              Coupon can be redeemed
            </label>
          </Field>

          <Field label="Description" className="sm:col-span-2">
            <input
              name="description"
              defaultValue={initial.description}
              placeholder="Shown to editors only, not to customers"
              className={INPUT}
            />
          </Field>

          <Field label="Discount type">
            <select name="discount_type" defaultValue={initial.discountType} className={`${INPUT} cursor-pointer`}>
              <option value="fixed">Fixed amount ($)</option>
              <option value="percent">Percent (%)</option>
            </select>
          </Field>
          <Field label="Discount value" required hint="Dollars for fixed, 1–100 for percent.">
            <input
              type="number"
              step="0.01"
              min="0"
              name="discount_value"
              defaultValue={initial.discountValue}
              required
              className={INPUT}
            />
          </Field>

          <Field label="Minimum order ($)" hint="0 for no minimum.">
            <input
              type="number"
              step="0.01"
              min="0"
              name="min_order_cents"
              defaultValue={initial.minOrder}
              className={INPUT}
            />
          </Field>
          <Field label="Max redemptions" hint="Blank for unlimited.">
            <input
              type="number"
              min="1"
              name="max_redemptions"
              defaultValue={initial.maxRedemptions}
              className={INPUT}
            />
          </Field>

          <Field label="Starts" hint="Blank for immediately.">
            <input
              type="datetime-local"
              name="starts_at"
              defaultValue={initial.startsAt}
              className={INPUT}
            />
          </Field>
          <Field label="Expires" hint="Blank for never.">
            <input
              type="datetime-local"
              name="expires_at"
              defaultValue={initial.expiresAt}
              className={INPUT}
            />
          </Field>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Submit isNew={!initial.id} />
        <Link
          href="/admin/coupons"
          className="rounded-full border border-slate-300 px-5 py-2.5 text-[14px] font-semibold text-navy-950 transition-colors duration-200 hover:bg-slate-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Submit({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex cursor-pointer items-center gap-2 rounded-full bg-brand-600 px-6 py-2.5 text-[14px] font-bold text-white transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {pending ? "Saving…" : isNew ? "Create coupon" : "Save changes"}
    </button>
  );
}

function Field({
  label,
  hint,
  required,
  className = "",
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[13px] font-bold text-navy-950">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[12.5px] text-ink-muted">{hint}</span>}
    </label>
  );
}
