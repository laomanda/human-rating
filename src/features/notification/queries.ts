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

function asBoolean(value: unknown): boolean {
  return value === true;
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
    is_read: asBoolean(row.is_read),
    reference_id: asString(row.reference_id),
    created_at: asString(row.created_at) ?? new Date().toISOString(),
  };
}

export async function getNotifications(
  supabase: SupabaseClient,
  userId: string,
  limit = 50,
): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select(NOTIFICATION_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch notifications:", error.message);
    return [];
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map(normalizeNotification)
    .filter((item): item is NotificationRow => item !== null);
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
    console.error("Failed to get unread notification count:", error.message);
    return 0;
  }

  return count ?? 0;
}

export async function markNotificationAsRead(
  supabase: SupabaseClient,
  userId: string,
  notificationId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to mark notification as read:", error.message);
    return false;
  }

  return true;
}

export async function markAllNotificationsAsRead(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    console.error("Failed to mark all notifications as read:", error.message);
    return false;
  }

  return true;
}
