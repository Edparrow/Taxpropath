import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

/** Streams the subscriber list as a CSV download — mirrors the reference panel's export. */
export async function GET() {
  await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("newsletter_subscribers")
    .select("email, is_active, subscribed_at")
    .order("subscribed_at", { ascending: false });

  const rows = data ?? [];
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;

  const csv = [
    "email,status,subscribed_at",
    ...rows.map((r) =>
      [escape(r.email), r.is_active ? "active" : "unsubscribed", r.subscribed_at].join(","),
    ),
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="subscribers.csv"`,
    },
  });
}
