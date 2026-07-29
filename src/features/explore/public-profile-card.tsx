import { ArrowUpRight, Search } from "lucide-react";

import Link from "next/link";

import { ProfileAvatar } from "@/features/profile/profile-avatar";

import type { PublicProfileCardData } from "@/features/explore/explore-types";

type PublicProfileCardProps = {
  profile: PublicProfileCardData;
};

export function PublicProfileCard({
  profile,
}: PublicProfileCardProps) {
  const displayName =
    profile.displayName || profile.username;

  return (
    <Link
      href={`/profile/${encodeURIComponent(
        profile.username,
      )}`}
      className="group flex min-w-0 items-start gap-4 rounded-2xl border border-app-border bg-app-surface p-4 transition-colors hover:border-white/20 hover:bg-white/[0.055] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
    >
      <ProfileAvatar
        avatarUrl={profile.avatarUrl}
        fullName={displayName}
        size="md"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate font-medium text-white">
              {displayName}
            </h2>

            <p className="mt-1 truncate text-sm text-zinc-500">
              @{profile.username}
            </p>
          </div>

          <ArrowUpRight
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-zinc-600 transition-colors group-hover:text-white"
          />
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-400">
          {profile.bio || "Belum ada bio yang ditambahkan."}
        </p>

        <span className="mt-4 inline-flex items-center gap-2 text-xs text-zinc-600">
          <Search
            aria-hidden="true"
            className="h-3.5 w-3.5"
          />
          Lihat profil publik
        </span>
      </div>
    </Link>
  );
}
