import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  CompleteOnboardingInput,
  ProfileRpcResult,
  UsernameAvailabilityResult,
} from "@/features/profile/types";

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null
  );
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
      typeof value.normalized_username ===
      "string"
        ? value.normalized_username
        : null,
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
      "Respons onboarding tidak valid.",
    );
  }

  return {
    success: value.success,
    code: value.code,
    message: value.message,
    daily_match_start_date:
      typeof value.daily_match_start_date ===
      "string"
        ? value.daily_match_start_date
        : null,
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