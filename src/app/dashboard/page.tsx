import type { ReactNode } from "react";

import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Gauge,
  Trophy,
} from "lucide-react";

import Link from "next/link";
import { redirect } from "next/navigation";

import { DailyMatchLiveStatus } from "@/components/daily-match/daily-match-live-status";
import { ProfileAvatar } from "@/features/profile/profile-avatar";

import {
  formatClock,
  formatDateOnly,
  formatDateTime,
  formatScore,
  formatStatus,
  getDateKeyForTimeZone,
} from "@/features/dashboard/formatters";

import { DimensionProgress } from "@/features/dashboard/dimension-progress";
import { PerformanceChart } from "@/features/dashboard/perfomance-chart";
import { PerformanceCalendar } from "@/features/dashboard/performance-calendar";
import { PerformanceHistory } from "@/features/dashboard/perfomance-history";
import { getDashboardData } from "@/features/dashboard/queries";
import { RatingMetadata } from "@/features/dashboard/rating-metadata";
import { RatingSummary } from "@/features/dashboard/rating-summary";
import { RatingTrend } from "@/features/dashboard/rating-trend";
import { AchievementList } from "@/features/achievement/achievement-list";

import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Beranda | HuMob",
  description:
    "Ringkasan performa harian pengguna HuMob.",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const dashboard = await getDashboardData(
    supabase,
    user,
  );

  const displayName =
    dashboard.profile?.full_name ??
    dashboard.profile?.username ??
    "Pengguna HuMob";

  const avatarUrl =
    dashboard.profile?.avatar_url ?? null;

  const username =
    dashboard.profile?.username ?? null;

  const displayedRating =
    dashboard.todayRating ??
    dashboard.latestRating;

  const displayedRatingMatch =
    dashboard.todayRating
      ? dashboard.todayMatch
      : dashboard.latestRatingMatch;

  const isTodayRating =
    displayedRating !== null &&
    dashboard.todayRating !== null;

  const serverNow = new Date().toISOString();

  const todayDate = getDateKeyForTimeZone(
    new Date(serverNow),
    dashboard.timeZone,
  );

  /*
   * Informasi scheduler dan warning teknis hanya
   * ditampilkan pada development.
   */
  const showDeveloperDiagnostics =
    process.env.NODE_ENV === "development";

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-5 rounded-2xl border border-app-border bg-app-surface p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="flex min-w-0 items-center gap-4">
          <ProfileAvatar
            avatarUrl={avatarUrl}
            fullName={displayName}
            size="md"
          />

          <div className="min-w-0">
            <p className="text-sm text-zinc-500">
              Selamat datang kembali
            </p>

            <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight text-white">
              {displayName}
            </h1>

            {username ? (
              <p className="mt-1 truncate text-sm text-zinc-500">
                @{username}
              </p>
            ) : (
              <p className="mt-1 text-sm text-amber-400/80">
                Profil HuMob belum dilengkapi
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
            Akun aktif
          </span>

          <Link
            href="/dashboard/profile"
            className="inline-flex items-center rounded-xl border border-white/10 bg-white/3 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/7 hover:text-white"
          >
            Lihat Profil
          </Link>
        </div>
      </section>

      <section aria-labelledby="performance-summary-title">
        <div className="mb-4">
          <h2
            id="performance-summary-title"
            className="font-semibold tracking-tight text-white"
          >
            Ringkasan Performa
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Statistik berdasarkan rating yang telah
            diselesaikan.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <ScoreCard
            icon={<Gauge className="h-5 w-5" />}
            title="Rata-rata keseluruhan"
            value={formatScore(
              dashboard.aggregate.averageOverall,
            )}
            description={
              dashboard.aggregate.ratingCount > 0
                ? `${dashboard.aggregate.ratingCount} hari telah dinilai`
                : "Belum ada rating"
            }
          />

          <ScoreCard
            icon={
              <CalendarDays className="h-5 w-5" />
            }
            title="Hari dinilai"
            value={String(
              dashboard.aggregate.ratingCount,
            )}
            description={
              dashboard.aggregate.ratingCount > 0
                ? "Rating final tersimpan"
                : "Belum ada rating"
            }
          />

          <RatingTrend
            overallRatings={dashboard.history.map(
              ({ rating }) =>
                rating?.overall_rating ?? null,
            )}
          />
        </div>
      </section>

      <section
        aria-labelledby="rating-overview-title"
        className="space-y-4"
      >
        <div>
          <h2
            id="rating-overview-title"
            className="font-semibold tracking-tight text-white"
          >
            {isTodayRating
              ? "Rating Hari Ini"
              : displayedRating
                ? "Rating Terbaru"
                : "Rating Performa"}
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            {isTodayRating
              ? "Hasil ini berasal dari Daily Match hari ini."
              : displayedRating
                ? `Rating tersedia terakhir${
                    displayedRatingMatch
                      ?.match_date
                      ? ` pada ${formatDateOnly(
                          displayedRatingMatch
                            .match_date,
                        )}`
                      : ""
                  }.`
                : "Rating akan muncul setelah Daily Match pertama selesai dinilai."}
          </p>
        </div>

        {displayedRating ? (
          <>
            <RatingSummary
              overall_rating={
                displayedRating.overall_rating
              }
              energy_rating={
                displayedRating.energy_rating
              }
              focus_rating={
                displayedRating.focus_rating
              }
              discipline_rating={
                displayedRating.discipline_rating
              }
              responsibility_rating={
                displayedRating
                  .responsibility_rating
              }
              source={displayedRating.source}
              status={
                displayedRatingMatch?.status ??
                "rated"
              }
            />

            <RatingMetadata
              source={displayedRating.source}
              validationFlags={
                displayedRating.validation_flags
              }
            />
          </>
        ) : (
          <EmptyState
            title="Belum ada rating performa"
            description="HuMob belum memiliki rating final untuk akun ini."
          />
        )}
      </section>

      <section
        aria-labelledby="performance-journey-title"
        className="space-y-4"
      >
        <div>
          <h2
            id="performance-journey-title"
            className="font-semibold tracking-tight text-white"
          >
            Perjalanan Performa
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Visualisasi rating final dan rata-rata setiap dimensi performa.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
          <PerformanceChart
            history={dashboard.history}
          />

          <DimensionProgress
            aggregate={dashboard.aggregate}
          />
        </div>
      </section>

      <AchievementList
        title="Achievement Terbaru"
        subtitle="Unlock terbaru dari rating performa nyata."
        achievements={
          dashboard.achievements.latestUnlocked.slice(
            0,
            3,
          )
        }
        unlockedCount={
          dashboard.achievements.unlockedCount
        }
        totalCount={
          dashboard.achievements.totalCount
        }
        available={
          dashboard.achievements.available
        }
      />

      <PerformanceCalendar
        days={dashboard.calendarDays}
        initialDate={todayDate}
      />

      <section className="grid gap-6 lg:grid-cols-2">
        <DataPanel
          icon={<Activity className="h-5 w-5" />}
          title="Daily Match Hari Ini"
          subtitle={formatDateOnly(todayDate)}
        >
          <DailyMatchLiveStatus
            matchId={
              dashboard.todayMatch?.id ?? null
            }
            matchDate={
              dashboard.todayMatch?.match_date ??
              null
            }
            timeZone={dashboard.timeZone}
            status={
              dashboard.todayMatch?.status ?? null
            }
            inputClosesAt={
              dashboard.todayMatch
                ?.input_closes_at ?? null
            }
            ratingQueuesAt={
              dashboard.todayMatch
                ?.rating_queues_at ?? null
            }
            serverNow={serverNow}
            variant="compact"
            className="mb-5"
          />

          {dashboard.todayMatch ? (
            <dl className="grid gap-4 sm:grid-cols-2">
              <DataItem
                label="Status"
                value={formatStatus(
                  dashboard.todayMatch.status,
                )}
              />

              <DataItem
                label="Jumlah input"
                value={String(
                  dashboard.todayMatch
                    .input_item_count,
                )}
              />

              <DataItem
                label="Dibuka"
                value={formatDateTime(
                  dashboard.todayMatch.opens_at,
                  dashboard.timeZone,
                )}
              />

              <DataItem
                label="Input ditutup"
                value={formatDateTime(
                  dashboard.todayMatch
                    .input_closes_at,
                  dashboard.timeZone,
                )}
              />

              <DataItem
                label="Rating dimulai"
                value={formatDateTime(
                  dashboard.todayMatch
                    .rating_queues_at,
                  dashboard.timeZone,
                )}
              />

              <DataItem
                label="Hasil rating"
                value={
                  dashboard.todayRating
                    ? "Tersedia"
                    : "Belum dinilai"
                }
              />
            </dl>
          ) : (
            <EmptyState
              title="Daily Match belum tersedia"
              description="HuMob belum menemukan Daily Match untuk tanggal hari ini."
            />
          )}

          <div className="mt-5">
            <Link
              href="/dashboard/today"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-zinc-200 focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              Buka Daily Match

              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4"
              />
            </Link>
          </div>
        </DataPanel>

        <DataPanel
          icon={<Trophy className="h-5 w-5" />}
          title="Performa Terbaik"
          subtitle="Rating keseluruhan tertinggi"
        >
          {dashboard.bestPerformance ? (
            <div className="space-y-5">
              <div>
                <p className="text-5xl font-semibold tracking-tight text-white">
                  {formatScore(
                    dashboard.bestPerformance.rating
                      .overall_rating,
                  )}
                </p>

                <p className="mt-2 text-sm text-zinc-500">
                  {formatDateOnly(
                    dashboard.bestPerformance.match
                      ?.match_date ?? null,
                  )}
                </p>
              </div>

              <dl className="grid gap-4 sm:grid-cols-2">
                <DataItem
                  label="Energy"
                  value={formatScore(
                    dashboard.bestPerformance.rating
                      .energy_rating,
                  )}
                />

                <DataItem
                  label="Focus"
                  value={formatScore(
                    dashboard.bestPerformance.rating
                      .focus_rating,
                  )}
                />

                <DataItem
                  label="Discipline"
                  value={formatScore(
                    dashboard.bestPerformance.rating
                      .discipline_rating,
                  )}
                />

                <DataItem
                  label="Responsibility"
                  value={formatScore(
                    dashboard.bestPerformance.rating
                      .responsibility_rating,
                  )}
                />
              </dl>
            </div>
          ) : (
            <EmptyState
              title="Belum ada performa terbaik"
              description="Performa terbaik akan muncul setelah rating harian pertama tersedia."
            />
          )}
        </DataPanel>
      </section>

      <PerformanceHistory
        history={dashboard.history}
      />

      {showDeveloperDiagnostics ? (
        <>
          <section
            aria-labelledby="developer-info-title"
            className="space-y-3"
          >
            <div>
              <h2
                id="developer-info-title"
                className="text-sm font-medium text-zinc-400"
              >
                Informasi pengembangan
              </h2>

              <p className="mt-1 text-xs text-zinc-600">
                Bagian ini hanya muncul pada mode
                development.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <SystemInfo
                icon={
                  <Clock3 className="h-5 w-5" />
                }
                title="Input terkunci"
                value={formatClock(
                  dashboard.appConfig
                    ?.daily_match_lock_time ??
                  null,
                )}
              />

              <SystemInfo
                icon={
                  <CalendarDays className="h-5 w-5" />
                }
                title="Antrean rating"
                value={formatClock(
                  dashboard.appConfig
                    ?.rating_queue_time ?? null,
                )}
              />

              <SystemInfo
                icon={
                  <CheckCircle2 className="h-5 w-5" />
                }
                title="Kalibrasi"
                value={
                  dashboard.appConfig
                    ? `${dashboard.appConfig.calibration_days} hari`
                    : "—"
                }
              />
            </div>
          </section>

          {dashboard.warnings.length > 0 ? (
            <section className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
              <h2 className="font-medium text-amber-300">
                Peringatan data pengembangan
              </h2>

              <ul className="mt-3 space-y-2 text-sm text-amber-200/70">
                {dashboard.warnings.map(
                  (warning) => (
                    <li key={warning}>
                      • {warning}
                    </li>
                  ),
                )}
              </ul>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function ScoreCard({
  icon,
  title,
  value,
  description,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-app-border bg-app-surface p-5">
      <div className="text-zinc-500">
        {icon}
      </div>

      <p className="mt-5 text-sm text-zinc-500">
        {title}
      </p>

      <p className="mt-1 text-3xl font-semibold tracking-tight text-white">
        {value}
      </p>

      <p className="mt-3 text-xs leading-5 text-zinc-600">
        {description}
      </p>
    </article>
  );
}

function DataPanel({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-app-border bg-app-surface p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-400">
          {icon}
        </div>

        <div className="min-w-0">
          <h2 className="font-medium text-white">
            {title}
          </h2>

          <p className="truncate text-sm text-zinc-500">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}

function DataItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/2.5 p-4">
      <dt className="text-xs uppercase tracking-wide text-zinc-600">
        {label}
      </dt>

      <dd className="mt-2 wrap-break-word text-sm text-zinc-300">
        {value}
      </dd>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-44 items-center justify-center rounded-xl border border-dashed border-white/10">
      <div className="max-w-md px-6 text-center">
        <p className="font-medium text-zinc-300">
          {title}
        </p>

        <p className="mt-2 text-sm leading-6 text-zinc-600">
          {description}
        </p>
      </div>
    </div>
  );
}

function SystemInfo({
  icon,
  title,
  value,
}: {
  icon: ReactNode;
  title: string;
  value: string;
}) {
  return (
    <article className="flex items-center gap-4 rounded-2xl border border-app-border bg-app-surface p-5">
      <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-500">
        {icon}
      </div>

      <div>
        <p className="text-sm text-zinc-500">
          {title}
        </p>

        <p className="mt-1 font-medium text-zinc-200">
          {value}
        </p>
      </div>
    </article>
  );
}
