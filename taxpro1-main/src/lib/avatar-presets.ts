/**
 * Ready-made profile avatars (DiceBear "Notionists" by Zoish, CC0). Each is
 * drawn on our own server at /api/avatar/<seed>, so choosing one just saves
 * that path as the profile's avatar_url.
 */
export const AVATAR_PRESETS = [
  "Aidan", "Brooklynn", "Caleb", "Destiny", "Eden", "Felix", "Garrett", "Harper",
  "Jameson", "Kimberly", "Leo", "Maria", "Nolan", "Sadie", "Ryker", "Valentina",
] as const;

export type AvatarPreset = (typeof AVATAR_PRESETS)[number];

export const presetUrl = (seed: AvatarPreset) => `/api/avatar/${seed}`;

export const isPreset = (seed: string): seed is AvatarPreset =>
  (AVATAR_PRESETS as readonly string[]).includes(seed);
