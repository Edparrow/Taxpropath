import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Keeps the admin session fresh. Server Components can't write cookies, so
 * without this an expired access token (they last an hour) would be refreshed
 * again on every page instead of once. Runs on the admin panel and the
 * customer account pages.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!isSupabaseConfigured()) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refreshes the token if it has expired and writes the new cookies.
  await supabase.auth.getClaims();

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/admin-login", "/account/:path*", "/reset-password"],
};
