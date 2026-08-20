import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  FolderTree,
  Image as ImageIcon,
  Info,
  LayoutDashboard,
  Layers,
  MessageSquareQuote,
  ShoppingBag,
  Tags,
  Users,
  Video,
} from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Taxpropath Admin" },
  robots: { index: false, follow: false },
};

/**
 * Mirrors the sections of the legacy admin panel. Content sections all point at
 * the generic CRUD under /admin/content/<resource>; webinars and orders keep
 * their own purpose-built screens.
 */
const NAV: { href: string; label: string; icon: typeof LayoutDashboard }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/content/banners", label: "Banner", icon: ImageIcon },
  { href: "/admin/content/categories", label: "Category", icon: FolderTree },
  { href: "/admin/content/subcategories", label: "SubCategory", icon: Layers },
  { href: "/admin/webinars", label: "Service", icon: Video },
  { href: "/admin/content/about", label: "About", icon: Info },
  { href: "/admin/content/testimonials", label: "Testimonial", icon: MessageSquareQuote },
  { href: "/admin/content/industries", label: "Industries", icon: Building2 },
  { href: "/admin/content/brands", label: "Brands", icon: Tags },
  { href: "/admin/users", label: "Register User", icon: Users },
  { href: "/admin/orders?status=paid", label: "Completed Orders", icon: ShoppingBag },
  { href: "/admin/orders?status=failed", label: "Failed Orders", icon: ShoppingBag },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Every /admin/* route inherits this check.
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <aside className="bg-navy-950 lg:w-64 lg:shrink-0">
        <div className="px-6 py-6">
          <Link href="/admin" className="text-xl font-extrabold text-white">
            Taxpropath
          </Link>
          <p className="mt-1 text-[12px] font-semibold uppercase tracking-wider text-slate-500">
            Admin Panel
          </p>
        </div>

        <nav className="flex flex-wrap gap-1 px-3 pb-6 lg:flex-col lg:flex-nowrap">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold text-slate-300 transition-colors duration-200 hover:bg-white/[0.06] hover:text-white"
            >
              <Icon className="size-4 shrink-0 text-brand-500" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="border-b border-slate-200 bg-white">
          <div className="flex items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <p className="text-[15px] font-bold text-navy-950">
              Welcome To Taxpropath Dashboard!
            </p>
            <div className="ml-auto flex items-center gap-4">
              <span className="hidden text-[13px] text-ink-muted sm:inline">
                {admin.email}
              </span>
              <Link
                href="/"
                className="text-[13px] font-semibold text-brand-700 hover:underline"
              >
                View site
              </Link>
            </div>
          </div>
        </header>

        <main className="px-4 py-10 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
