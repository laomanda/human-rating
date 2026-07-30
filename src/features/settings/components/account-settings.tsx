"use client";

import { Camera, CheckCircle, Loader2, XCircle } from "lucide-react";
import Image from "next/image";
import { useRef, useState, useTransition } from "react";

import { updateAccountSettingsAction } from "@/features/settings/actions";
import { SettingsSection } from "@/features/settings/components/settings-section";
import type { SettingsProfile } from "@/features/settings/types";

type AccountSettingsProps = {
  profile: SettingsProfile;
};

type FeedbackState =
  | { type: "idle" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

const AVATAR_ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_SIZE_BYTES = 2 * 1024 * 1024;

export function AccountSettings({ profile }: AccountSettingsProps) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<FeedbackState>({ type: "idle" });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFeedback({ type: "error", message: "Hanya file gambar yang diizinkan." });
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setFeedback({ type: "error", message: "Ukuran foto maksimal 2 MB." });
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback({ type: "idle" });

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateAccountSettingsAction(formData);

      if (result.success) {
        setFeedback({ type: "success", message: "Profil berhasil diperbarui." });
        setAvatarPreview(null);
      } else {
        setFeedback({ type: "error", message: result.error });
      }
    });
  };

  const displayAvatar = avatarPreview ?? profile.avatar_url;
  const initials = (profile.full_name ?? profile.username ?? "U")
    .slice(0, 2)
    .toUpperCase();

  return (
    <SettingsSection
      title="Pengaturan Akun"
      description="Kelola nama, bio, dan foto profil Anda."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 overflow-hidden rounded-xl border border-white/10 bg-zinc-900">
              {displayAvatar ? (
                <Image
                  src={displayAvatar}
                  alt="Avatar"
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                  unoptimized={!!avatarPreview}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-zinc-400">
                  {initials}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-zinc-800 text-zinc-300 transition hover:bg-zinc-700"
              aria-label="Ubah foto profil"
            >
              <Camera className="h-3 w-3" />
            </button>
          </div>

          <div>
            <p className="text-sm font-medium text-white">Foto Profil</p>
            <p className="text-xs text-zinc-500">JPG, PNG, atau WebP · Maks. 2 MB</p>
          </div>

          {/* Hidden file input with name="avatar" for FormData */}
          <input
            ref={fileInputRef}
            type="file"
            name="avatar"
            accept={AVATAR_ACCEPT}
            className="sr-only"
            onChange={handleFileChange}
          />
        </div>

        {/* Full Name */}
        <div className="space-y-1.5">
          <label htmlFor="settings-full-name" className="text-xs font-medium text-zinc-400">
            Nama Lengkap
          </label>
          <input
            id="settings-full-name"
            name="full_name"
            type="text"
            defaultValue={profile.full_name ?? ""}
            maxLength={80}
            required
            className="w-full rounded-xl border border-white/8 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30"
            placeholder="Nama lengkap Anda"
          />
        </div>

        {/* Username — read only */}
        <div className="space-y-1.5">
          <label htmlFor="settings-username" className="text-xs font-medium text-zinc-400">
            Username
            <span className="ml-2 rounded-md border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-500">
              Tidak dapat diubah
            </span>
          </label>
          <input
            id="settings-username"
            type="text"
            value={`@${profile.username ?? ""}`}
            readOnly
            className="w-full cursor-default rounded-xl border border-white/5 bg-zinc-900/40 px-4 py-2.5 text-sm text-zinc-500 outline-none"
            aria-readonly="true"
          />
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <label htmlFor="settings-bio" className="text-xs font-medium text-zinc-400">
            Bio
          </label>
          <textarea
            id="settings-bio"
            name="bio"
            rows={3}
            defaultValue={profile.bio ?? ""}
            maxLength={160}
            className="w-full resize-none rounded-xl border border-white/8 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30"
            placeholder="Ceritakan sedikit tentang diri Anda…"
          />
          <p className="text-right text-[11px] text-zinc-600">Maks. 160 karakter</p>
        </div>

        {/* Feedback */}
        {feedback.type !== "idle" && (
          <div
            role="alert"
            className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
              feedback.type === "success"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                : "border-red-500/20 bg-red-500/10 text-red-300"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            {feedback.message}
          </div>
        )}

        <button
          id="settings-save-profile"
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? "Menyimpan…" : "Simpan Perubahan"}
        </button>
      </form>
    </SettingsSection>
  );
}
