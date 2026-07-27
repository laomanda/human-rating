export const AVATAR_BUCKET = "avatars";

export const MAX_AVATAR_SIZE_BYTES =
  2 * 1024 * 1024;

export const MAX_AVATAR_SIZE_LABEL =
  "2 MB";

export const ALLOWED_AVATAR_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const TIME_ZONE_OPTIONS = [
  {
    value: "Asia/Jakarta",
    label: "WIB — Jakarta",
  },
  {
    value: "Asia/Makassar",
    label: "WITA — Makassar",
  },
  {
    value: "Asia/Jayapura",
    label: "WIT — Jayapura",
  },
] as const;

export const PROFILE_LIMITS = {
  fullNameMin: 2,
  fullNameMax: 80,
  usernameMin: 4,
  usernameMax: 20,
  bioMax: 160,
} as const;