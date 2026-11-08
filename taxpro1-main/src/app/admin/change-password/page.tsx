import { requireAdmin } from "@/lib/admin-auth";
import { PasswordForm } from "./password-form";

export const metadata = { title: "Change Password" };

export default async function ChangePasswordPage() {
  const admin = await requireAdmin();

  return (
    <>
      <h1 className="text-2xl font-extrabold text-navy-950 dark:text-white">Change Password</h1>
      <p className="mb-8 mt-1 text-[14px] text-ink-muted">{admin.email}</p>
      <PasswordForm />
    </>
  );
}
