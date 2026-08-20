import { ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";

export const metadata = { title: "Registered users" };

/**
 * Registered accounts. Reads auth.users through the service role because
 * confirmation state and last-sign-in live there, not in profiles — and neither
 * is reachable with an anon-key session.
 */
export default async function AdminUsersPage() {
  await requireAdmin();

  if (!hasServiceRoleKey()) {
    return (
      <>
        <h1 className="text-2xl font-extrabold text-navy-950">Registered users</h1>
        <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-[14px] text-amber-900">
          Add <code className="font-mono font-semibold">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
          to <code className="font-mono font-semibold">.env.local</code> to list accounts.
        </p>
      </>
    );
  }

  const admin = createAdminClient();
  const [{ data: list, error }, { data: profiles }] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
    admin.from("profiles").select("id, role"),
  ]);

  const roleById = new Map((profiles ?? []).map((p) => [p.id, p.role as string]));
  const users = list?.users ?? [];

  const dateFormat = (value: string | null | undefined) =>
    value
      ? new Date(value).toLocaleString("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  return (
    <>
      <div>
        <h1 className="text-2xl font-extrabold text-navy-950">Registered users</h1>
        <p className="mt-1 text-[14px] text-ink-muted">
          {users.length} account{users.length === 1 ? "" : "s"}
        </p>
      </div>

      {error && (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-800">
          Could not load accounts: {error.message}
        </p>
      )}

      {!error && users.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center">
          <p className="text-[15px] font-semibold text-navy-950">No accounts yet</p>
        </div>
      )}

      {users.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[760px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr className="text-[12px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">#</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Registered</th>
                <th className="px-5 py-3">Last sign-in</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user, index) => {
                const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
                const name = [meta.first_name, meta.last_name]
                  .filter(Boolean)
                  .join(" ");
                const confirmed = Boolean(user.email_confirmed_at);
                const isAdminUser = roleById.get(user.id) === "admin";

                return (
                  <tr key={user.id} className="text-[14px]">
                    <td className="px-5 py-4 tabular-nums text-slate-400">
                      {index + 1}
                    </td>
                    <td className="px-5 py-4 font-semibold text-navy-950">
                      <span className="flex items-center gap-1.5">
                        {user.email}
                        {isAdminUser && (
                          <ShieldCheck
                            className="size-3.5 text-brand-600"
                            aria-label="Admin"
                          />
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-ink-muted">{name || "—"}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-ink-muted">
                      {dateFormat(user.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-ink-muted">
                      {dateFormat(user.last_sign_in_at)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-bold ${
                          confirmed
                            ? "bg-brand-50 text-brand-700"
                            : "bg-amber-50 text-amber-800"
                        }`}
                      >
                        {confirmed ? "Confirmed" : "Unconfirmed"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
