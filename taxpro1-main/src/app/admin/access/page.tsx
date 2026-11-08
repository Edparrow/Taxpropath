import Link from "next/link";
import { Pencil, Plus, ShieldCheck } from "lucide-react";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_SECTIONS, cleanPermissions } from "@/lib/admin/permissions";
import { deleteAdminUser } from "./actions";

export const metadata = { title: "Access Level" };

type Row = {
  id: string;
  name: string;
  email: string;
  role?: string | null;
  is_super: boolean;
  is_active: boolean;
  permissions: unknown;
  created_at: string;
};

export default async function AccessLevelPage() {
  const me = await requireSuperAdmin();
  const db = createAdminClient();

  const { data, error } = await db
    .from("admin_users")
    .select("*")
    .order("created_at");
  const admins = (data ?? []) as Row[];

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-950 dark:text-white">Access Level</h1>
          <p className="mt-1 text-[14px] text-ink-muted">
            Who can sign in to the admin panel, and what each admin may see or change.
          </p>
        </div>
        <Link
          href="/admin/access/new"
          className="flex shrink-0 items-center gap-2 rounded-full bg-brand-gradient shadow-md shadow-brand-600/20 px-5 py-2.5 text-[14px] font-bold text-white transition-transform duration-200 hover:-translate-y-0.5"
        >
          <Plus className="size-4" aria-hidden />
          New admin
        </Link>
      </div>

      {error && (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-800">
          Could not load admins: {error.message}
        </p>
      )}

      <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full min-w-[760px] text-left">
          <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
            <tr className="text-[12px] font-bold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3">Admin</th>
              <th className="px-5 py-3">Access</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {admins.map((a) => {
              const perms = cleanPermissions(a.permissions);
              const granted = ADMIN_SECTIONS.filter((s) => perms[s.key]);
              return (
                <tr key={a.id} className="align-top text-[14px]">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-navy-950 dark:text-white">
                      {a.name}
                      {a.id === me.id && <span className="ml-2 text-[12px] font-medium text-ink-muted">(you)</span>}
                    </p>
                    <p className="text-[13px] text-ink-muted">{a.email}</p>
                    {a.role && (
                      <span className="mt-1 inline-block rounded-full bg-cream px-2 py-0.5 text-[11.5px] font-semibold text-slate-700">
                        {a.role}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {a.is_super ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-navy-950 px-2.5 py-0.5 text-[11.5px] font-bold text-white">
                        <ShieldCheck className="size-3" aria-hidden />
                        Super Admin
                      </span>
                    ) : granted.length === 0 ? (
                      <span className="text-[13px] text-ink-muted">No sections</span>
                    ) : (
                      <span className="flex flex-wrap gap-1.5">
                        {granted.map((s) => (
                          <span
                            key={s.key}
                            className={`rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${
                              perms[s.key] === "edit"
                                ? "bg-brand-50 text-brand-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {s.label} · {perms[s.key]}
                          </span>
                        ))}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-bold ${
                        a.is_active ? "bg-brand-50 text-brand-700" : "bg-red-50 text-red-700"
                      }`}
                    >
                      {a.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/access/${a.id}`}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-[13px] font-semibold text-navy-950 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100"
                      >
                        <Pencil className="size-3.5" aria-hidden />
                        Edit
                      </Link>
                      {a.id !== me.id && (
                        <form action={deleteAdminUser}>
                          <input type="hidden" name="id" value={a.id} />
                          <button
                            type="submit"
                            className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-[13px] font-semibold text-red-700 hover:border-red-300 hover:bg-red-50 dark:border-slate-700"
                          >
                            Remove
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
