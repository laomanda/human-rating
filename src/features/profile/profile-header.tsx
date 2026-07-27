import {
  LockKeyhole,
  Pencil,
} from "lucide-react";

import Link from "next/link";

import { ProfileAvatar } from "@/features/profile/profile-avatar";

import type { ProfileRecord } from "@/features/profile/types";

type ProfileHeaderProps = {
  profile: ProfileRecord;
};

export function ProfileHeader({
  profile,
}: ProfileHeaderProps) {
  const fullName =
    profile.full_name ??
    profile.username ??
    "Pengguna HuMob";

  return (
    <section className="rounded-2xl border border-app-border bg-app-surface p-5 sm:p-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
          <ProfileAvatar
            avatarUrl={profile.avatar_url}
            fullName={fullName}
            size="lg"
          />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-semibold tracking-tight text-white">
                {fullName}
              </h1>

              {profile.account_status ===
              "active" ? (
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                  Aktif
                </span>
              ) : null}
            </div>

            <p className="mt-1 text-sm text-zinc-500">
              {profile.username
                ? `@${profile.username}`
                : "Username belum tersedia"}
            </p>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">
              {profile.bio ||
                "Belum ada bio yang ditambahkan."}
            </p>

            <div className="mt-4 inline-flex items-center gap-2 text-xs text-zinc-600">
              <LockKeyhole
                aria-hidden="true"
                className="h-3.5 w-3.5"
              />

              Username tidak dapat diubah
              setelah onboarding.
            </div>
          </div>
        </div>

        <Link
          href="/dashboard/profile/edit"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-zinc-200 focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          <Pencil
            aria-hidden="true"
            className="h-4 w-4"
          />

          Edit Profil
        </Link>
      </div>
    </section>
  );
}