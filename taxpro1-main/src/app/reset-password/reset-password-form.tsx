"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Field, FormAlert, Input, SubmitButton } from "@/components/form";
import { setNewPassword, type FormState } from "@/app/account/actions";

const INITIAL: FormState = { error: null, done: false };

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(setNewPassword, INITIAL);

  if (state.done) {
    return (
      <div className="mt-6 space-y-5">
        <FormAlert tone="success">Your password has been changed. You&rsquo;re signed in.</FormAlert>
        <Link
          href="/account"
          className="flex w-full items-center justify-center rounded-full bg-brand-gradient py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-600/25"
        >
          Go to My Account
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="mt-6 space-y-5">
      {state.error && <FormAlert tone="error">{state.error}</FormAlert>}
      <Field label="New password" htmlFor="new_password" required hint="At least 8 characters.">
        <Input id="new_password" name="new_password" type="password" required minLength={8} autoComplete="new-password" />
      </Field>
      <Field label="Confirm new password" htmlFor="confirm_password" required>
        <Input id="confirm_password" name="confirm_password" type="password" required minLength={8} autoComplete="new-password" />
      </Field>
      <SubmitButton pending={pending}>Save new password</SubmitButton>
    </form>
  );
}
