"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Info, Loader2, Lock, Pencil, Tag, X } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { COUNTRIES } from "@/lib/data/countries";
import { Field, Input, Select } from "@/components/form";
import { PaypalCheckout } from "@/components/paypal-checkout";
import { PageBanner, PillLink } from "@/components/ui";
import { formatPrice } from "@/lib/utils";
import { cartLineTotalCents } from "@/lib/types";
import type { Profile } from "@/lib/account";
import type { ReceiptData } from "@/lib/receipt";
import { updateProfile } from "@/app/account/actions";
import { ThankYou } from "./thank-you";

export type BillingProfile = Pick<
  Profile,
  | "first_name"
  | "last_name"
  | "phone"
  | "company"
  | "address1"
  | "address2"
  | "city"
  | "zip"
  | "ptin"
  | "country"
  | "region"
>;

/** Fields PayPal checkout won't start without (matches the form's `required`). */
const REQUIRED: { key: keyof BillingProfile; label: string }[] = [
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "phone", label: "Telephone" },
  { key: "address1", label: "Address 1" },
  { key: "city", label: "City" },
  { key: "zip", label: "ZIP code" },
  { key: "country", label: "Country" },
  { key: "region", label: "Region / State" },
];

export function CheckoutClient({
  paypalClientId,
  accountEmail,
  profile,
}: {
  paypalClientId: string;
  /** From the session. The order is attributed to this account either way. */
  accountEmail: string;
  /** Saved details (from registration or My Account) that pre-fill the form. */
  profile: BillingProfile | null;
}) {
  const { lines, subtotalCents, clear } = useCart();
  const formRef = useRef<HTMLFormElement>(null);

  const v = (key: keyof BillingProfile) => profile?.[key]?.trim() ?? "";
  const missing = REQUIRED.filter((f) => !v(f.key));
  // A complete profile shows as a summary card; otherwise the form opens.
  const [editing, setEditing] = useState(missing.length > 0);
  const [saving, startSaving] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const router = useRouter();
  // Keep a saved country selectable even if its spelling isn't in our list.
  const savedCountry = v("country");
  const countries: readonly string[] =
    savedCountry && !(COUNTRIES as readonly string[]).includes(savedCountry)
      ? [savedCountry, ...COUNTRIES]
      : COUNTRIES;
  const [paid, setPaid] = useState<ReceiptData | null>(null);

  const [couponInput, setCouponInput] = useState("");
  const [applying, setApplying] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applied, setApplied] = useState<{ code: string; discountCents: number } | null>(
    null,
  );

  const totalCents = Math.max(0, subtotalCents - (applied?.discountCents ?? 0));

  async function applyCoupon() {
    const code = couponInput.trim();
    if (!code) return;
    setApplying(true);
    setCouponError(null);
    try {
      const res = await fetch("/api/coupon/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotalCents }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "That coupon isn't valid.");
      setApplied({ code: body.code, discountCents: body.discountCents });
    } catch (err) {
      setApplied(null);
      setCouponError(err instanceof Error ? err.message : "That coupon isn't valid.");
    } finally {
      setApplying(false);
    }
  }

  function removeCoupon() {
    setApplied(null);
    setCouponInput("");
    setCouponError(null);
  }

  /**
   * Called by the PayPal SDK before it opens the payment window. Returning null
   * aborts the payment, so the browser's own validation gates it.
   */
  function getBilling() {
    const form = formRef.current;
    if (!form) return null;
    if (!form.checkValidity()) {
      // Hidden fields can't show the browser's hints, so open the form first.
      if (editing) form.reportValidity();
      else setEditing(true);
      return null;
    }
    return Object.fromEntries(
      new FormData(form).entries(),
    ) as Record<string, string>;
  }

  /** Saves the edited details to the profile and returns to the summary. */
  function saveDetails() {
    const form = formRef.current;
    if (!form || !form.reportValidity()) return;
    setSaveError(null);
    const data = new FormData(form);
    startSaving(async () => {
      const result = await updateProfile({ error: null, done: false }, data);
      if (result.error) {
        setSaveError(result.error);
        return;
      }
      // Refresh so the summary card shows the newly saved details.
      startSaving(() => {
        router.refresh();
        setEditing(false);
        setSaved(true);
      });
    });
  }

  /** Throws away unsaved edits (back to the saved values) and closes the form. */
  function cancelEdit() {
    formRef.current?.reset();
    setSaveError(null);
    setEditing(false);
  }

  function handlePaid(result: {
    orderId: string;
    captureId: string | null;
    amountCents?: number;
  }) {
    // Snapshot the cart for the receipt before it is cleared.
    const form = formRef.current ? new FormData(formRef.current) : null;
    const name = [form?.get("first_name"), form?.get("last_name")]
      .map((part) => String(part ?? "").trim())
      .filter(Boolean)
      .join(" ");
    setPaid({
      orderId: result.orderId,
      captureId: result.captureId,
      paidAt: new Date().toISOString(),
      name,
      email: accountEmail,
      lines,
      subtotalCents,
      discountCents: applied?.discountCents ?? 0,
      couponCode: applied?.code ?? null,
      // What PayPal actually captured is the truth for the total.
      totalCents: result.amountCents ?? totalCents,
    });
    clear();
    // The thank-you page replaces the checkout; start it from the top.
    window.scrollTo({ top: 0 });
  }

  if (paid) return <ThankYou receipt={paid} />;

  return (
    <>
      <PageBanner
        title="Checkout"
        crumb={[
          { href: "/", label: "Home" },
          { href: "/cart", label: "Cart" },
          { href: "/checkout", label: "Checkout" },
        ]}
      />

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          {lines.length === 0 ? (
            <div className="mx-auto max-w-md rounded-3xl border border-slate-200 px-8 py-16 text-center">
              <h2 className="text-xl font-extrabold text-navy-950">
                Nothing to check out
              </h2>
              <p className="mt-2 text-[15px] text-ink-muted">
                Add a course to your cart first.
              </p>
              <div className="mt-8 flex justify-center">
                <PillLink href="/courses">Browse Courses</PillLink>
              </div>
            </div>
          ) : (
            <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
              <form ref={formRef} onSubmit={(e) => e.preventDefault()}>
                {!editing && (
                  <BillingSummary
                    profile={profile}
                    email={accountEmail}
                    saved={saved}
                    onEdit={() => {
                      setSaved(false);
                      setEditing(true);
                    }}
                  />
                )}

                {/* The fields stay in the form while the summary shows, so the
                    saved details are what get sent to PayPal. */}
                <div hidden={!editing}>
                  {missing.length > 0 && (
                    <p className="mb-8 flex items-start gap-3 rounded-xl bg-amber-50 px-4 py-3 text-[13.5px] leading-relaxed text-amber-900">
                      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                      {missing.length === REQUIRED.length
                        ? "Fill in your details once and we'll save them to your profile for next time."
                        : `Please add: ${missing.map((f) => f.label).join(", ")}. We'll save it to your profile.`}
                    </p>
                  )}

                  <h2 className="text-xl font-extrabold text-navy-950">Your Details</h2>
                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <Field label="First Name" htmlFor="first_name" required>
                      <Input id="first_name" name="first_name" required autoComplete="given-name" defaultValue={v("first_name")} />
                    </Field>
                    <Field label="Last Name" htmlFor="last_name" required>
                      <Input id="last_name" name="last_name" required autoComplete="family-name" defaultValue={v("last_name")} />
                    </Field>
                    <Field
                      label="E-Mail"
                      htmlFor="email"
                      required
                      hint="Your account email — we send access details here."
                    >
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        defaultValue={accountEmail}
                        readOnly
                        className="bg-slate-50 text-slate-600"
                      />
                    </Field>
                    <Field label="Telephone" htmlFor="phone" required>
                      <Input id="phone" name="phone" type="tel" required autoComplete="tel" defaultValue={v("phone")} />
                    </Field>
                  </div>

                  <h2 className="mt-12 text-xl font-extrabold text-navy-950">
                    Your Address
                  </h2>
                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <Field label="Company" htmlFor="company" className="sm:col-span-2">
                      <Input id="company" name="company" autoComplete="organization" defaultValue={v("company")} />
                    </Field>
                    <Field label="Address 1" htmlFor="address1" required className="sm:col-span-2">
                      <Input id="address1" name="address1" required autoComplete="address-line1" defaultValue={v("address1")} />
                    </Field>
                    <Field label="Address 2" htmlFor="address2" className="sm:col-span-2">
                      <Input id="address2" name="address2" autoComplete="address-line2" defaultValue={v("address2")} />
                    </Field>
                    <Field label="City" htmlFor="city" required>
                      <Input id="city" name="city" required autoComplete="address-level2" defaultValue={v("city")} />
                    </Field>
                    <Field label="ZIP code" htmlFor="zip" required>
                      <Input id="zip" name="zip" required autoComplete="postal-code" defaultValue={v("zip")} />
                    </Field>
                    <Field
                      label="PTIN Number"
                      htmlFor="ptin"
                      hint="Required if you need IRS credits."
                    >
                      <Input id="ptin" name="ptin" defaultValue={v("ptin")} />
                    </Field>
                    <Field label="Country" htmlFor="country" required>
                      <Select id="country" name="country" required defaultValue={v("country")} autoComplete="country-name">
                        <option value="" disabled>
                          --select country--
                        </option>
                        {countries.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Region / State" htmlFor="region" required className="sm:col-span-2">
                      <Input id="region" name="region" required autoComplete="address-level1" defaultValue={v("region")} />
                    </Field>
                  </div>

                  <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-6">
                    {saveError && (
                      <p role="alert" className="mr-auto text-[13.5px] font-semibold text-red-700">
                        {saveError}
                      </p>
                    )}
                    {missing.length === 0 && (
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={saving}
                        className="cursor-pointer rounded-full px-5 py-2.5 text-[14px] font-semibold text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-navy-950 disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={saveDetails}
                      disabled={saving}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-navy-950 px-6 py-2.5 text-[14px] font-semibold text-white transition-colors duration-200 hover:bg-brand-700 disabled:cursor-wait disabled:opacity-70"
                    >
                      {saving ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                      ) : (
                        <Check className="size-4" aria-hidden />
                      )}
                      Save details
                    </button>
                  </div>
                </div>
              </form>

              <aside className="h-fit rounded-3xl bg-cream p-7 lg:sticky lg:top-28">
                <h2 className="text-lg font-extrabold text-navy-950">Order Summary</h2>
                <ul className="mt-6 space-y-4 border-b border-navy-950/10 pb-6">
                  {lines.map((line) => (
                    <li key={line.courseSlug} className="flex justify-between gap-4">
                      <div>
                        <Link
                          href={`/courses/${line.courseSlug}`}
                          className="text-[14px] font-semibold leading-snug text-navy-950 hover:text-brand-700"
                        >
                          {line.title}
                        </Link>
                        <p className="mt-0.5 text-[12.5px] text-ink-muted">
                          Self-Study ({formatPrice(line.basePriceCents)})
                        </p>
                        {line.addons.map((addon) => (
                          <p
                            key={addon.code}
                            className="mt-0.5 pl-3 text-[12.5px] text-ink-muted"
                          >
                            + {addon.label} ({formatPrice(addon.priceCents)})
                          </p>
                        ))}
                      </div>
                      <p className="shrink-0 text-[14px] font-bold tabular-nums text-navy-950">
                        {formatPrice(cartLineTotalCents(line))}
                      </p>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  {applied ? (
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-brand-50 px-4 py-2.5">
                      <p className="flex items-center gap-1.5 text-[13px] font-bold text-brand-700">
                        <Tag className="size-3.5" aria-hidden />
                        {applied.code} applied
                      </p>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        aria-label="Remove coupon"
                        className="cursor-pointer text-brand-700 hover:text-brand-900"
                      >
                        <X className="size-4" aria-hidden />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex gap-2">
                        <input
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value)}
                          placeholder="Coupon code"
                          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[14px] uppercase text-navy-950 outline-none transition-colors duration-200 focus:border-brand-500"
                        />
                        <button
                          type="button"
                          onClick={applyCoupon}
                          disabled={applying || !couponInput.trim()}
                          className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-300 px-4 text-[13.5px] font-bold text-navy-950 transition-colors duration-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {applying && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
                          Apply
                        </button>
                      </div>
                      {couponError && (
                        <p className="mt-1.5 text-[12.5px] text-red-700">{couponError}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 space-y-2 border-t border-navy-950/10 pt-6">
                  <div className="flex items-baseline justify-between">
                    <p className="text-[14px] text-ink-muted">Subtotal</p>
                    <p className="text-[14px] font-semibold tabular-nums text-navy-950">
                      {formatPrice(subtotalCents)}
                    </p>
                  </div>
                  {applied && (
                    <div className="flex items-baseline justify-between">
                      <p className="text-[14px] text-brand-700">Discount</p>
                      <p className="text-[14px] font-semibold tabular-nums text-brand-700">
                        −{formatPrice(applied.discountCents)}
                      </p>
                    </div>
                  )}
                  <div className="flex items-baseline justify-between">
                    <p className="text-base font-bold text-navy-950">Total</p>
                    <p className="text-2xl font-extrabold tabular-nums text-navy-950">
                      {formatPrice(totalCents)}
                    </p>
                  </div>
                </div>

                <div className="mt-8">
                  {paypalClientId ? (
                    <PaypalCheckout
                      clientId={paypalClientId}
                      lines={lines}
                      couponCode={applied?.code}
                      getBilling={getBilling}
                      onPaid={handlePaid}
                    />
                  ) : (
                    <p className="flex items-start gap-3 rounded-xl bg-amber-50 px-4 py-3 text-[13.5px] leading-relaxed text-amber-900">
                      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                      Payments aren&rsquo;t configured yet. Add your PayPal credentials
                      to <code className="font-mono font-semibold">.env.local</code>.
                    </p>
                  )}
                </div>

                <p className="mt-5 flex items-center justify-center gap-1.5 text-[12.5px] text-slate-500">
                  <Lock className="size-3.5" aria-hidden />
                  Payments are processed securely by PayPal
                </p>
              </aside>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

/** Read-only view of the saved billing details, with an Edit button. */
function BillingSummary({
  profile,
  email,
  saved,
  onEdit,
}: {
  profile: BillingProfile | null;
  email: string;
  /** Just saved from the edit form: confirm it. */
  saved: boolean;
  onEdit: () => void;
}) {
  const t = (value: string | null | undefined) => value?.trim() ?? "";
  const name = [t(profile?.first_name), t(profile?.last_name)].filter(Boolean).join(" ");
  const street = [t(profile?.address1), t(profile?.address2)].filter(Boolean).join(", ");
  const place = [t(profile?.city), [t(profile?.region), t(profile?.zip)].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-navy-950">Billing Details</h2>
          {saved ? (
            <p role="status" className="mt-1 flex items-center gap-1.5 text-left text-[13.5px] font-semibold text-brand-700">
              <Check className="size-4" aria-hidden />
              Saved to your profile.
            </p>
          ) : (
            <p className="mt-1 text-left text-[13.5px] text-ink-muted">
              From your profile. Edit them if anything has changed.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-slate-300 px-4 py-2 text-[13.5px] font-semibold text-navy-950 transition-colors duration-200 hover:border-navy-950"
        >
          <Pencil className="size-3.5" aria-hidden />
          Edit
        </button>
      </div>
      <dl className="mt-5 divide-y divide-slate-100 text-[14px]">
        <SummaryRow label="Name" value={name} />
        <SummaryRow label="Email" value={email} />
        <SummaryRow label="Phone" value={t(profile?.phone)} />
        {t(profile?.company) && <SummaryRow label="Company" value={t(profile?.company)} />}
        <SummaryRow
          label="Address"
          value={[street, place, t(profile?.country)].filter(Boolean).join("\n")}
        />
        <SummaryRow label="PTIN" value={t(profile?.ptin)} />
      </dl>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[90px_minmax(0,1fr)] gap-3 py-2.5 first:pt-0 last:pb-0">
      <dt className="text-slate-500">{label}</dt>
      <dd
        className={`whitespace-pre-line [overflow-wrap:anywhere] ${
          value ? "font-medium text-navy-950" : "text-slate-400"
        }`}
      >
        {value || "Not added"}
      </dd>
    </div>
  );
}
