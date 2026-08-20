import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const subject = String(body.subject ?? "").trim();
  const message = String(body.message ?? "").trim();

  if (!name || !message || !email.includes("@")) {
    return NextResponse.json(
      { error: "Name, a valid email, and a message are required." },
      { status: 400 },
    );
  }
  if (message.length > 5000) {
    return NextResponse.json({ error: "Message is too long." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    console.info("[contact] Supabase not configured; message not persisted", { email });
    return NextResponse.json({ ok: true, persisted: false });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("contact_messages")
    .insert({ name, email, subject: subject || null, message });

  if (error) {
    console.error("[contact] insert failed", error);
    return NextResponse.json(
      { error: "We couldn't send your message. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, persisted: true });
}
