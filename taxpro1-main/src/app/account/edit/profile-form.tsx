"use client";

import { useActionState } from "react";
import Link from "next/link";
import { COUNTRIES } from "@/lib/data/countries";
import { Field, FormAlert, Input, Select, SubmitButton } from "@/components/form";
import type { Profile } from "@/lib/account";
import { updateProfile, type FormState } from "../actions";

const INITIAL: FormState = { error: null, done: false };

export function ProfileForm({ profile }: { profile: Profile | null }) {
  const [state, action, pending] = useActionState(updateProfile, INITIAL);
  const v = (key: keyof Profile) => profile?.[key] ?? "";

  return (
    <form action={action} className="mt-6 space-y-6">
      {state.error && <FormAlert tone="error">{state.error}</FormAlert>}
      {state.done && <FormAlert tone="success">Your details have been saved.</FormAlert>}

      <section className="rounded-3xl border border-slate-200 p-6">
        <h3 className="mb-5 text-[15px] font-extrabold text-navy-950">Personal Information</h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="First name" htmlFor="first_name" required>
            <Input id="first_name" name="first_name" required defaultValue={v("first_name")} autoComplete="given-name" />
          </Field>
          <Field label="Last name" htmlFor="last_name">
            <Input id="last_name" name="last_name" defaultValue={v("last_name")} autoComplete="family-name" />
          </Field>
          <Field label="Phone" htmlFor="phone">
            <Input id="phone" name="phone" type="tel" defaultValue={v("phone")} autoComplete="tel" />
          </Field>
          <Field label="PTIN" htmlFor="ptin" hint="Needed for IRS credits.">
            <Input id="ptin" name="ptin" defaultValue={v("ptin")} />
          </Field>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 p-6">
        <h3 className="mb-5 text-[15px] font-extrabold text-navy-950">Mailing Address</h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Address line 1" htmlFor="address1" className="sm:col-span-2">
            <Input id="address1" name="address1" defaultValue={v("address1")} autoComplete="address-line1" />
          </Field>
          <Field label="Address line 2" htmlFor="address2" className="sm:col-span-2">
            <Input id="address2" name="address2" defaultValue={v("address2")} autoComplete="address-line2" />
          </Field>
          <Field label="City" htmlFor="city">
            <Input id="city" name="city" defaultValue={v("city")} autoComplete="address-level2" />
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
          <Field label="State / Region" htmlFor="region">
            <Input id="region" name="region" defaultValue={v("region")} autoComplete="address-level1" />
          </Field>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 p-6">
        <h3 className="mb-5 text-[15px] font-extrabold text-navy-950">Company Details</h3>
        <Field label="Company" htmlFor="company">
          <Input id="company" name="company" defaultValue={v("company")} autoComplete="organization" />
        </Field>
      </section>

      <div className="flex items-center gap-3">
        <SubmitButton pending={pending} className="w-auto px-8">
          Save changes
        </SubmitButton>
        <Link href="/account" className="rounded-full px-5 py-3 text-[14px] font-semibold text-ink-muted hover:text-navy-950">
          Back to profile
        </Link>
      </div>
    </form>
  );
}
