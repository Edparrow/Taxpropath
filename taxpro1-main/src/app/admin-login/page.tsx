import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getAdmin } from "@/lib/admin-auth";
import { AdminLoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Admin Login | Taxpropath",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (await getAdmin()) redirect("/admin");

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-brand-50 via-white to-cream px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-navy-950/[0.06] sm:p-10">
        <Image
          src="/logo.png"
          alt="Taxpropath"
          width={1024}
          height={318}
          priority
          className="h-10 w-auto"
        />
        <p className="mt-8 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-700">
          <ShieldCheck className="size-3.5" aria-hidden />
          Admin panel
        </p>
        <h1 className="mt-3 text-2xl font-extrabold text-navy-950">Welcome back</h1>
        <p className="mt-1 text-[14px] text-ink-muted">
          Sign in with your admin account.
        </p>

        <AdminLoginForm />
      </div>
    </div>
  );
}
