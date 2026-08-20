"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Field,
  FormAlert,
  Input,
  SubmitButton,
  SupabaseNotice,
} from "@/components/form";
import { safeNextPath } from "@/lib/next-path";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { PageBanner } from "@/components/ui";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  // /auth/callback redirects rejected confirmation links here with ?error=.
  const [error, setError] = useState<string | null>(searchParams.get("error"));
  // Where to land after signing in — set when arriving from a gated page.
  const next = safeNextPath(searchParams.get("next"));
  const [notice, setNotice] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);

    const form = new FormData(event.currentTarget);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });

    setPending(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(next);
    router.refresh();
  }

  async function handleReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);

    const form = new FormData(event.currentTarget);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(
      String(form.get("reset_email")),
      {
        redirectTo: `${window.location.origin}/login?next=${encodeURIComponent(next)}`,
      },
    );

    setPending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setNotice("If that email is registered, a reset link is on its way.");
    setResetOpen(false);
  }

  return (
    <>
      <PageBanner
        title="Login"
        crumb={[
          { href: "/", label: "Home" },
          { href: "/login", label: "Login" },
        ]}
      />

      <section className="bg-white">
        <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
          <div className="rounded-3xl border border-slate-200 p-8">
            <h2 className="text-xl font-extrabold text-navy-950">
              Sign in to your account
            </h2>

            {!isSupabaseConfigured() && (
              <div className="mt-5">
                <SupabaseNotice />
              </div>
            )}

            {notice && (
              <div className="mt-5">
                <FormAlert tone="success">{notice}</FormAlert>
              </div>
            )}
            {error && (
              <div className="mt-5">
                <FormAlert tone="error">{error}</FormAlert>
              </div>
            )}

            {resetOpen ? (
              <form onSubmit={handleReset} className="mt-6 space-y-5">
                <Field
                  label="Enter your registered email"
                  htmlFor="reset_email"
                  required
                >
                  <Input
                    id="reset_email"
                    name="reset_email"
                    type="email"
                    required
                    autoComplete="email"
                  />
                </Field>
                <SubmitButton pending={pending}>Send Reset Link</SubmitButton>
                <button
                  type="button"
                  onClick={() => setResetOpen(false)}
                  className="w-full cursor-pointer text-center text-[13.5px] font-semibold text-ink-muted hover:text-brand-700"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="mt-6 space-y-5">
                <Field label="Email" htmlFor="email" required>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                  />
                </Field>
                <Field label="Password" htmlFor="password" required>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                  />
                </Field>
                <SubmitButton pending={pending}>Login</SubmitButton>
                <button
                  type="button"
                  onClick={() => setResetOpen(true)}
                  className="w-full cursor-pointer text-center text-[13.5px] font-semibold text-brand-700 hover:underline"
                >
                  Forgot Password?
                </button>
              </form>
            )}
          </div>

          <p className="mt-6 text-center text-[14.5px] text-ink-muted">
            Don&rsquo;t have an account?{" "}
            <Link
              href={`/register?next=${encodeURIComponent(next)}`}
              className="font-bold text-brand-700 hover:underline"
            >
              Register
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
