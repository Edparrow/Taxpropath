/**
 * The repo ships with placeholder env values so the app runs before a Supabase
 * project exists. Routes use this to persist when configured and no-op when not.
 */
export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return (
    url.startsWith("https://") &&
    !url.includes("your-project-ref") &&
    key.length > 20 &&
    !key.startsWith("your-")
  );
}
