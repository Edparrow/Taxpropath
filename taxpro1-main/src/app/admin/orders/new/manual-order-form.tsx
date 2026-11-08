"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { COUNTRIES } from "@/lib/data/countries";
import { formatPrice } from "@/lib/utils";
import { createManualOrder, type ManualOrderState } from "../actions";

export type ManualCourse = {
  id: string;
  title: string;
  prices: { code: string; label: string; cents: number }[];
};

/** Current values when editing an order. */
export type OrderInitial = {
  billing: Record<string, string>;
  courseId: string;
  addons: string[];
  amount: string;
  orderDate: string;
  transId: string;
  couponCode: string;
  remarks: string;
};

const INPUT =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[14px] text-navy-950 outline-none transition-colors duration-200 focus:border-brand-500 disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`block ${wide ? "md:col-span-2" : ""}`}>
      <span className="mb-1.5 block text-[13px] font-bold text-navy-950 dark:text-slate-100">{label}</span>
      {children}
    </label>
  );
}

/**
 * Manual order form. Also edits orders: `mode="edit-manual"` edits everything,
 * `mode="edit-paypal"` only the customer details and remarks (a PayPal order's
 * items and amount are what was actually paid).
 */
export function ManualOrderForm({
  courses,
  initial,
  action = createManualOrder,
  mode = "create",
}: {
  courses: ManualCourse[];
  initial?: OrderInitial;
  action?: (prev: ManualOrderState, form: FormData) => Promise<ManualOrderState>;
  mode?: "create" | "edit-manual" | "edit-paypal";
}) {
  const [state, formAction, pending] = useActionState<ManualOrderState, FormData>(action, { error: null });
  const [courseId, setCourseId] = useState(initial?.courseId ?? "");
  const [addons, setAddons] = useState<string[]>(initial?.addons ?? []);
  const lockedItems = mode === "edit-paypal";
  const b = (key: string) => initial?.billing[key] ?? "";

  const course = courses.find((c) => c.id === courseId);
  const base = course?.prices.find((p) => p.code === "SELF_STUDY");
  const addonPrices = course?.prices.filter((p) => p.code !== "SELF_STUDY") ?? [];
  const totalCents =
    (base?.cents ?? 0) + addonPrices.filter((p) => addons.includes(p.code)).reduce((s, p) => s + p.cents, 0);

  return (
    <form action={formAction} className="space-y-6 pb-24">
      {state.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-[14px] font-medium text-red-800">
          {state.error}
        </p>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-5 text-[15px] font-extrabold text-navy-950 dark:text-white">Course</h2>
        {lockedItems && (
          <p className="mb-5 rounded-lg bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
            This order was paid through PayPal, so its course, price and payment details can&rsquo;t change. You can
            correct the customer&rsquo;s details and the remarks.
          </p>
        )}
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Course *" wide>
            <select
              name="course_id"
              required={!lockedItems}
              disabled={lockedItems}
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value);
                setAddons([]);
              }}
              className={INPUT}
            >
              <option value="">Select a course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </Field>

          {course && (
            <div className="space-y-2 md:col-span-2">
              <p className="text-[14px] text-navy-950 dark:text-slate-100">
                Self-Study: <strong>{base ? formatPrice(base.cents) : "no price set"}</strong>
              </p>
              {addonPrices.map((p) => (
                <label key={p.code} className="flex cursor-pointer items-center gap-2.5 text-[14px] text-navy-950 dark:text-slate-100">
                  <input
                    type="checkbox"
                    name="addons"
                    value={p.code}
                    disabled={lockedItems}
                    checked={addons.includes(p.code)}
                    onChange={(e) =>
                      setAddons((prev) => (e.target.checked ? [...prev, p.code] : prev.filter((c) => c !== p.code)))
                    }
                    className="size-4 accent-brand-600"
                  />
                  {p.label} (+{formatPrice(p.cents)})
                </label>
              ))}
              <p className="pt-1 text-[14px] font-bold text-navy-950 dark:text-white">
                Course price: {formatPrice(totalCents)}
              </p>
            </div>
          )}

          <Field label="Amount charged (USD)">
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0"
              disabled={lockedItems}
              defaultValue={initial?.amount}
              max={totalCents ? totalCents / 100 : undefined}
              placeholder={course ? (totalCents / 100).toFixed(2) : "Defaults to the course price"}
              className={INPUT}
            />
          </Field>
          <Field label="Order date">
            <input name="order_date" type="datetime-local" disabled={lockedItems} defaultValue={initial?.orderDate} className={INPUT} />
          </Field>
          <Field label="Transaction / payment reference">
            <input name="trans_id" disabled={lockedItems} defaultValue={initial?.transId} placeholder="e.g. bank transfer ref" className={INPUT} />
          </Field>
          <Field label="Coupon code (for records)">
            <input name="coupon_code" disabled={lockedItems} defaultValue={initial?.couponCode} className={INPUT} />
          </Field>
          <Field label="Remarks" wide>
            <textarea name="remarks" rows={3} defaultValue={initial?.remarks} className={INPUT} />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-1 text-[15px] font-extrabold text-navy-950 dark:text-white">Customer</h2>
        <p className="mb-5 text-[13px] text-ink-muted">The portal sign-in uses this email.</p>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="First name *"><input name="first_name" required defaultValue={b("first_name")} className={INPUT} /></Field>
          <Field label="Last name"><input name="last_name" defaultValue={b("last_name")} className={INPUT} /></Field>
          <Field label="Email *"><input name="email" type="email" required defaultValue={b("email")} className={INPUT} /></Field>
          <Field label="Phone"><input name="phone" defaultValue={b("phone")} className={INPUT} /></Field>
          <Field label="PTIN"><input name="ptin" defaultValue={b("ptin")} className={INPUT} /></Field>
          <Field label="Company"><input name="company" defaultValue={b("company")} className={INPUT} /></Field>
          <Field label="Address" wide><input name="address1" defaultValue={b("address1")} className={INPUT} /></Field>
          <Field label="Address line 2" wide><input name="address2" defaultValue={b("address2")} className={INPUT} /></Field>
          <Field label="City"><input name="city" defaultValue={b("city")} className={INPUT} /></Field>
          <Field label="ZIP code"><input name="zip" defaultValue={b("zip")} className={INPUT} /></Field>
          <Field label="Country">
            <select name="country" defaultValue={b("country")} className={INPUT}>
              <option value="">—</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Region / State"><input name="region" defaultValue={b("region")} className={INPUT} /></Field>
        </div>
        {mode === "create" && (
          <label className="mt-6 flex cursor-pointer items-center gap-2.5 text-[14px] font-semibold text-navy-950 dark:text-slate-100">
            <input type="checkbox" name="send_email" defaultChecked className="size-4 accent-brand-600" />
            Email the order confirmation to the customer
          </label>
        )}
      </section>

      <div className="sticky bottom-0 flex items-center gap-3 border-t border-slate-200 bg-cream/95 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <button
          type="submit"
          disabled={pending}
          className="flex cursor-pointer items-center gap-2 rounded-full bg-brand-gradient shadow-md shadow-brand-600/20 px-7 py-3 text-[14px] font-bold text-white transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {pending ? "Saving…" : mode === "create" ? "Create paid order" : "Save changes"}
        </button>
        <Link href="/admin/orders" className="rounded-full px-5 py-3 text-[14px] font-semibold text-ink-muted hover:text-navy-950">
          Cancel
        </Link>
      </div>
    </form>
  );
}
