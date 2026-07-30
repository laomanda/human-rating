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
  reference_id?: string | null;
  created_at: string;
};
