import type { Metadata } from "next";
import { requireCustomer } from "@/lib/account";
import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = { title: "Change Password", robots: { index: false } };

export default async function ChangePasswordPage() {
  await requireCustomer("/account/password");
  return (
    <div>
      <h2 className="text-xl font-extrabold text-navy-950">Change Password</h2>
      <p className="mt-1 text-[14px] text-ink-muted">
        Use at least 8 characters. This password is only for this website.
      </p>
      <ChangePasswordForm />
    </div>
  );
}
