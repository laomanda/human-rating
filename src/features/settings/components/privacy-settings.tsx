"use client";

import { Globe, Lock, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

import { updatePrivacyAction } from "@/features/settings/actions";
import { SettingsSection } from "@/features/settings/components/settings-section";
import type { SettingsProfile } from "@/features/settings/types";

type PrivacySettingsProps = {
  profile: SettingsProfile;
};

export function PrivacySettings({ profile }: PrivacySettingsProps) {
  const [isPending, startTransition] = useTransition();
  const [isPrivate, setIsPrivate] = useState(profile.is_private);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const handleChange = (value: boolean) => {
    const prev = isPrivate;
    setIsPrivate(value);
    setSavedMessage(null);

    startTransition(async () => {
      const result = await updatePrivacyAction(value);

      if (result.success) {
        setSavedMessage(
          value ? "Profil diset menjadi Privat." : "Profil diset menjadi Publik.",
        );
        setTimeout(() => setSavedMessage(null), 3000);
      } else {
        setIsPrivate(prev);
      }
    });
  };

  return (
    <SettingsSection
      title="Privasi Profil"
      description="Kontrol siapa yang dapat melihat profil Anda."
    >
      <div className="grid grid-cols-2 gap-3">
        {/* Public */}
        <button
          id="privacy-public"
          type="button"
          onClick={() => handleChange(false)}
          disabled={isPending}
          className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
            !isPrivate
              ? "border-sky-500/50 bg-sky-500/10"
              : "border-white/8 bg-zinc-900 hover:border-white/15"
          }`}
        >
          <Globe
            className={`h-5 w-5 ${!isPrivate ? "text-sky-400" : "text-zinc-500"}`}
          />
          <div>
            <p
              className={`text-sm font-medium ${!isPrivate ? "text-sky-300" : "text-zinc-300"}`}
            >
              Publik
            </p>
            <p className="mt-0.5 text-[11px] leading-4 text-zinc-500">
              Profil muncul di Jelajah
            </p>
          </div>
        </button>

        {/* Private */}
        <button
          id="privacy-private"
          type="button"
          onClick={() => handleChange(true)}
          disabled={isPending}
          className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
            isPrivate
              ? "border-amber-500/50 bg-amber-500/10"
              : "border-white/8 bg-zinc-900 hover:border-white/15"
          }`}
        >
          <Lock
            className={`h-5 w-5 ${isPrivate ? "text-amber-400" : "text-zinc-500"}`}
          />
          <div>
            <p
              className={`text-sm font-medium ${isPrivate ? "text-amber-300" : "text-zinc-300"}`}
            >
              Privat
            </p>
            <p className="mt-0.5 text-[11px] leading-4 text-zinc-500">
              Tersembunyi dari Jelajah
            </p>
          </div>
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
        {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-400" />}
        {savedMessage && (
          <span className="text-emerald-400">{savedMessage}</span>
        )}
      </div>
    </SettingsSection>
  );
}
