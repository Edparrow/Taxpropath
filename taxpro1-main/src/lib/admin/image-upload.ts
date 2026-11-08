/**
 * Rules for admin image uploads, shared by the browser-side check and the
 * server action so both reject the same files.
 */

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_MAX_LABEL = "5 MB";
export const IMAGE_ACCEPT = "image/webp,image/png,.webp,.png";
export const IMAGE_MIME_TYPES = ["image/webp", "image/png"] as const;

export type ImageKind = { ext: "png" | "webp"; mime: (typeof IMAGE_MIME_TYPES)[number] };

/**
 * Identifies a file by its first bytes rather than its name or the type the
 * browser claims, so a renamed .jpg or script can't slip through.
 */
export function sniffImage(bytes: Uint8Array): ImageKind | null {
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= 8 && png.every((b, i) => bytes[i] === b)) {
    return { ext: "png", mime: "image/png" };
  }
  // WebP: "RIFF" <4-byte size> "WEBP"
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") {
    return { ext: "webp", mime: "image/webp" };
  }
  return null;
}
