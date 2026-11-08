import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { reportDbError } from "@/lib/errors/log";

/** Data for the customer's own account pages (/account). */

export type Profile = {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  company: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  zip: string | null;
  ptin: string | null;
  country: string | null;
  region: string | null;
  created_at: string | null;
};

export const PROFILE_FIELDS = [
  "first_name",
  "last_name",
  "phone",
  "company",
  "address1",
  "address2",
  "city",
  "zip",
  "ptin",
  "country",
  "region",
] as const;

export type MyOrder = {
  id: string;
  status: "paid" | "refunded";
  subtotal_cents: number;
  discount_cents: number | null;
  coupon_code: string | null;
  paypal_capture_id: string | null;
  payment_method: "paypal" | "manual";
  paid_at: string | null;
  created_at: string;
  order_items: { id: string; title_snapshot: string; option_snapshot: string }[];
};

const MY_ORDER_COLUMNS = `
  id, status, subtotal_cents, discount_cents, coupon_code, paypal_capture_id,
  payment_method, paid_at, created_at,
  order_items ( id, title_snapshot, option_snapshot )
`;

/**
 * The signed-in customer, checked with Supabase (getUser) rather than trusting
 * the cookie, so email_confirmed_at is reliable. Cached per request so the
 * layout and the page share one lookup.
 */
export const getCustomer = cache(async (): Promise<User | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
});

/** Sends visitors who aren't signed in to the login page, then back here. */
export async function requireCustomer(nextPath: string): Promise<User> {
  const user = await getCustomer();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}

export const getMyProfile = cache(async (userId: string): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(`${PROFILE_FIELDS.join(", ")}, created_at`)
    .eq("id", userId)
    .maybeSingle();
  if (error) reportDbError("Loading the customer profile", error);
  return (data as Profile | null) ?? null;
});

/**
 * Paid and refunded orders, newest first. Checkout orders carry the user's id
 * and are read through RLS. Orders an admin entered by hand carry only an
 * email, so those are matched by the account's email — but only once that
 * email is confirmed, so nobody can claim them by registering someone else's
 * address.
 */
export const getMyOrders = cache(async (user: User): Promise<MyOrder[]> => {
  const supabase = await createClient();
  const { data: own, error } = await supabase
    .from("orders")
    .select(MY_ORDER_COLUMNS)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .in("status", ["paid", "refunded"]);
  if (error) reportDbError("Loading My Orders", error);

  let manual: MyOrder[] = [];
  if (user.email && user.email_confirmed_at && hasServiceRoleKey()) {
    const { data, error: manualError } = await createAdminClient()
      .from("orders")
      .select(MY_ORDER_COLUMNS)
      .is("user_id", null)
      .eq("guest_email", user.email.toLowerCase())
      .is("deleted_at", null)
      .in("status", ["paid", "refunded"]);
    if (manualError) reportDbError("Loading manual orders for My Orders", manualError);
    manual = (data ?? []) as unknown as MyOrder[];
  }

  const orders = [...((own ?? []) as unknown as MyOrder[]), ...manual];
  const when = (o: MyOrder) => o.paid_at ?? o.created_at;
  return orders.sort((a, b) => when(b).localeCompare(when(a)));
});

export const myOrderTotalCents = (o: MyOrder) => o.subtotal_cents - (o.discount_cents ?? 0);

export const displayName = (user: User, profile: Profile | null) =>
  [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
  user.email?.split("@")[0] ||
  "there";

export const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
