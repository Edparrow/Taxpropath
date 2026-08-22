"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, ShoppingCart, X } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { AdminLink } from "@/components/admin-link";
import { AccountMenu } from "@/components/account-menu";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/about-us", label: "About Us" },
  {
    href: "/webinar",
    label: "Webinar",
    children: [
      { href: "/webinar/upcoming", label: "Upcoming Webinar" },
      { href: "/webinar/pre-recorded", label: "Pre Recorded Webinar" },
    ],
  },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    // Deferred so the initial read doesn't setState during the effect body.
    const frame = requestAnimationFrame(onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/95 shadow-[0_4px_24px_rgba(15,23,42,0.08)] backdrop-blur-lg"
          : "bg-cream",
      )}
      suppressHydrationWarning
    >
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0" aria-label="Taxpropath home">
          <Image
            src="/logo.png"
            alt="Taxpropath — Accounting &amp; Tax Webinars"
            width={1024}
            height={318}
            priority
            className="h-9 w-auto sm:h-10"
          />
        </Link>

        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            if (item.children) {
              return (
                <div key={item.href} className="group relative">
                  <button
                    className={cn(
                      "flex cursor-pointer items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200",
                      active
                        ? "bg-brand-50 text-brand-700"
                        : "text-ink hover:bg-brand-50 hover:text-brand-700",
                    )}
                  >
                    {item.label}
                    <ChevronDown className="size-4" aria-hidden />
                  </button>
                  <div className="invisible absolute left-0 top-full w-56 translate-y-1 rounded-2xl border border-slate-200/80 bg-white p-2 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block rounded-xl px-4 py-2.5 text-sm font-medium text-ink-muted transition-colors duration-200 hover:bg-brand-50 hover:text-brand-700"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink hover:bg-brand-50 hover:text-brand-700",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-4">
          <Link
            href="/cart"
            className="relative rounded-full p-2.5 text-ink transition-colors duration-200 hover:bg-brand-50 hover:text-brand-700"
            aria-label={`Cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
          >
            <ShoppingCart className="size-5" aria-hidden />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>

          <AdminLink className="hidden sm:inline-flex" />

          <AccountMenu variant="desktop" />

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="cursor-pointer rounded-full p-2.5 text-ink transition-colors duration-200 hover:bg-brand-50 lg:hidden"
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden">
          <nav
            className="flex flex-col gap-1"
            onClick={(e) => {
              // Close the drawer once a destination is chosen.
              if ((e.target as HTMLElement).closest("a")) setMobileOpen(false);
            }}
          >
            {NAV.flatMap((item) =>
              item.children
                ? [
                    <p
                      key={item.href}
                      className="px-4 pb-1 pt-3 text-xs font-bold uppercase tracking-wider text-slate-400"
                    >
                      {item.label}
                    </p>,
                    ...item.children.map((c) => (
                      <Link
                        key={c.href}
                        href={c.href}
                        className="rounded-xl px-4 py-3 text-sm font-semibold text-ink hover:bg-brand-50"
                      >
                        {c.label}
                      </Link>
                    )),
                  ]
                : [
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-xl px-4 py-3 text-sm font-semibold text-ink hover:bg-brand-50"
                    >
                      {item.label}
                    </Link>,
                  ],
            )}
            <div className="mt-3 flex flex-col gap-2 border-t border-slate-200 pt-4">
              <AdminLink className="justify-center" />
              <AccountMenu variant="mobile" />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
