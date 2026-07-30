"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

/**
 * Saves or updates an FCM device token for the current user.
 * Handles duplicate tokens via upsert and deactivates stale tokens.
 */
export async function saveDeviceToken(
  token: string,
  platform: string = "web",
  deviceName: string = "",
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Tidak terautentikasi" };
  }

  // Upsert the token — if it already exists, update last_seen_at
  const { error: upsertError } = await supabase
    .from("device_tokens")
    .upsert(
      {
        user_id: user.id,
        token,
        platform,
        device_name: deviceName || navigator?.userAgent?.slice(0, 100) || "web",
        app_version: "1.0.0",
        is_active: true,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "token",
      },
    );

  if (upsertError) {
    console.error("Failed to save device token:", upsertError.message);
    return { success: false, error: upsertError.message };
  }

  return { success: true };
}

/**
 * Deactivates a specific FCM token for the current user.
 */
export async function removeDeviceToken(token: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Tidak terautentikasi" };
  }

  const { error } = await supabase
    .from("device_tokens")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("token", token)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to remove device token:", error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Gets the push notification preference for the current user.
 * Returns true if no preference row exists (default).
 */
export async function getPushPreference(): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return true;
  }

  const { data } = await supabase
    .from("notification_preferences")
    .select("push_enabled")
    .eq("user_id", user.id)
    .single();

  // If no row exists, default to true
  if (!data) return true;

  return data.push_enabled === true;
}

/**
 * Updates push notification preference for the current user.
 * Creates the preference row if it doesn't exist.
 */
export async function updatePushPreference(enabled: boolean) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Tidak terautentikasi" };
  }

  const { data, error } = await supabase.rpc(
    "update_my_notification_preference",
    {
      p_push_enabled: enabled,
    },
  );

  if (error) {
    console.error("Push preference update failed", {
      code: error.code ?? null,
    });
    return {
      success: false,
      error: "Gagal memperbarui preferensi notifikasi.",
    };
  }

  if (
    typeof data !== "object" ||
    data === null ||
    Array.isArray(data) ||
    data.success !== true
  ) {
    return {
      success: false,
      error: "Preferensi notifikasi tidak dapat disimpan.",
    };
  }

  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard/settings");

  return { success: true };
}
