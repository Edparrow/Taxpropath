import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { cleanPermissions } from "@/lib/admin/permissions";
import { AccessForm } from "../access-form";
import { updateAdminUser } from "../actions";

export const metadata = { title: "Edit Admin" };

export default async function EditAdminPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdmin();
  const { id } = await params;

  const { data } = await createAdminClient()
    .from("admin_users")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  return (
    <>
      <Link
        href="/admin/access"
        className="mb-4 inline-flex items-center gap-1 text-[13.5px] font-semibold text-ink-muted hover:text-navy-950"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Back to Access Level
      </Link>
      <h1 className="mb-8 text-2xl font-extrabold text-navy-950 dark:text-white">{data.name}</h1>
      <AccessForm
        isNew={false}
        action={updateAdminUser.bind(null, data.id)}
        initial={{
          name: data.name,
          email: data.email,
          role: data.role ?? "",
          isSuper: data.is_super,
          isActive: data.is_active,
          permissions: cleanPermissions(data.permissions),
        }}
      />
    </>
  );
}
