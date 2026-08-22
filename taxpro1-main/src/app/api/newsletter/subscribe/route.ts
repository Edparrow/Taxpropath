import { NextResponse } from "next/server";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();

  if (!email.includes("@") || email.length > 300) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (!hasServiceRoleKey()) {
    return NextResponse.json({ ok: true, persisted: false });
  }

  /*
   * Anonymous visitors only have an insert policy on this table (no update),
   * so resubscribing an existing, unsubscribed email needs the service role —
   * an upsert's ON CONFLICT DO UPDATE path would otherwise fail RLS.
   */
  const admin = createAdminClient();
  const { error } = await admin
    .from("newsletter_subscribers")
    .upsert({ email, is_active: true, unsubscribed_at: null }, { onConflict: "email" });

  if (error) {
    console.error("[newsletter] subscribe failed", error);
    return NextResponse.json(
      { error: "We couldn't subscribe you. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, persisted: true });
}
