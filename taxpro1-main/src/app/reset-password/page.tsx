import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { getCustomer } from "@/lib/account";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Set a New Password", robots: { index: false } };

/**
 * The emailed reset link goes through /auth/callback, which signs the customer
 * in with a short-lived session and sends them here to choose a new password.
 */
export default async function ResetPasswordPage() {
  const user = await getCustomer();

  return (
    <AuthShell word="Reset" tagline="Choose a new password for your Taxpropath account.">
      {user ? (
        <>
          <h2 className="text-3xl font-extrabold tracking-tight text-navy-950">Choose a new password</h2>
          <p className="mt-2 text-[15px] text-ink-muted">For {user.email}</p>
          <ResetPasswordForm />
        </>
      ) : (
        <>
          <h2 className="text-3xl font-extrabold tracking-tight text-navy-950">This link has expired</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
            Reset links work once and only for a short time. Request a new one and use it in this
            same browser.
          </p>
          <Link
            href="/login?reset=1"
            className="mt-8 flex w-full items-center justify-center rounded-full bg-brand-gradient py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-600/25"
          >
            Send a new reset link
          </Link>
        </>
      )}
    </AuthShell>
  );
}
