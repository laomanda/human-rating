"use server";

import { revalidatePath } from "next/cache";

import { updateMyProfile } from "@/features/profile/profile-api";
import {
  getManagedAvatarPath,
  removeAvatar,
  uploadAvatar,
} from "@/features/profile/avatar-storage";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { success: true } | { success: false; error: string };

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null };
  }

  return { supabase, user };
}

// ============================================================
// ACCOUNT SETTINGS
// ============================================================

export async function updateAccountSettingsAction(
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return { success: false, error: "Tidak terautentikasi." };
  }

  const fullName = (formData.get("full_name") as string | null)?.trim() ?? "";
  const bio = (formData.get("bio") as string | null)?.trim() ?? "";
  const avatarFile = formData.get("avatar") as File | null;

  if (!fullName || fullName.length < 2 || fullName.length > 80) {
    return {
      success: false,
      error: "Nama lengkap harus antara 2–80 karakter.",
    };
  }

  if (bio.length > 160) {
    return {
      success: false,
      error: "Bio maksimal 160 karakter.",
    };
  }

  // Handle avatar upload if a file is provided
  let avatarUrl: string | null = null;

  if (avatarFile && avatarFile.size > 0) {
    try {
      const uploaded = await uploadAvatar(supabase, user.id, avatarFile);
      avatarUrl = uploaded.publicUrl;

      // Clean up old avatar from Storage if it's a managed avatar
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .single();

      if (currentProfile?.avatar_url) {
        const oldPath = getManagedAvatarPath(
          currentProfile.avatar_url as string,
          user.id,
        );
        if (oldPath) {
          await removeAvatar(supabase, oldPath);
        }
      }
    } catch (err) {
      return {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Upload foto profil gagal.",
      };
    }
  }

  try {
    const result = await updateMyProfile(supabase, {
      fullName,
      bio,
      avatarUrl,
    });

    if (!result.success) {
      return { success: false, error: result.message };
    }

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/profile");

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Profil gagal diperbarui.",
    };
  }
}

// ============================================================
// PRIVACY SETTINGS
// ============================================================

export async function updatePrivacyAction(
  isPrivate: boolean,
): Promise<ActionResult> {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return { success: false, error: "Tidak terautentikasi." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ is_private: isPrivate, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    return { success: false, error: "Gagal memperbarui pengaturan privasi." };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/profile");

  return { success: true };
}

// ============================================================
// NOTIFICATION PREFERENCES
// ============================================================

type NotificationPrefsInput = {
  push_enabled: boolean;
  daily_reminder_enabled?: boolean;
  rating_completion_enabled?: boolean;
  achievement_notification_enabled?: boolean;
};

export async function updateNotificationPreferencesAction(
  prefs: NotificationPrefsInput,
): Promise<ActionResult> {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return { success: false, error: "Tidak terautentikasi." };
  }

  // Only pass columns existing in database table notification_preferences: user_id, push_enabled, email_enabled
  const { error } = await supabase
    .from("notification_preferences")
    .upsert(
      {
        user_id: user.id,
        push_enabled: prefs.push_enabled,
        email_enabled: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (error) {
    console.error("Failed to update notification preferences:", error.message);
    return {
      success: false,
      error: "Gagal memperbarui preferensi notifikasi.",
    };
  }

  revalidatePath("/dashboard/settings");

  return { success: true };
}

// ============================================================
// ACCOUNT DELETION
// ============================================================

export async function requestAccountDeletionAction(): Promise<ActionResult> {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return { success: false, error: "Tidak terautentikasi." };
  }

  const { error } = await supabase.from("account_deletion_requests").insert({
    user_id: user.id,
    status: "pending",
    requested_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Account deletion request failed:", error.message);
    return {
      success: false,
      error:
        "Permintaan penghapusan akun gagal dikirim. Silakan coba lagi.",
    };
  }

  return { success: true };
}

// ============================================================
// LOGOUT
// ============================================================

export async function logoutAction(): Promise<ActionResult> {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return { success: false, error: "Tidak terautentikasi." };
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    return { success: false, error: "Logout gagal. Silakan coba lagi." };
  }

  return { success: true };
}
