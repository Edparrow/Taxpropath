"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ExternalLink, Info, Loader2, Lock, Tag, X } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { COUNTRIES } from "@/lib/data/countries";
import { Field, Input, Select } from "@/components/form";
import { PaypalCheckout } from "@/components/paypal-checkout";
import { PortalDialog } from "@/components/portal-dialog";
import { PageBanner, PillLink } from "@/components/ui";
import { formatPrice } from "@/lib/utils";
import { cartLineTotalCents } from "@/lib/types";
import { PORTAL_URL } from "@/lib/portal";

export function CheckoutClient({
  paypalClientId,
  accountEmail,
}: {
  paypalClientId: string;
  /** From the session. The order is attributed to this account either way. */
  accountEmail: string;
}) {
  const { lines, subtotalCents, clear } = useCart();
  const formRef = useRef<HTMLFormElement>(null);
  const [paid, setPaid] = useState<{ orderId: string; captureId: string | null } | null>(
    null,
  );
  const [portalOpen, setPortalOpen] = useState(false);

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
    if (!form.reportValidity()) return null;
    return Object.fromEntries(
      new FormData(form).entries(),
    ) as Record<string, string>;
  }

  function handlePaid(result: { orderId: string; captureId: string | null }) {
    clear();
    setPaid(result);
    setPortalOpen(true); // hand the customer straight to their portal
  }

  if (paid) {
    return (
      <>
        <PageBanner
          title="Payment Complete"
          crumb={[
            { href: "/", label: "Home" },
            { href: "/checkout", label: "Checkout" },
          ]}
        />
        <section className="bg-white">
          <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
            <h2 className="text-2xl font-extrabold text-navy-950">
              Thank you — your payment was received
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
              Your order is confirmed and listed under My Orders. Your purchase is ready in your
              portal — sign in there with your purchase email.
            </p>
            <dl className="mt-8 rounded-2xl bg-cream px-6 py-5 text-left">
              <div className="flex justify-between gap-4 text-[14px]">
                <dt className="text-ink-muted">Order reference</dt>
                <dd className="font-mono font-semibold text-navy-950">
                  {paid.orderId.slice(0, 8)}
                </dd>
              </div>
              {paid.captureId && (
                <div className="mt-3 flex justify-between gap-4 text-[14px]">
                  <dt className="text-ink-muted">Payment reference</dt>
                  <dd className="font-mono font-semibold text-navy-950">
                    {paid.captureId}
                  </dd>
                </div>
              )}
            </dl>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href={PORTAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-600/25 transition-transform duration-200 hover:-translate-y-0.5"
              >
                Open My Portal
                <ExternalLink className="size-4" aria-hidden />
              </a>
              <PillLink href="/account/orders">Go to My Account</PillLink>
              <PillLink href="/courses">Browse More Courses</PillLink>
            </div>
          </div>
        </section>
        <PortalDialog open={portalOpen} onClose={() => setPortalOpen(false)} />
      </>
    );
  }

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
                <h2 className="text-xl font-extrabold text-navy-950">Your Details</h2>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Field label="First Name" htmlFor="first_name" required>
                    <Input id="first_name" name="first_name" required autoComplete="given-name" />
                  </Field>
                  <Field label="Last Name" htmlFor="last_name" required>
                    <Input id="last_name" name="last_name" required autoComplete="family-name" />
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
                    />
                  </Field>
                  <Field label="Telephone" htmlFor="phone" required>
                    <Input id="phone" name="phone" type="tel" required autoComplete="tel" />
                  </Field>
                </div>

                <h2 className="mt-12 text-xl font-extrabold text-navy-950">
                  Your Address
                </h2>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Field label="Company" htmlFor="company" className="sm:col-span-2">
                    <Input id="company" name="company" autoComplete="organization" />
                  </Field>
                  <Field label="Address 1" htmlFor="address1" required className="sm:col-span-2">
                    <Input id="address1" name="address1" required autoComplete="address-line1" />
                  </Field>
                  <Field label="Address 2" htmlFor="address2" className="sm:col-span-2">
                    <Input id="address2" name="address2" autoComplete="address-line2" />
                  </Field>
                  <Field label="City" htmlFor="city" required>
                    <Input id="city" name="city" required autoComplete="address-level2" />
                  </Field>
                  <Field label="ZIP code" htmlFor="zip" required>
                    <Input id="zip" name="zip" required autoComplete="postal-code" />
                  </Field>
                  <Field
                    label="PTIN Number"
                    htmlFor="ptin"
                    hint="Required if you need IRS credits."
                  >
                    <Input id="ptin" name="ptin" />
                  </Field>
                  <Field label="Country" htmlFor="country" required>
                    <Select id="country" name="country" required defaultValue="" autoComplete="country-name">
                      <option value="" disabled>
                        --select country--
                      </option>
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Region / State" htmlFor="region" required className="sm:col-span-2">
                    <Input id="region" name="region" required autoComplete="address-level1" />
                  </Field>
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
