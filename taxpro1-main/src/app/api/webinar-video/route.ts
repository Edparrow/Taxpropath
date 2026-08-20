import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 2; // long enough to watch in one sitting

/**
 * Mints a short-lived signed URL for a webinar recording.
 *
 * Recordings live in a private bucket and are paid content, so access is
 * decided here: the caller must be an admin, or must have a *paid* order
 * containing this webinar. Everything is re-checked server-side; nothing is
 * taken from the request beyond the slug.
 */
export async function GET(request: Request) {
  if (!isSupabaseConfigured() || !hasServiceRoleKey()) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  const slug = new URL(request.url).searchParams.get("slug")?.trim();
  if (!slug || !/^[a-z0-9-]{1,120}$/.test(slug)) {
    return NextResponse.json({ error: "Invalid webinar." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to watch this recording." },
      { status: 401 },
    );
  }

  const admin = createAdminClient();

  const { data: webinar } = await admin
    .from("webinars")
    .select("id, slug, video_path, video_url")
    .eq("slug", slug)
    .maybeSingle();

  if (!webinar) {
    return NextResponse.json({ error: "Webinar not found." }, { status: 404 });
  }
  if (!webinar.video_path && !webinar.video_url) {
    return NextResponse.json(
      { error: "No recording is available for this webinar yet." },
      { status: 404 },
    );
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  let entitled = profile?.role === "admin";

  if (!entitled) {
    // Only a settled order counts — `pending` means payment never completed.
    const { data: paidItems } = await admin
      .from("order_items")
      .select("id, orders!inner(user_id, status)")
      .eq("webinar_slug", slug)
      .eq("orders.user_id", user.id)
      .eq("orders.status", "paid")
      .limit(1);

    entitled = Boolean(paidItems?.length);
  }

  if (!entitled) {
    return NextResponse.json(
      { error: "You haven't purchased this webinar." },
      { status: 403 },
    );
  }

  // Externally hosted recordings have their own access control upstream.
  if (!webinar.video_path) {
    return NextResponse.json({ url: webinar.video_url, kind: "external" });
  }

  const { data: signed, error } = await admin.storage
    .from("webinar-videos")
    .createSignedUrl(webinar.video_path, SIGNED_URL_TTL_SECONDS);

  if (error || !signed) {
    console.error("[webinar-video] signing failed", error);
    return NextResponse.json(
      { error: "Could not load the recording." },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: signed.signedUrl, kind: "signed" });
}
