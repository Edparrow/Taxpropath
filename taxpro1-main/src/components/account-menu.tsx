"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, UserPlus, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/components/use-user";

/**
 * Login/Register for visitors, account + sign out once signed in.
 *
 * While auth is still resolving (`undefined`) this renders a fixed-width
 * placeholder rather than the signed-out buttons: showing Login to someone who
 * is already signed in, then swapping it a tick later, reads as a glitch and
 * shifts the header layout.
 */
export function AccountMenu({ variant }: { variant: "desktop" | "mobile" }) {
  const user = useUser();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setSigningOut(false);
    router.refresh();
  }

  if (user === undefined) {
    return variant === "desktop" ? (
      <span aria-hidden className="hidden h-10 w-44 sm:block" />
    ) : null;
  }

  if (variant === "mobile") {
    if (user) {
      return (
        <div className="flex flex-col gap-2">
          <p className="truncate px-4 text-[13px] font-semibold text-ink-muted">
            {user.email}
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="cursor-pointer rounded-full border-2 border-slate-300 py-2.5 text-center text-sm font-bold text-ink disabled:opacity-60"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      );
    }

    return (
      <div className="flex gap-2">
        <Link
          href="/login"
          className="flex-1 rounded-full border-2 border-slate-300 py-2.5 text-center text-sm font-bold text-ink"
        >
          Login
        </Link>
        <Link
          href="/register"
          className="flex-1 rounded-full bg-brand-gradient py-2.5 text-center text-sm font-bold text-white"
        >
          Register
        </Link>
      </div>
    );
  }

  if (user) {
    return (
      <>
        <span className="hidden max-w-[12rem] items-center gap-1.5 truncate rounded-full bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700 sm:inline-flex">
          <UserRound className="size-4 shrink-0" aria-hidden />
          <span className="truncate">{user.email}</span>
        </span>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="hidden cursor-pointer items-center gap-1.5 rounded-full border-2 border-slate-300 px-5 py-2 text-sm font-bold text-ink transition-colors duration-200 hover:border-brand-600 hover:text-brand-700 disabled:opacity-60 sm:inline-flex"
        >
          <LogOut className="size-4" aria-hidden />
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </>
    );
  }

  return (
    <>
      <Link
        href="/login"
        className="hidden items-center gap-1.5 rounded-full border-2 border-slate-300 px-5 py-2 text-sm font-bold text-ink transition-colors duration-200 hover:border-brand-600 hover:text-brand-700 sm:inline-flex"
      >
        <LogIn className="size-4" aria-hidden />
        Login
      </Link>
      <Link
        href="/register"
        className="hidden items-center gap-1.5 rounded-full bg-brand-gradient px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-600/25 transition-transform duration-200 hover:-translate-y-0.5 sm:inline-flex"
      >
        <UserPlus className="size-4" aria-hidden />
        Register
      </Link>
    </>
  );
}
