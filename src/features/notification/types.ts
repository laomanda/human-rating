export type NotificationType =
  | "daily_reminder"
  | "rating_completed"
  | "achievement_unlocked"
  | "system";

export type NotificationRow = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  reference_id: string | null;
  push_status: string;
  created_at: string;
};
