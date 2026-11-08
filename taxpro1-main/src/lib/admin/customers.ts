import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type Customer = {
  id: string;
  email: string;
  name: string;
  phone: string;
  company: string;
  address1: string;
  city: string;
  zip: string;
  ptin: string;
  registeredAt: string;
  lastSignInAt: string | null;
  confirmed: boolean;
  /** What's sitting in their cart right now (saved while signed in). */
  cart: { title: string; options: string; totalCents: number }[];
  cartUpdatedAt: string | null;
  paidOrders: number;
};

type SavedCartItem = { title?: string; options?: string; totalCents?: number };

/**
 * TaxProPath's registered customers. The login database is shared with
 * webtiq, so a customer is an account that has a TaxProPath profile — not
 * simply every auth user. Admin-only logins have no profile, so they're out
 * too. Needs the service role (emails and sign-in times live in auth.users).
 */
export async function loadCustomers(): Promise<Customer[]> {
  const db = createAdminClient();

  const { data: profiles, error } = await db
    .from("profiles")
    .select("id, first_name, last_name, phone, company, address1, city, zip, ptin, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!profiles?.length) return [];

  const wanted = new Set(profiles.map((p) => p.id));
  const authById = new Map<string, { email: string; created_at: string; last_sign_in_at: string | null; confirmed: boolean }>();

  for (let page = 1; authById.size < wanted.size; page++) {
    const { data, error: listError } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (listError) throw listError;
    for (const u of data.users) {
      if (wanted.has(u.id)) {
        authById.set(u.id, {
          email: u.email ?? "",
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at ?? null,
          confirmed: Boolean(u.email_confirmed_at),
        });
      }
    }
    if (data.users.length < 1000) break;
  }

  // Saved carts and paid-order counts. Both are optional extras: if the
  // 0003 migration hasn't run yet, the list still loads without them.
  const [{ data: carts }, { data: paid }] = await Promise.all([
    db.from("user_carts").select("user_id, items, updated_at"),
    db.from("orders").select("user_id").eq("status", "paid").is("deleted_at", null).not("user_id", "is", null),
  ]);
  const cartById = new Map((carts ?? []).map((c) => [c.user_id as string, c]));
  const paidById = new Map<string, number>();
  for (const o of paid ?? []) paidById.set(o.user_id, (paidById.get(o.user_id) ?? 0) + 1);

  return profiles
    .filter((p) => authById.has(p.id))
    .map((p) => {
      const auth = authById.get(p.id)!;
      return {
        id: p.id,
        email: auth.email,
        name: [p.first_name, p.last_name].filter(Boolean).join(" "),
        phone: p.phone ?? "",
        company: p.company ?? "",
        address1: p.address1 ?? "",
        city: p.city ?? "",
        zip: p.zip ?? "",
        ptin: p.ptin ?? "",
        registeredAt: auth.created_at,
        lastSignInAt: auth.last_sign_in_at,
        confirmed: auth.confirmed,
        cart: ((cartById.get(p.id)?.items ?? []) as SavedCartItem[]).map((i) => ({
          title: String(i.title ?? ""),
          options: String(i.options ?? ""),
          totalCents: Number(i.totalCents ?? 0),
        })),
        cartUpdatedAt: (cartById.get(p.id)?.updated_at as string | undefined) ?? null,
        paidOrders: paidById.get(p.id) ?? 0,
      };
    });
}
