import type { SupabaseClient } from "@supabase/supabase-js";

import type { ProfileRecord } from "@/features/profile/types";

const PROFILE_SELECT = [
  "id",
  "username",
  "full_name",
  "avatar_url",
  "bio",
  "timezone",
  "onboarding_completed",
  "account_status",
  "created_at",
  "updated_at",
].join(",");

/**
 * Mengambil profil milik authenticated user.
 *
 * RLS profiles tetap menjadi lapisan keamanan
 * pada database.
 */
export async function getMyProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfileRecord | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Profil gagal dimuat: ${error.message}`,
    );
  }

  return data as ProfileRecord | null;
}