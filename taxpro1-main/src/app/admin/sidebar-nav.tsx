"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Building2,
  ClipboardList,
  FolderTree,
  GraduationCap,
  History,
  Image as ImageIcon,
  Images,
  Info,
  LayoutDashboard,
  Layers,
  Mail,
  MessageSquareQuote,
  MessagesSquare,
  ShieldCheck,
  Bug,
  ShoppingBag,
  ShoppingCart,
  Tags,
  Ticket,
  TriangleAlert,
  Users,
  type LucideIcon,
} from "lucide-react";
import clsx from "clsx";

type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Section key from src/lib/admin/permissions.ts, or "super" for Super Admin only. */
  section: string;
};

const NAV_GROUPS: { title: string; links: NavLink[] }[] = [
  {
    title: "HOME",
    links: [{ href: "/admin", label: "Overview", icon: LayoutDashboard, section: "dashboard" }],
  },
  {
    title: "CONTENT",
    links: [
      { href: "/admin/courses", label: "Courses", icon: GraduationCap, section: "courses" },
      { href: "/admin/content/banners", label: "Banner", icon: ImageIcon, section: "banners" },
      { href: "/admin/content/categories", label: "Category", icon: FolderTree, section: "categories" },
      { href: "/admin/content/subcategories", label: "SubCategory", icon: Layers, section: "subcategories" },
      { href: "/admin/content/industries", label: "Industries", icon: Building2, section: "industries" },
      { href: "/admin/content/brands", label: "Brands", icon: Tags, section: "brands" },
      { href: "/admin/content/blog", label: "Blog", icon: BookOpen, section: "blog" },
      { href: "/admin/content/gallery", label: "Gallery", icon: Images, section: "gallery" },
      { href: "/admin/content/about", label: "About", icon: Info, section: "about" },
      { href: "/admin/content/testimonials", label: "Testimonial", icon: MessageSquareQuote, section: "testimonials" },
    ],
  },
  {
    title: "ORDERS",
    links: [
      { href: "/admin/orders", label: "Completed Orders", icon: ShoppingBag, section: "orders" },
      { href: "/admin/orders/sheet", label: "Order Sheet", icon: ClipboardList, section: "order_sheet" },
      { href: "/admin/orders/failed", label: "Failed Orders", icon: TriangleAlert, section: "failed_orders" },
      { href: "/admin/orders/abandoned", label: "Abandoned Analysis", icon: ShoppingCart, section: "abandoned" },
      { href: "/admin/coupons", label: "Coupons", icon: Ticket, section: "coupons" },
    ],
  },
  {
    title: "USERS & CRM",
    links: [
      { href: "/admin/users", label: "Register User", icon: Users, section: "users" },
      { href: "/admin/enquiries", label: "Contact Queries", icon: MessagesSquare, section: "enquiries" },
      { href: "/admin/subscribers", label: "Subscribers", icon: Mail, section: "subscribers" },
    ],
  },
  {
    title: "ADMIN",
    links: [
      { href: "/admin/access", label: "Access Level", icon: ShieldCheck, section: "super" },
      { href: "/admin/activity-logs", label: "Activity Logs", icon: History, section: "activity_logs" },
      { href: "/admin/error-monitor", label: "Error Monitor", icon: Bug, section: "super" },
    ],
  },
];

/** `/admin/orders` must not light up on `/admin/orders/sheet` etc. */
function isActive(pathname: string, href: string): boolean {
  if (href === "/admin" || href === "/admin/orders") {
    return pathname === href || (href === "/admin/orders" && /^\/admin\/orders\/(new|[0-9a-f-]{36})/.test(pathname));
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The sidebar shows only what this admin may open. It mirrors the server-side
 * checks (requireAdmin) — it is not itself the access control.
 */
export function SidebarNav({ allowed, isSuper }: { allowed: string[]; isSuper: boolean }) {
  const pathname = usePathname();
  const may = (section: string) => (section === "super" ? isSuper : isSuper || allowed.includes(section));

  return (
    <div className="flex h-full flex-col">
      <div className="px-8 py-8">
        <Link href="/admin" className="block">
          <Image src="/logo.png" alt="Taxpropath" width={1024} height={318} priority className="h-9 w-auto dark:rounded-lg dark:bg-white dark:px-2 dark:py-1" />
          <span className="mt-2 block text-[11px] font-bold uppercase tracking-widest text-slate-400">Admin panel</span>
        </Link>
      </div>

      <nav className="custom-scrollbar flex-1 space-y-8 overflow-y-auto px-5 pb-6">
        {NAV_GROUPS.map((group) => {
          const links = group.links.filter((l) => may(l.section));
          if (links.length === 0) return null;
          return (
            <div key={group.title}>
              <p className="mb-3 px-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {group.title}
              </p>
              <div className="space-y-1">
                {links.map(({ href, label, icon: Icon }) => {
                  const active = isActive(pathname, href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={clsx(
                        "flex items-center gap-3.5 rounded-2xl px-4 py-3 text-[14px] font-semibold transition-all duration-200",
                        active
                          ? "bg-brand-gradient text-white shadow-md shadow-brand-600/20 dark:shadow-none"
                          : "text-slate-500 hover:bg-brand-50 hover:text-brand-700 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white",
                      )}
                    >
                      <Icon
                        className={clsx("size-[18px] shrink-0", active ? "text-white" : "text-slate-400 dark:text-slate-500")}
                        aria-hidden
                      />
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
