"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Field, FormAlert, Input, SubmitButton } from "@/components/form";
import { changeMyPassword, type FormState } from "../actions";

const INITIAL: FormState = { error: null, done: false };

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changeMyPassword, INITIAL);

  return (
    <form
      action={action}
      // Clear the fields after a successful change.
      key={state.done ? "done" : "form"}
      className="max-w-md space-y-5 rounded-2xl border border-slate-200 bg-white p-6"
    >
      {state.error && <FormAlert tone="error">{state.error}</FormAlert>}
      {state.done && <FormAlert tone="success">Your password has been changed.</FormAlert>}

      <Field label="Current password" htmlFor="current_password" required>
        <Input id="current_password" name="current_password" type="password" required autoComplete="current-password" />
      </Field>
      <Field label="New password" htmlFor="new_password" required hint="At least 8 characters.">
        <Input id="new_password" name="new_password" type="password" required minLength={8} autoComplete="new-password" />
      </Field>
      <Field label="Confirm new password" htmlFor="confirm_password" required>
        <Input id="confirm_password" name="confirm_password" type="password" required minLength={8} autoComplete="new-password" />
      </Field>

      <SubmitButton pending={pending}>Change password</SubmitButton>
      <p className="text-center text-[13.5px] text-ink-muted">
        Forgot your current password?{" "}
        <Link href="/login?reset=1" className="font-bold text-brand-700 hover:underline">
          Reset it by email
        </Link>
      </p>
    </form>
  );
}
