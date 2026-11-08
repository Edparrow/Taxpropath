import { NextResponse, after } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { sendIncompleteEmail } from "@/lib/customer-journey";

/**
 * Called when the buyer closes the PayPal window without paying. The order
 * stays unpaid (it shows under Failed / Abandoned) and the buyer gets one
 * "Registration Incomplete" email with links back to their courses.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured() || !hasServiceRoleKey()) {
    return new NextResponse(null, { status: 204 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const paypalOrderId = String(body?.paypalOrderId ?? "").trim();
  if (!/^[A-Z0-9]{5,32}$/i.test(paypalOrderId)) {
    return NextResponse.json({ error: "Invalid payment reference." }, { status: 400 });
  }

  // Only the buyer's own, still-unpaid order.
  const { data: order } = await createAdminClient()
    .from("orders")
    .select("id, user_id, status")
    .eq("paypal_order_id", paypalOrderId)
    .maybeSingle();
  if (!order || order.user_id !== user.id || order.status === "paid") {
    return new NextResponse(null, { status: 204 });
  }

  after(() => sendIncompleteEmail(order.id));
  return new NextResponse(null, { status: 204 });
}
