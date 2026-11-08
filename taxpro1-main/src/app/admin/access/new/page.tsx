import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { AccessForm } from "../access-form";
import { createAdminUser } from "../actions";

export const metadata = { title: "New Admin" };

export default async function NewAdminPage() {
  await requireSuperAdmin();

  return (
    <>
      <Link
        href="/admin/access"
        className="mb-4 inline-flex items-center gap-1 text-[13.5px] font-semibold text-ink-muted hover:text-navy-950"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Back to Access Level
      </Link>
      <h1 className="mb-8 text-2xl font-extrabold text-navy-950 dark:text-white">New Admin</h1>
      <AccessForm
        isNew
        action={createAdminUser}
        initial={{ name: "", email: "", role: "", isSuper: false, isActive: true, permissions: {} }}
      />
    </>
  );
}
