"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ExternalLink, Menu, ShoppingCart, X } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { AccountMenu } from "@/components/account-menu";
import { useUser } from "@/components/use-user";
import { PORTAL_URL } from "@/lib/portal";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/about-us", label: "About Us" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const user = useUser();
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
            alt="Taxpropath — Accounting &amp; Tax CPE Courses"
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
          {/* Always shown while signed in — courses play in the portal, not here. */}
          {user ? (
            <a
              href={PORTAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 rounded-full bg-navy-950 px-4 py-2 text-[13px] font-bold text-white transition-colors duration-200 hover:bg-brand-600 sm:inline-flex"
            >
              Open My Portal
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          ) : null}

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
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-ink hover:bg-brand-50"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-slate-200 pt-4">
              {user ? (
                <a
                  href={PORTAL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-navy-950 px-4 py-3 text-sm font-bold text-white"
                >
                  Open My Portal
                  <ExternalLink className="size-4" aria-hidden />
                </a>
              ) : null}
              <AccountMenu variant="mobile" />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
