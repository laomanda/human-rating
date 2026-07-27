import type { SupabaseClient } from "@supabase/supabase-js";

import {
  ALLOWED_AVATAR_MIME_TYPES,
  AVATAR_BUCKET,
} from "@/features/profile/constants";

import type { UploadedAvatar } from "@/features/profile/types";

import { validateAvatarFile } from "@/features/profile/validators";

const MIME_TYPE_TO_EXTENSION: Record<
  (typeof ALLOWED_AVATAR_MIME_TYPES)[number],
  string
> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Mengunggah avatar baru ke folder user.
 *
 * Object path:
 * {userId}/avatar-{uuid}.{extension}
 */
export async function uploadAvatar(
  supabase: SupabaseClient,
  userId: string,
  file: File,
): Promise<UploadedAvatar> {
  const validationError =
    validateAvatarFile(file);

  if (validationError) {
    throw new Error(validationError);
  }

  const extension =
    MIME_TYPE_TO_EXTENSION[
      file.type as
        (typeof ALLOWED_AVATAR_MIME_TYPES)[number]
    ];

  const path =
    `${userId}/avatar-` +
    `${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(
      `Upload foto profil gagal: ${error.message}`,
    );
  }

  const { data } = supabase.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(path);

  if (!data.publicUrl) {
    await removeAvatar(supabase, path);

    throw new Error(
      "URL foto profil gagal dibuat.",
    );
  }

  return {
    path,
    publicUrl: data.publicUrl,
  };
}

/**
 * Cleanup avatar yang gagal digunakan oleh profil.
 *
 * Error cleanup dicatat tetapi tidak menggantikan
 * error utama onboarding.
 */
export async function removeAvatar(
  supabase: SupabaseClient,
  path: string,
): Promise<void> {
  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .remove([path]);

  if (error) {
    console.error(
      "Avatar cleanup failed:",
      error.message,
    );
  }
}