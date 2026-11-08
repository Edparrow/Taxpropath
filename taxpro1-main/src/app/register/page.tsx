"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { COUNTRIES } from "@/lib/data/countries";
import {
  Field,
  FormAlert,
  Input,
  Select,
  SubmitButton,
  SupabaseNotice,
} from "@/components/form";
import { authErrorMessage } from "@/lib/auth-errors";
import { safeNextPath } from "@/lib/next-path";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { AuthShell } from "@/components/auth-shell";
import { welcomeAfterSignup } from "./actions";

/** Where Supabase should send the confirmation link back to. */
function callbackUrl(next: string) {
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Set when arriving from a gated page such as /checkout.
  const next = safeNextPath(searchParams.get("next"));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  // Kept so the confirmation screen can resend without re-asking for it.
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));

    if (password !== String(form.get("confirm_password"))) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setPending(true);
    const address = String(form.get("email"));
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: address,
      password,
      options: {
        emailRedirectTo: callbackUrl(next),
        data: {
          // Marks the sign-up as this site's: the login database is shared.
          site: "taxpropath",
          first_name: String(form.get("first_name")),
          last_name: String(form.get("last_name")),
          phone: String(form.get("phone")),
          company: String(form.get("company")),
          address1: String(form.get("address1")),
          address2: String(form.get("address2")),
          city: String(form.get("city")),
          zip: String(form.get("zip")),
          ptin: String(form.get("ptin")),
          country: String(form.get("country")),
          region: String(form.get("region")),
        },
      },
    });

    setPending(false);
    if (error) {
      setError(authErrorMessage(error));
      return;
    }

    /*
     * A session here means the project has email confirmation switched off, so
     * the account is already active and no email was sent — showing the "check
     * your email" screen would leave the user waiting for nothing.
     */
    if (data.session) {
      void welcomeAfterSignup().catch(() => {});
      router.push(next);
      router.refresh();
      return;
    }

    setEmail(address);
    setDone(true);
  }

  async function handleResend() {
    setResending(true);
    setResendError(null);
    setResendNotice(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: callbackUrl(next) },
    });

    setResending(false);
    if (error) {
      setResendError(authErrorMessage(error));
      return;
    }
    setResendNotice("Sent. Check your inbox — and your spam folder.");
  }

  if (done) {
    return (
      <AuthShell word="Verify" tagline="One last step: confirm your email address to activate your account.">
        <div className="text-center lg:text-left">
          <h2 className="text-3xl font-extrabold tracking-tight text-navy-950">
            Confirm your account
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
            We&rsquo;ve sent a confirmation link to{" "}
            <span className="font-semibold text-navy-950">{email}</span>. Click it to
            activate your Taxpropath account.
          </p>

          {(resendNotice || resendError) && (
            <div className="mt-6 text-left">
              <FormAlert tone={resendError ? "error" : "success"}>
                {resendError ?? resendNotice}
              </FormAlert>
            </div>
          )}

          <p className="mt-8 text-[14.5px] text-ink-muted">
            Didn&rsquo;t get it?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="cursor-pointer font-bold text-brand-700 underline underline-offset-2 transition-colors duration-200 hover:text-brand-800 disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
            >
              {resending ? "Sending…" : "Resend confirmation"}
            </button>
          </p>

          <Link
            href="/login"
            className="mt-8 inline-block rounded-full bg-brand-gradient px-8 py-3 text-sm font-bold text-white"
          >
            Back to Login
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      word="Register"
      tagline="Create your free account to buy self-study CPE courses and keep every order in one place."
      wide
    >
      <form onSubmit={handleSubmit}>
        <h2 className="text-3xl font-extrabold tracking-tight text-navy-950">
          Create your account
        </h2>
        <p className="mt-2 text-[15px] text-ink-muted">
          Already have an account?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="font-bold text-brand-700 hover:underline"
          >
            Login
          </Link>
        </p>

        {!isSupabaseConfigured() && (
          <div className="mt-6">
            <SupabaseNotice />
          </div>
        )}

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <Field label="First Name" htmlFor="first_name" required>
            <Input
              id="first_name"
              name="first_name"
              required
              autoComplete="given-name"
            />
          </Field>
          <Field label="Last Name" htmlFor="last_name" required>
            <Input
              id="last_name"
              name="last_name"
              required
              autoComplete="family-name"
            />
          </Field>
          <Field label="E-Mail" htmlFor="email" required>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </Field>
          <Field label="Telephone" htmlFor="phone" required>
            <Input id="phone" name="phone" type="tel" required autoComplete="tel" />
          </Field>
          <Field
            label="Password"
            htmlFor="password"
            required
            hint="At least 8 characters."
          >
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirm Password" htmlFor="confirm_password" required>
            <Input
              id="confirm_password"
              name="confirm_password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </Field>
        </div>

        <h3 className="mt-10 text-lg font-extrabold text-navy-950">Your Address</h3>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Company" htmlFor="company" className="sm:col-span-2">
            <Input id="company" name="company" autoComplete="organization" />
          </Field>
          <Field
            label="Address 1"
            htmlFor="address1"
            required
            className="sm:col-span-2"
          >
            <Input
              id="address1"
              name="address1"
              required
              autoComplete="address-line1"
            />
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
            <Select
              id="country"
              name="country"
              required
              defaultValue=""
              autoComplete="country-name"
            >
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
          <Field
            label="Region / State"
            htmlFor="region"
            required
            className="sm:col-span-2"
          >
            <Input
              id="region"
              name="region"
              required
              autoComplete="address-level1"
            />
          </Field>
        </div>

        {error && (
          <div className="mt-8">
            <FormAlert tone="error">{error}</FormAlert>
          </div>
        )}

        <div className="mt-8">
          <SubmitButton pending={pending}>Create Account</SubmitButton>
        </div>
      </form>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
