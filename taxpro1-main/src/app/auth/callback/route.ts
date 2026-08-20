import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/next-path";

/**
 * Landing point for the links Supabase emails out — signup confirmation and
 * password recovery. Exchanging the one-time credential here (rather than
 * relying on the project's Site URL) means the link returns to whichever origin
 * sent it, so local and deployed sign-ups both work.
 *
 * Two link shapes exist: `?code=` for the PKCE flow the browser client uses, and
 * `?token_hash=&type=` for the older verification links. Both are handled so a
 * change to the email template can't break confirmation.
 */

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeNextPath(searchParams.get("next"));

  // Supabase reports a rejected link (expired, already used) on the query string.
  const errorDescription =
    searchParams.get("error_description") ?? searchParams.get("error");
  if (errorDescription) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription)}`,
    );
  }

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(
      "That confirmation link is incomplete. Request a new one below.",
    )}`,
  );
}
