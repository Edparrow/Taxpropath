"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/components/use-user";
import { cn } from "@/lib/utils";

/**
 * Shows an Admin entry point to admins only.
 *
 * The role is read in the browser rather than passed down from the layout on
 * purpose: reading the session server-side in the root layout would opt every
 * page out of static rendering. The "own profile" RLS policy lets a signed-in
 * user read their own row, and /admin is gated by requireAdmin() regardless, so
 * this link is a convenience rather than the access control.
 */
export function AdminLink({ className }: { className?: string }) {
  const user = useUser();
  /*
   * Stores which account was confirmed as an admin rather than a bare boolean,
   * so signing out is handled by deriving the flag below instead of resetting
   * state synchronously inside the effect.
   */
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    let active = true;
    const supabase = createClient();

    supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data?.role === "admin") setAdminUserId(user.id);
      });

    return () => {
      active = false;
    };
  }, [user]);

  if (!user || adminUserId !== user.id) return null;

  return (
    <Link
      href="/admin"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-2 border-brand-600 px-5 py-2 text-sm font-bold text-brand-700 transition-colors duration-200 hover:bg-brand-50",
        className,
      )}
    >
      <ShieldCheck className="size-4" aria-hidden />
      Admin
    </Link>
  );
}
