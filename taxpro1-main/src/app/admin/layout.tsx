import type { Metadata } from "next";
import Link from "next/link";
import { Search, Bell, ChevronDown } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { SidebarNav } from "./sidebar-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Taxpropath Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Every /admin/* route inherits this check.
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
      {/* Sidebar Area */}
      <aside className="hidden lg:block w-72 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 print:hidden transition-colors duration-300">
        <SidebarNav />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-slate-50 dark:bg-slate-950 sticky top-0 z-10 print:hidden transition-colors duration-300">
          <div className="flex h-20 items-center justify-between px-8">
            
            {/* Search Input Simulation */}
            <div className="relative w-full max-w-md hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-slate-500" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full rounded-full border-none bg-white dark:bg-slate-900 py-3 pl-11 pr-4 text-[14px] font-medium text-navy-950 dark:text-slate-100 shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-colors duration-300"
              />
            </div>

            {/* Right side icons and profile */}
            <div className="ml-auto flex items-center gap-4 lg:gap-6">
              
              {/* Action Icons */}
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors relative">
                  <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-800"></span>
                  <Bell className="size-[18px]" />
                </button>
              </div>

              {/* Separator */}
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block transition-colors duration-300"></div>

              {/* User Profile */}
              <div className="flex items-center gap-3 cursor-pointer">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-brand-500 to-brand-300 text-white shadow-sm overflow-hidden">
                  <span className="font-bold text-sm">{admin.email?.[0].toUpperCase() ?? 'A'}</span>
                </div>
                <div className="hidden md:block text-right">
                  <p className="text-[13px] font-bold text-navy-950 dark:text-slate-100 leading-tight">Admin User</p>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[120px]">{admin.email}</p>
                </div>
                <ChevronDown className="hidden md:block size-4 text-slate-400 dark:text-slate-500" />
              </div>

            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 px-8 pb-12 pt-4">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
