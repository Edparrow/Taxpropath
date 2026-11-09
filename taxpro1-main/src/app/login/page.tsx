"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);

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
      <h2 className="text-[28px] font-extrabold tracking-tight text-navy-950">
        {resetOpen ? "Reset your password" : "Welcome back"}
      </h2>
      <p className="mt-1.5 text-[15px] text-ink-muted">
        {resetOpen
          ? "Enter the email you registered with."
          : "Sign in to your Taxpropath account."}
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
            <IconInput icon={Mail}>
              <Input
                id="reset_email"
                name="reset_email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
                className="pl-11"
              />
            </IconInput>
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
            <IconInput icon={Mail}>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
                className="pl-11"
              />
            </IconInput>
          </Field>
          <Field label="Password" htmlFor="password" required>
            <IconInput icon={Lock}>
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="Your password"
                className="pl-11 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 flex w-12 cursor-pointer items-center justify-center text-slate-400 transition-colors hover:text-navy-950"
              >
                {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
              </button>
            </IconInput>
          </Field>
          <div className="-mt-1 flex justify-end">
            <button
              type="button"
              onClick={() => setResetOpen(true)}
              className="cursor-pointer text-[13.5px] font-semibold text-brand-700 hover:underline"
            >
              Forgot Password?
            </button>
          </div>
          <SubmitButton pending={pending}>Login</SubmitButton>

          <div className="flex items-center gap-3 pt-1 text-[12px] font-semibold uppercase tracking-wider text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            New to Taxpropath?
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <Link
            href={`/register?next=${encodeURIComponent(next)}`}
            className="flex w-full items-center justify-center rounded-full border-2 border-navy-950/10 py-3 text-sm font-bold text-navy-950 transition-colors duration-200 hover:border-brand-500 hover:text-brand-700"
          >
            Create an account
          </Link>
          <p className="flex items-center justify-center gap-1.5 text-[12.5px] text-slate-400">
            <ShieldCheck className="size-4 text-brand-600" aria-hidden />
            Secure, encrypted sign-in
          </p>
        </form>
      )}
    </AuthShell>
  );
}

/** Input with a leading icon; the child Input needs left padding (pl-11). */
function IconInput({
  icon: Icon,
  children,
}: {
  icon: typeof Mail;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <Icon
        aria-hidden
        className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-400"
      />
      {children}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
