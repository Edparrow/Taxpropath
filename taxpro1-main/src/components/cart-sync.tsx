"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { cartLineTotalCents, type CartLine } from "@/lib/types";

/**
 * Mirrors a signed-in customer's cart to the database (user_carts), so
 * Admin > Registered Users can show what each person is about to buy — the
 * "Cart Items" column SkillSync has. The browser copy stays the source of
 * truth; this only reports it. Anonymous visitors are never tracked.
 */
export function CartSync({ lines }: { lines: CartLine[] }) {
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    const items = lines.map((l) => ({
      slug: l.courseSlug,
      title: l.title,
      options: ["Self-Study", ...l.addons.map((a) => a.label)].join(" + "),
      totalCents: cartLineTotalCents(l),
    }));
    const payload = JSON.stringify(items);

    async function push(userId: string) {
      const key = `${userId}:${payload}`;
      if (lastSent.current === key) return;
      lastSent.current = key;
      const { error } = await supabase
        .from("user_carts")
        .upsert({ user_id: userId, items, updated_at: new Date().toISOString() });
      if (error) lastSent.current = null; // try again on the next change
    }

    // Debounced, so ticking add-ons doesn't send a write per click.
    const timer = window.setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user.id;
      if (userId) await push(userId);
    }, 800);

    // Signing in mid-visit reports the cart they built while signed out.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user.id) void push(session.user.id);
    });

    return () => {
      window.clearTimeout(timer);
      sub.subscription.unsubscribe();
    };
  }, [lines]);

  return null;
}
