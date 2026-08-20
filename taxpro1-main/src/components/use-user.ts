"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

/**
 * Client-side auth state for UI that has to differ for signed-in visitors.
 *
 * `undefined` means "still resolving" and is deliberately distinct from `null`
 * ("signed out") — rendering a Register prompt during the first tick would make
 * the cart flash a sign-up call to action at users who are already signed in.
 *
 * This is presentation only. Purchases are gated server-side in the PayPal
 * route handlers, which is what actually enforces the requirement.
 */
export function useUser(): User | null | undefined {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (active) setUser(data.user ?? null);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return user;
}
