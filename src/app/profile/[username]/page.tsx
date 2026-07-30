import {
  Award,
  Gauge,
  Sparkles,
  Trophy,
} from "lucide-react";

import type { ReactNode } from "react";

import type { Metadata } from "next";

import Link from "next/link";

import { AchievementList } from "@/features/achievement/achievement-list";
import { DimensionProgress } from "@/features/dashboard/dimension-progress";
import { formatScore } from "@/features/dashboard/formatters";
import {
  getPublicProfile,
} from "@/features/explore/queries";
import { PublicRatingHistory } from "@/features/explore/public-rating-history";
import { ProfileAvatar } from "@/features/profile/profile-avatar";

import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Profil Publik | HuMob",
  description:
    "Ringkasan profil dan performa publik pengguna HuMob.",
};

export const dynamic = "force-dynamic";

type PublicProfilePageProps = {
  params: Promise<{
    username: string;
  }>;
};

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { username } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return (
      <PublicProfileState
        title="Login diperlukan"
        description="Masuk untuk melihat profil publik HuMob."
        actionHref={`/login?next=${encodeURIComponent(
          `/profile/${username}`,
        )}`}
        actionLabel="Masuk"
      />
    );
  }

  const result = await getPublicProfile(
    supabase,
    username,
  );

  if (result.status === "error") {
    return (
      <PublicProfileState
        title="Profil tidak dapat dimuat"
        description={
          result.errorMessage ??
          "Ringkasan profil publik belum tersedia."
        }
        actionHref="/dashboard/explore"
        actionLabel="Kembali ke Jelajah"
      />
    );
  }

  if (!result.profile) {
    return (
      <PublicProfileState
        title="Profil tidak ditemukan"
        description="Profil ini tidak tersedia atau tidak dibagikan untuk publik."
        actionHref="/dashboard/explore"
        actionLabel="Kembali ke Jelajah"
      />
    );
  }

  const profile = result.profile;
  const displayName =
    profile.displayName || profile.username;
  const dimensionAggregate = {
    averageOverall:
      profile.performance.averageOverall,
    averageEnergy:
      profile.performance.averageEnergy,
    averageFocus:
      profile.performance.averageFocus,
    averageDiscipline:
      profile.performance.averageDiscipline,
    averageResponsibility:
      profile.performance.averageResponsibility,
    ratingCount:
      profile.performance.sampledRatingCount,
  };

  return (
    <main className="min-h-screen bg-black px-5 py-8 text-white sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          href="/dashboard/explore"
          className="inline-flex items-center text-sm text-zinc-500 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          Kembali ke Jelajah
        </Link>

        <section className="rounded-2xl border border-app-border bg-app-surface p-5 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <ProfileAvatar
              avatarUrl={profile.avatarUrl}
              fullName={displayName}
              size="xl"
            />

            <div className="min-w-0">
              <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">
                {displayName}
              </h1>

              <p className="mt-1 text-sm text-zinc-500">
                @{profile.username}
              </p>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">
                {profile.bio ||
                  "Belum ada bio yang ditambahkan."}
              </p>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="public-performance-title"
          className="space-y-4"
        >
          <div>
            <h2
              id="public-performance-title"
              className="font-semibold tracking-tight text-white"
            >
              Ringkasan Performa Publik
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Ringkasan dari rating final yang dibagikan sebagai data performa.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <PublicStatCard
              icon={<Gauge className="h-5 w-5" />}
              label="Rata-rata overall"
              score={
                profile.performance.averageOverall
              }
              description="Dari rating terbaru yang tersedia"
            />

            <PublicStatCard
              icon={<Trophy className="h-5 w-5" />}
              label="Rating terbaik"
              score={
                profile.performance.bestOverall
              }
              description="Nilai tertinggi pada ringkasan"
            />

            <PublicStatCard
              icon={<Award className="h-5 w-5" />}
              label="Hari dinilai"
              value={String(
                profile.performance.ratedDays,
              )}
              isUnavailable={false}
              description="Total rating final"
            />

            <PublicStatCard
              icon={<Sparkles className="h-5 w-5" />}
              label="Atribut terkuat"
              score={
                profile.performance.strongestAttribute?.value ??
                null
              }
              description={
                profile.performance.strongestAttribute
                  ?.label ?? "Belum ada data atribut"
              }
            />
          </div>
        </section>

        {profile.performance.ratedDays === 0 ? (
          <section className="rounded-2xl border border-dashed border-white/10 bg-black/10 p-6 text-center">
            <h2 className="font-medium text-zinc-300">
              Belum ada rating final
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Ringkasan dimensi dan perjalanan rating akan tersedia setelah rating final tersimpan.
            </p>
          </section>
        ) : (
          <section
            aria-label="Detail performa publik"
            className="grid gap-6 xl:grid-cols-2"
          >
            <DimensionProgress
              aggregate={dimensionAggregate}
            />

            <PublicRatingHistory
              history={profile.performance.ratingHistory}
            />
          </section>
        )}

        <AchievementList
          title="Achievement Publik"
          subtitle="Achievement yang sudah terbuka pada profil ini."
          achievements={profile.achievements.achievements}
          unlockedCount={profile.achievements.unlockedCount}
          totalCount={profile.achievements.totalCount}
          available={profile.achievements.available}
          emptyMessage="Belum ada achievement yang terbuka."
        />
      </div>
    </main>
  );
}

function PublicStatCard({
  icon,
  label,
  value,
  score,
  isUnavailable,
  description,
}: {
  icon: ReactNode;
  label: string;
  value?: string;
  score?: number | null;
  isUnavailable?: boolean;
  description: string;
}) {
  const missingScore =
    score === null || score === undefined;
  const displayValue =
    score === undefined
      ? value ?? "Belum tersedia"
      : missingScore
        ? "Belum tersedia"
        : formatScore(score);
  const displayUnavailable =
    isUnavailable ?? missingScore;

  return (
    <article className="rounded-2xl border border-app-border bg-app-surface p-5">
      <div className="text-zinc-500">{icon}</div>

      <p className="mt-5 text-sm text-zinc-500">
        {label}
      </p>

      <p
        className={`mt-1 font-semibold tracking-tight text-white ${
          displayUnavailable
            ? "text-xl sm:text-2xl"
            : "text-3xl"
        }`}
      >
        {displayValue}
      </p>

      <p className="mt-3 text-xs leading-5 text-zinc-600">
        {description}
      </p>
    </article>
  );
}

function PublicProfileState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 py-12 text-center text-white">
      <section className="max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <h1 className="font-semibold text-white">
          {title}
        </h1>

        <p className="mt-3 text-sm leading-6 text-zinc-500">
          {description}
        </p>

        <Link
          href={actionHref}
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          {actionLabel}
        </Link>
      </section>
    </main>
  );
}
