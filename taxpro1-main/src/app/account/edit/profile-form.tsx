"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Building2, MapPin, UserRound } from "lucide-react";
import { COUNTRIES } from "@/lib/data/countries";
import { Field, FormAlert, Input, Select, SubmitButton } from "@/components/form";
import type { Profile } from "@/lib/account";
import { updateProfile, type FormState } from "../actions";

const INITIAL: FormState = { error: null, done: false };

export function ProfileForm({ profile }: { profile: Profile | null }) {
  const [state, action, pending] = useActionState(updateProfile, INITIAL);
  const v = (key: keyof Profile) => profile?.[key] ?? "";

  return (
    <form action={action} className="space-y-6">
      {state.error && <FormAlert tone="error">{state.error}</FormAlert>}
      {state.done && <FormAlert tone="success">Your details have been saved.</FormAlert>}

      <FormSection
        icon={UserRound}
        title="Personal information"
        description="Your name appears on orders and IRS CE certificates."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="First name" htmlFor="first_name" required>
            <Input id="first_name" name="first_name" required defaultValue={v("first_name")} autoComplete="given-name" />
          </Field>
          <Field label="Last name" htmlFor="last_name">
            <Input id="last_name" name="last_name" defaultValue={v("last_name")} autoComplete="family-name" />
          </Field>
          <Field label="Phone" htmlFor="phone">
            <Input id="phone" name="phone" type="tel" defaultValue={v("phone")} autoComplete="tel" placeholder="+1 555 000 0000" />
          </Field>
          <Field label="PTIN" htmlFor="ptin" hint="Needed for IRS CE credits.">
            <Input id="ptin" name="ptin" defaultValue={v("ptin")} placeholder="P00000000" />
          </Field>
        </div>
      </FormSection>

      <FormSection
        icon={MapPin}
        title="Mailing address"
        description="Used for invoices and to verify your certificates."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Address line 1" htmlFor="address1" className="sm:col-span-2">
            <Input id="address1" name="address1" defaultValue={v("address1")} autoComplete="address-line1" placeholder="Street address" />
          </Field>
          <Field label="Address line 2" htmlFor="address2" className="sm:col-span-2">
            <Input id="address2" name="address2" defaultValue={v("address2")} autoComplete="address-line2" placeholder="Apartment, suite, unit (optional)" />
          </Field>
          <Field label="City" htmlFor="city">
            <Input id="city" name="city" defaultValue={v("city")} autoComplete="address-level2" />
          </Field>
          <Field label="State / Region" htmlFor="region">
            <Input id="region" name="region" defaultValue={v("region")} autoComplete="address-level1" />
          </Field>
          <Field label="ZIP code" htmlFor="zip">
            <Input id="zip" name="zip" defaultValue={v("zip")} autoComplete="postal-code" />
          </Field>
          <Field label="Country" htmlFor="country">
            <Select id="country" name="country" defaultValue={v("country")} autoComplete="country-name">
              <option value="">Select a country</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </FormSection>

      <FormSection
        icon={Building2}
        title="Company"
        description="Optional. Shown on your invoices."
      >
        <Field label="Company name" htmlFor="company">
          <Input id="company" name="company" defaultValue={v("company")} autoComplete="organization" />
        </Field>
      </FormSection>

      {/* Save bar: stays in view at the bottom while the form is long. */}
      <div className="sticky bottom-4 z-10 flex items-center justify-end gap-3 rounded-2xl border border-slate-200 bg-white/95 px-5 py-3.5 shadow-lg shadow-navy-950/5 backdrop-blur">
        <Link
          href="/account"
          className="rounded-full px-5 py-2.5 text-[14px] font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-navy-950"
        >
          Cancel
        </Link>
        <SubmitButton pending={pending} className="w-auto px-7 py-2.5">
          Save changes
        </SubmitButton>
      </div>
    </form>
  );
}

function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <header className="flex items-start gap-3 border-b border-slate-100 px-6 py-4">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <Icon className="size-4.5" aria-hidden />
        </span>
        <div>
          <h3 className="text-[15.5px] font-semibold text-navy-950">{title}</h3>
          <p className="mt-0.5 text-[13.5px] text-slate-500">{description}</p>
        </div>
      </header>
      <div className="p-6">{children}</div>
    </section>
  );
}
