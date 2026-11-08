"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFormStatus } from "react-dom";
import { KeyRound, LogOut, Receipt, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutCustomer } from "./actions";

const LINKS = [
  { href: "/account", label: "My Profile", icon: UserRound, match: ["/account", "/account/edit"] },
  { href: "/account/orders", label: "My Orders", icon: Receipt, match: ["/account/orders"] },
  { href: "/account/password", label: "Change Password", icon: KeyRound, match: ["/account/password"] },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="My account" className="space-y-1">
      {LINKS.map(({ href, label, icon: Icon, match }) => {
        const active = match.includes(pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-2.5 text-[14.5px] font-semibold transition-colors duration-200",
              active
                ? "bg-brand-gradient text-white shadow-md shadow-brand-600/20"
                : "text-ink hover:bg-brand-50 hover:text-brand-700",
            )}
          >
            <Icon className="size-4.5 shrink-0" aria-hidden />
            {label}
          </Link>
        );
      })}
      <form action={signOutCustomer}>
        <SignOutButton />
      </form>
    </nav>
  );
}

function SignOutButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 text-left text-[14.5px] font-semibold text-ink transition-colors duration-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
    >
      <LogOut className="size-4.5 shrink-0" aria-hidden />
      {pending ? "Signing out…" : "Logout"}
    </button>
  );
}
