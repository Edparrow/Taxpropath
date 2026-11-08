import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, KeyRound, LogOut, Menu } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { SidebarNav } from "./sidebar-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { adminLogout } from "./account/actions";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Taxpropath Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Every /admin/* route inherits this check; pages add their own section check.
  const admin = await requireAdmin();
  const allowed = Object.keys(admin.permissions);

  return (
    <div className="flex min-h-screen bg-cream font-sans transition-colors duration-300 dark:bg-slate-950">
      <aside className="hidden w-72 shrink-0 border-r border-cream-dark bg-white transition-colors duration-300 print:hidden lg:block dark:border-slate-800 dark:bg-slate-900">
        <SidebarNav allowed={allowed} isSuper={admin.isSuper} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 bg-cream/90 backdrop-blur-lg transition-colors duration-300 print:hidden dark:bg-slate-950">
          <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-8">
            {/* Mobile: the same sidebar in a drop-down panel. */}
            <details className="relative lg:hidden">
              <summary className="flex size-10 cursor-pointer list-none items-center justify-center rounded-full bg-white text-slate-600 shadow-sm dark:bg-slate-800 dark:text-slate-300">
                <Menu className="size-5" aria-hidden />
                <span className="sr-only">Menu</span>
              </summary>
              <div className="absolute left-0 top-12 z-20 h-[75vh] w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <SidebarNav allowed={allowed} isSuper={admin.isSuper} />
              </div>
            </details>

            <div className="ml-auto flex items-center gap-4 lg:gap-6">
              <ThemeToggle />
              <div className="hidden h-8 w-px bg-cream-dark sm:block dark:bg-slate-800" />

              <details className="relative">
                <summary className="flex cursor-pointer list-none items-center gap-3">
                  <span className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-brand-gradient text-sm font-bold text-white shadow-sm">
                    {admin.name[0]?.toUpperCase() ?? "A"}
                  </span>
                  <span className="hidden text-right md:block">
                    <span className="block text-[13px] font-bold leading-tight text-navy-950 dark:text-slate-100">
                      {admin.name}
                    </span>
                    <span className="block max-w-[160px] truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {[admin.role, admin.isSuper ? "Super Admin" : null].filter(Boolean).join(" · ") || admin.email}
                    </span>
                  </span>
                  <ChevronDown className="hidden size-4 text-slate-400 md:block" aria-hidden />
                </summary>
                <div className="absolute right-0 top-12 z-20 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                  <p className="truncate px-3 py-2 text-[12px] text-ink-muted">{admin.email}</p>
                  <Link
                    href="/admin/change-password"
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[14px] font-semibold text-navy-950 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    <KeyRound className="size-4" aria-hidden />
                    Change password
                  </Link>
                  <form action={adminLogout}>
                    <button className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-[14px] font-semibold text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40">
                      <LogOut className="size-4" aria-hidden />
                      Log out
                    </button>
                  </form>
                </div>
              </details>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pb-12 pt-4 sm:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
