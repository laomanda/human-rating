export type NotificationType =
  | "daily_reminder"
  | "rating_completed"
  | "rating_ready"
  | "achievement_unlocked"
  | "achievement"
  | "system";

export type NotificationRow = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  payload: Record<string, unknown> | null;
  delivery_status: string | null;
  scheduled_for: string | null;
  sent_at: string | null;
  read_at: string | null;
  fcm_message_id: string | null;
  error_message: string | null;
  created_at: string;
};
