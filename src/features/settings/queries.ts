"use server";

import { createClient } from "@/lib/supabase/server";

import type {
  SettingsData,
  SettingsNotificationPreferences,
  SettingsProfile,
} from "@/features/settings/types";

function toNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function toBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeProfile(raw: unknown): SettingsProfile | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== "string") return null;

  return {
    id: raw.id,
    username: toNullableString(raw.username),
    full_name: toNullableString(raw.full_name),
    avatar_url: toNullableString(raw.avatar_url),
    bio: toNullableString(raw.bio),
    is_private: toBoolean(raw.is_private, false),
  };
}

function normalizeNotificationPreferences(
  raw: unknown,
  userId: string,
): SettingsNotificationPreferences {
  if (!isRecord(raw)) {
    return {
      user_id: userId,
      push_enabled: true,
    };
  }

  const pushEnabled = toBoolean(raw.push_enabled, true);

  return {
    user_id: typeof raw.user_id === "string" ? raw.user_id : userId,
    push_enabled: pushEnabled,
  };
}

export async function getSettingsData(): Promise<SettingsData> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { profile: null, notificationPreferences: null };
  }

  const profileResult = await supabase
    .from("profiles")
    .select("id,username,full_name,avatar_url,bio,is_private")
    .eq("id", user.id)
    .maybeSingle();

  const prefsResult = await supabase
    .from("notification_preferences")
    .select("user_id,push_enabled")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    profile: normalizeProfile(profileResult.data as unknown),
    notificationPreferences: normalizeNotificationPreferences(
      prefsResult.data as unknown,
      user.id,
    ),
  };
}
