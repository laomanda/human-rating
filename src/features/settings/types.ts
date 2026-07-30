export type SettingsProfile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_private: boolean;
};

export type SettingsNotificationPreferences = {
  id: string;
  user_id: string;
  push_enabled: boolean;
  email_enabled: boolean;
  daily_reminder_enabled: boolean;
  rating_completion_enabled: boolean;
  achievement_notification_enabled: boolean;
};

export type SettingsData = {
  profile: SettingsProfile | null;
  notificationPreferences: SettingsNotificationPreferences | null;
};

export type UpdateAccountSettingsInput = {
  full_name: string;
  bio: string;
  avatar_url: string | null;
};
