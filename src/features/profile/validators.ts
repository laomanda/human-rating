import {
  ALLOWED_AVATAR_MIME_TYPES,
  MAX_AVATAR_SIZE_BYTES,
  MAX_AVATAR_SIZE_LABEL,
  PROFILE_LIMITS,
} from "@/features/profile/constants";

const USERNAME_PATTERN =
  /^[a-z0-9._]+$/;

export function normalizeUsername(
  value: string,
): string {
  return value.trim().toLowerCase();
}

export function validateFullName(
  value: string,
): string | null {
  const normalized = value.trim();

  if (!normalized) {
    return "Nama tampilan wajib diisi.";
  }

  if (
    normalized.length <
      PROFILE_LIMITS.fullNameMin ||
    normalized.length >
      PROFILE_LIMITS.fullNameMax
  ) {
    return `Nama tampilan harus ${PROFILE_LIMITS.fullNameMin}–${PROFILE_LIMITS.fullNameMax} karakter.`;
  }

  return null;
}

export function validateUsername(
  value: string,
): string | null {
  const normalized =
    normalizeUsername(value);

  if (!normalized) {
    return "Username wajib diisi.";
  }

  if (
    normalized.length <
      PROFILE_LIMITS.usernameMin ||
    normalized.length >
      PROFILE_LIMITS.usernameMax
  ) {
    return `Username harus ${PROFILE_LIMITS.usernameMin}–${PROFILE_LIMITS.usernameMax} karakter.`;
  }

  if (!USERNAME_PATTERN.test(normalized)) {
    return "Username hanya boleh berisi huruf kecil, angka, titik, dan underscore.";
  }

  return null;
}

export function validateBio(
  value: string,
): string | null {
  if (
    value.trim().length >
    PROFILE_LIMITS.bioMax
  ) {
    return `Bio maksimal ${PROFILE_LIMITS.bioMax} karakter.`;
  }

  return null;
}

export function validateTimeZone(
  value: string,
): string | null {
  if (!value.trim()) {
    return "Timezone wajib dipilih.";
  }

  return null;
}

export function validateAvatarFile(
  file: File,
): string | null {
  const isAllowedType =
    ALLOWED_AVATAR_MIME_TYPES.includes(
      file.type as
        (typeof ALLOWED_AVATAR_MIME_TYPES)[number],
    );

  if (!isAllowedType) {
    return "Format foto harus JPG, PNG, atau WEBP.";
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return `Ukuran foto maksimal ${MAX_AVATAR_SIZE_LABEL}.`;
  }

  return null;
}