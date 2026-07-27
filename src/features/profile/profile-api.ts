import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  CompleteOnboardingInput,
  ProfileRpcProfile,
  ProfileRpcResult,
  UpdateProfileInput,
  UsernameAvailabilityResult,
} from "@/features/profile/types";

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function toNullableString(
  value: unknown,
): string | null {
  return typeof value === "string"
    ? value
    : null;
}

function parseRpcProfile(
  value: unknown,
): ProfileRpcProfile | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.timezone !== "string" ||
    typeof value.onboarding_completed !==
      "boolean"
  ) {
    return undefined;
  }

  return {
    id: value.id,
    full_name: toNullableString(
      value.full_name,
    ),
    username: toNullableString(
      value.username,
    ),
    bio: toNullableString(value.bio),
    avatar_url: toNullableString(
      value.avatar_url,
    ),
    timezone: value.timezone,
    onboarding_completed:
      value.onboarding_completed,
  };
}

function parseUsernameAvailabilityResult(
  value: unknown,
): UsernameAvailabilityResult {
  if (
    !isRecord(value) ||
    typeof value.success !== "boolean" ||
    typeof value.available !== "boolean" ||
    typeof value.code !== "string" ||
    typeof value.message !== "string"
  ) {
    throw new Error(
      "Respons pengecekan username tidak valid.",
    );
  }

  return {
    success: value.success,
    available: value.available,
    code: value.code,
    message: value.message,
    normalized_username:
      toNullableString(
        value.normalized_username,
      ),
  };
}

function parseProfileRpcResult(
  value: unknown,
): ProfileRpcResult {
  if (
    !isRecord(value) ||
    typeof value.success !== "boolean" ||
    typeof value.code !== "string" ||
    typeof value.message !== "string"
  ) {
    throw new Error(
      "Respons perubahan profil tidak valid.",
    );
  }

  return {
    success: value.success,
    code: value.code,
    message: value.message,
    daily_match_start_date:
      toNullableString(
        value.daily_match_start_date,
      ),
    profile: parseRpcProfile(
      value.profile,
    ),
  };
}

export async function checkUsernameAvailability(
  supabase: SupabaseClient,
  username: string,
): Promise<UsernameAvailabilityResult> {
  const { data, error } =
    await supabase.rpc(
      "check_username_availability",
      {
        p_username: username,
      },
    );

  if (error) {
    throw new Error(
      `Pengecekan username gagal: ${error.message}`,
    );
  }

  return parseUsernameAvailabilityResult(
    data,
  );
}

export async function completeMyOnboarding(
  supabase: SupabaseClient,
  input: CompleteOnboardingInput,
): Promise<ProfileRpcResult> {
  const { data, error } =
    await supabase.rpc(
      "complete_my_onboarding",
      {
        p_full_name: input.fullName,
        p_username: input.username,
        p_bio: input.bio,
        p_timezone: input.timezone,
        p_avatar_url: input.avatarUrl,
      },
    );

  if (error) {
    throw new Error(
      `Onboarding gagal: ${error.message}`,
    );
  }

  return parseProfileRpcResult(data);
}

export async function updateMyProfile(
  supabase: SupabaseClient,
  input: UpdateProfileInput,
): Promise<ProfileRpcResult> {
  const { data, error } =
    await supabase.rpc(
      "update_my_profile",
      {
        p_full_name: input.fullName,
        p_bio: input.bio,
        p_avatar_url: input.avatarUrl,
      },
    );

  if (error) {
    throw new Error(
      `Profil gagal diperbarui: ${error.message}`,
    );
  }

  return parseProfileRpcResult(data);
}