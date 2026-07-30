"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

import { updateNotificationPreferencesAction } from "@/features/settings/actions";
import { SettingsSection } from "@/features/settings/components/settings-section";
import type { SettingsNotificationPreferences } from "@/features/settings/types";

type NotificationSettingsProps = {
  preferences: SettingsNotificationPreferences | null;
};

type ToggleItemProps = {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
};

function ToggleItem({
  id,
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: ToggleItemProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <label
          htmlFor={id}
          className={`block text-sm font-medium ${disabled ? "text-zinc-500" : "cursor-pointer text-white"}`}
        >
          {label}
        </label>
        <p className="mt-0.5 text-xs leading-5 text-zinc-500">{description}</p>
      </div>

      <button
        id={id}
        role="switch"
        type="button"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-40 ${
          checked ? "bg-sky-500" : "bg-zinc-700"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

const DEFAULT_PREFS: SettingsNotificationPreferences = {
  id: "",
  user_id: "",
  push_enabled: true,
  email_enabled: false,
  daily_reminder_enabled: true,
  rating_completion_enabled: true,
  achievement_notification_enabled: true,
};

export function NotificationSettings({
  preferences,
}: NotificationSettingsProps) {
  const [isPending, startTransition] = useTransition();
  const [prefs, setPrefs] = useState<SettingsNotificationPreferences>(
    preferences ?? DEFAULT_PREFS,
  );
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const handleChange = (
    key: keyof Omit<SettingsNotificationPreferences, "id" | "user_id">,
    value: boolean,
  ) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSavedMessage(null);

    startTransition(async () => {
      const result = await updateNotificationPreferencesAction({
        push_enabled: next.push_enabled,
        daily_reminder_enabled: next.daily_reminder_enabled,
        rating_completion_enabled: next.rating_completion_enabled,
        achievement_notification_enabled: next.achievement_notification_enabled,
      });

      if (result.success) {
        setSavedMessage("Preferensi notifikasi disimpan.");
        setTimeout(() => setSavedMessage(null), 3000);
      } else {
        // Revert optimistic update
        setPrefs(prefs);
      }
    });
  };

  return (
    <SettingsSection
      title="Preferensi Notifikasi"
      description="Atur notifikasi mana yang ingin Anda terima."
    >
      <div className="divide-y divide-white/5">
        <ToggleItem
          id="notif-push"
          label="Push Notification"
          description="Izinkan notifikasi browser dari HuMob."
          checked={prefs.push_enabled}
          onChange={(v) => handleChange("push_enabled", v)}
          disabled={isPending}
        />

        <ToggleItem
          id="notif-daily-reminder"
          label="Pengingat Harian"
          description="Ingatkan saya untuk mengisi rating setiap hari."
          checked={prefs.daily_reminder_enabled}
          onChange={(v) => handleChange("daily_reminder_enabled", v)}
          disabled={isPending}
        />

        <ToggleItem
          id="notif-rating-completion"
          label="Rating Selesai"
          description="Beritahu saya saat rating harian selesai diproses."
          checked={prefs.rating_completion_enabled}
          onChange={(v) => handleChange("rating_completion_enabled", v)}
          disabled={isPending}
        />

        <ToggleItem
          id="notif-achievement"
          label="Pencapaian"
          description="Beritahu saya saat mendapatkan badge atau pencapaian baru."
          checked={prefs.achievement_notification_enabled}
          onChange={(v) => handleChange("achievement_notification_enabled", v)}
          disabled={isPending}
        />
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
        {isPending && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-400" />
        )}
        {savedMessage && (
          <span className="text-emerald-400">{savedMessage}</span>
        )}
      </div>
    </SettingsSection>
  );
}
