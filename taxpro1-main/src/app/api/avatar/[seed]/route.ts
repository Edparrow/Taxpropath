import { createAvatar } from "@dicebear/core";
import * as notionists from "@dicebear/notionists";
import { isPreset } from "@/lib/avatar-presets";

/** Draws one of the ready-made profile avatars as an SVG (cached for a year). */
export async function GET(_request: Request, { params }: { params: Promise<{ seed: string }> }) {
  const { seed } = await params;
  if (!isPreset(seed)) return new Response("Not found", { status: 404 });

  const svg = createAvatar(notionists, {
    seed,
    backgroundColor: ["dcfce7", "dbeafe", "fef3c7", "e0e7ff", "ccfbf1", "fce7f3"],
  }).toString();

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
      // The SVG is ours, but never let it run anything if opened directly.
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
    },
  });
}
