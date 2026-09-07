"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Building2,
  FolderTree,
  Image as ImageIcon,
  Images,
  Info,
  LayoutDashboard,
  Layers,
  Mail,
  MessageSquareQuote,
  MessagesSquare,
  ShoppingBag,
  Tags,
  Ticket,
  Users,
  Video,
  ArrowUpCircle
} from "lucide-react";
import clsx from "clsx";

const NAV_GROUPS = [
  {
    title: "HOME",
    links: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
    ],
  },
  {
    title: "CONTENT",
    links: [
      { href: "/admin/webinars", label: "Service", icon: Video },
      { href: "/admin/content/banners", label: "Banner", icon: ImageIcon },
      { href: "/admin/content/categories", label: "Category", icon: FolderTree },
      { href: "/admin/content/subcategories", label: "SubCategory", icon: Layers },
      { href: "/admin/content/industries", label: "Industries", icon: Building2 },
      { href: "/admin/content/brands", label: "Brands", icon: Tags },
      { href: "/admin/content/blog", label: "Blog", icon: BookOpen },
      { href: "/admin/content/gallery", label: "Gallery", icon: Images },
      { href: "/admin/content/about", label: "About", icon: Info },
      { href: "/admin/content/testimonials", label: "Testimonial", icon: MessageSquareQuote },
    ],
  },
  {
    title: "COMMERCE",
    links: [
      { href: "/admin/orders?status=paid", label: "Completed Orders", icon: ShoppingBag },
      { href: "/admin/orders?status=failed", label: "Failed Orders", icon: ShoppingBag },
      { href: "/admin/coupons", label: "Coupons", icon: Ticket },
    ],
  },
  {
    title: "USERS & CRM",
    links: [
      { href: "/admin/users", label: "Register User", icon: Users },
      { href: "/admin/enquiries", label: "Enquiry", icon: MessagesSquare },
      { href: "/admin/subscribers", label: "Subscribers", icon: Mail },
    ],
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="px-8 py-8">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white font-black text-lg shadow-sm shadow-brand-200 dark:shadow-none">
            T
          </div>
          <span className="text-xl font-extrabold text-navy-950 dark:text-white tracking-tight">Taxpropath</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-8 px-5 pb-6 overflow-y-auto custom-scrollbar">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="px-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.links.map(({ href, label, icon: Icon }) => {
                const isActive = href === "/admin" ? pathname === href : pathname.startsWith(href.split("?")[0]);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={clsx(
                      "flex items-center gap-3.5 rounded-2xl px-4 py-3 text-[14px] font-semibold transition-all duration-200",
                      isActive
                        ? "bg-brand-600 text-white shadow-md shadow-brand-200/50 dark:shadow-none"
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-navy-950 dark:hover:text-white"
                    )}
                  >
                    <Icon className={clsx("size-[18px] shrink-0", isActive ? "text-white" : "text-slate-400 dark:text-slate-500")} aria-hidden />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Action Banner Simulation */}
      <div className="p-5 mt-auto">
        <div className="rounded-3xl bg-gradient-to-br from-brand-50 to-brand-100 dark:from-slate-800 dark:to-slate-800/50 p-5 text-center relative overflow-hidden">
          <div className="absolute -top-4 -right-4 size-16 rounded-full bg-brand-200/40 dark:bg-slate-700/50" />
          <div className="absolute -bottom-4 -left-4 size-16 rounded-full bg-brand-200/40 dark:bg-slate-700/50" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-slate-900 shadow-sm mb-3">
              <ShoppingBag className="size-5 text-brand-600 dark:text-brand-400" />
            </div>
            <p className="text-[14px] font-bold text-navy-950 dark:text-white">Add a Service</p>
            <p className="mt-1 text-[12px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              Expand your catalog with webinars.
            </p>
            <Link 
              href="/admin/webinars/new"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-[13px] font-bold text-white shadow-sm hover:bg-brand-700 transition-colors"
            >
              Add now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
