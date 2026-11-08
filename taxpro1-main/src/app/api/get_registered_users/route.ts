import { NextResponse } from "next/server";
import { hasServiceRoleKey } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { feedKeyMatches } from "@/lib/engine";
import { loadCustomers } from "@/lib/admin/customers";

export const dynamic = "force-dynamic";

/**
 * Registered customers for the CRM (SkillSync's api/get_registered_users).
 * GET /api/get_registered_users?api_key=…[&since=ISO]
 * Contact details only — never password hashes or session data.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  if (!feedKeyMatches(url.searchParams.get("api_key"), process.env.ORDERS_API_KEY)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured() || !hasServiceRoleKey()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const since = url.searchParams.get("since");
  const sinceIso = since && !Number.isNaN(Date.parse(since)) ? new Date(since).toISOString() : null;

  try {
    const users = (await loadCustomers())
      .filter((u) => !sinceIso || u.registeredAt >= sinceIso)
      .map((u) => ({
        user_id: u.id,
        email: u.email,
        name: u.name,
        mobile: u.phone,
        company: u.company,
        address: u.address1,
        city: u.city,
        zip: u.zip,
        ptin_number: u.ptin,
        email_confirmed: u.confirmed,
        registered_at: u.registeredAt,
        last_sign_in_at: u.lastSignInAt ?? "",
        paid_orders: u.paidOrders,
        cart_items: u.cart.map((c) => `${c.title} (${c.options})`),
      }));
    return NextResponse.json({ users });
  } catch (err) {
    console.error("[get_registered_users] failed", err);
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }
}
