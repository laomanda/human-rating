import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  NotificationRow,
  NotificationType,
} from "@/features/notification/types";

const NOTIFICATION_SELECT = `
  id,
  user_id,
  type,
  title,
  message,
  is_read,
  reference_id,
  push_status,
  created_at
`;

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as UnknownRecord;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function normalizeNotificationType(value: unknown): NotificationType {
  const str = asString(value);
  if (
    str === "daily_reminder" ||
    str === "rating_completed" ||
    str === "achievement_unlocked" ||
    str === "system"
  ) {
    return str;
  }
  return "system";
}

function formatSupabaseError(context: string, error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const err = error as {
      code?: string;
      message?: string;
      details?: string;
      hint?: string;
    };
    const code = err.code ?? "UNKNOWN";
    const message = err.message ?? String(error);
    const details = err.details ?? "none";
    const hint = err.hint ?? "none";
    return `[Supabase ${context}] Code: ${code} | Message: ${message} | Details: ${details} | Hint: ${hint}`;
  }
  return `[Supabase ${context}] ${String(error)}`;
}

export function normalizeNotification(value: unknown): NotificationRow | null {
  const row = asRecord(value);
  if (!row) {
    return null;
  }

  const id = asString(row.id);
  const userId = asString(row.user_id);
  const title = asString(row.title);
  const message = asString(row.message);

  if (!id || !userId || !title || !message) {
    return null;
  }

  return {
    id,
    user_id: userId,
    type: normalizeNotificationType(row.type),
    title,
    message,
    is_read: row.is_read === true,
    reference_id: asString(row.reference_id),
    push_status: asString(row.push_status) ?? "pending",
    created_at: asString(row.created_at) ?? new Date().toISOString(),
  };
}

export type GetNotificationsResult = {
  notifications: NotificationRow[];
  error: string | null;
};

export async function getNotifications(
  supabase: SupabaseClient,
  userId: string,
  limit = 50,
): Promise<GetNotificationsResult> {
  const { data, error } = await supabase
    .from("notifications")
    .select(NOTIFICATION_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    const formattedLog = formatSupabaseError("getNotifications", error);
    console.error(formattedLog);
    return {
      notifications: [],
      error: "Gagal memuat notifikasi dari server. Silakan coba lagi.",
    };
  }

  if (!Array.isArray(data)) {
    return { notifications: [], error: null };
  }

  const notifications = data
    .map(normalizeNotification)
    .filter((item): item is NotificationRow => item !== null);

  return { notifications, error: null };
}

export async function getUnreadNotificationCount(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    const formattedLog = formatSupabaseError(
      "getUnreadNotificationCount",
      error,
    );
    console.error(formattedLog);
    return 0;
  }

  return count ?? 0;
}

export async function markNotificationAsRead(
  supabase: SupabaseClient,
  userId: string,
  notificationId: string,
): Promise<boolean> {
  const nowIso = new Date().toISOString();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: nowIso })
    .eq("id", notificationId)
    .eq("user_id", userId);

  if (error) {
    const formattedLog = formatSupabaseError(
      "markNotificationAsRead",
      error,
    );
    console.error(formattedLog);
    return false;
  }

  return true;
}

export async function markAllNotificationsAsRead(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const nowIso = new Date().toISOString();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: nowIso })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    const formattedLog = formatSupabaseError(
      "markAllNotificationsAsRead",
      error,
    );
    console.error(formattedLog);
    return false;
  }

  return true;
}
