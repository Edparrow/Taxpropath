import type { Metadata } from "next";
import { requireCustomer } from "@/lib/account";
import { ChangePasswordForm } from "./change-password-form";
import { AccountHeading } from "../account-heading";

export const metadata: Metadata = { title: "Change Password", robots: { index: false } };

export default async function ChangePasswordPage() {
  await requireCustomer("/account/password");
  return (
    <div>
      <AccountHeading
        title="Change Password"
        description="Use at least 8 characters. This password is only for this website."
      />
      <ChangePasswordForm />
    </div>
  );
}
