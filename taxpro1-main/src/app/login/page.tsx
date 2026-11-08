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
import { AuthShell } from "@/components/auth-shell";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  // /auth/callback redirects rejected confirmation links here with ?error=.
  const [error, setError] = useState<string | null>(searchParams.get("error"));
  // Where to land after signing in — set when arriving from a gated page.
  const next = safeNextPath(searchParams.get("next"));
  const [notice, setNotice] = useState<string | null>(null);
  // ?reset=1 (from Change Password or an expired reset link) opens the reset form.
  const [resetOpen, setResetOpen] = useState(searchParams.get("reset") === "1");

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
        // /auth/callback turns the link into a session, then /reset-password
        // asks for the new password.
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
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
    <AuthShell
      word={resetOpen ? "Reset" : "Login"}
      tagline={
        resetOpen
          ? "Forgot your password? We'll email you a link to set a new one."
          : "Welcome back. Sign in to buy courses, see your orders and open your learning portal."
      }
    >
      <h2 className="text-3xl font-extrabold tracking-tight text-navy-950">
        {resetOpen ? "Reset your password" : "Sign in to your account"}
      </h2>
      <p className="mt-2 text-[15px] text-ink-muted">
        {resetOpen ? (
          "Enter the email you registered with."
        ) : (
          <>
            New to Taxpropath?{" "}
            <Link
              href={`/register?next=${encodeURIComponent(next)}`}
              className="font-bold text-brand-700 hover:underline"
            >
              Create an account
            </Link>
          </>
        )}
      </p>

      {!isSupabaseConfigured() && (
        <div className="mt-6">
          <SupabaseNotice />
        </div>
      )}

      {notice && (
        <div className="mt-6">
          <FormAlert tone="success">{notice}</FormAlert>
        </div>
      )}
      {error && (
        <div className="mt-6">
          <FormAlert tone="error">{error}</FormAlert>
        </div>
      )}

      {resetOpen ? (
        <form onSubmit={handleReset} className="mt-8 space-y-5">
          <Field label="Email" htmlFor="reset_email" required>
            <Input id="reset_email" name="reset_email" type="email" required autoComplete="email" />
          </Field>
          <SubmitButton pending={pending}>Send Reset Link</SubmitButton>
          <button
            type="button"
            onClick={() => setResetOpen(false)}
            className="w-full cursor-pointer text-center text-[14px] font-semibold text-ink-muted hover:text-brand-700"
          >
            Back to login
          </button>
        </form>
      ) : (
        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <Field label="Email" htmlFor="email" required>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </Field>
          <Field label="Password" htmlFor="password" required>
            <Input id="password" name="password" type="password" required autoComplete="current-password" />
          </Field>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setResetOpen(true)}
              className="cursor-pointer text-[13.5px] font-semibold text-brand-700 hover:underline"
            >
              Forgot Password?
            </button>
          </div>
          <SubmitButton pending={pending}>Login</SubmitButton>
        </form>
      )}
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
