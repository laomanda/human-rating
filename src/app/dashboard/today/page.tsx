import type { ReactNode } from "react";

import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Layers3,
  LockKeyhole,
} from "lucide-react";

import Link from "next/link";
import { redirect } from "next/navigation";

import {
  PhysicalActivityList,
  ProductiveActivityList,
} from "@/components/activities/activity-list";

import { PhysicalActivityForm } from "@/components/activities/physical-activity-form";
import { ProductiveActivityForm } from "@/components/activities/productive-activity-form";

import { DailyMatchLiveStatus } from "@/components/daily-match/daily-match-live-status";

import { isDailyMatchEditable } from "@/features/activities/formatters";

import { getTodayActivityData } from "@/features/activities/queries";

import {
  DEFAULT_TIME_ZONE,
  formatDateOnly,
  formatDateTime,
} from "@/features/dashboard/formatters";

import { getDailyRatingForMatch } from "@/features/dashboard/queries";
import { RatingMetadata } from "@/features/dashboard/rating-metadata";
import { RatingSummary } from "@/features/dashboard/rating-summary";

import { createClient } from "@/lib/supabase/server";

type DailyMatchStatus =
  | "open"
  | "locked"
  | "queued"
  | "processing"
  | "rated"
  | "failed";

const DAILY_MATCH_STATUS_LABELS: Readonly<
  Record<DailyMatchStatus, string>
> = {
  open: "Terbuka",
  locked: "Input ditutup",
  queued: "Menunggu penilaian",
  processing: "Sedang dinilai",
  rated: "Rating tersedia",
  failed: "Dijadwalkan ulang",
};

export const metadata = {
  title: "Input Hari Ini | HuMob",
  description:
    "Kelola aktivitas Daily Match HuMob hari ini.",
};

export const dynamic = "force-dynamic";

export default async function TodayMatchPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const serverNow = new Date().toISOString();

  const data = await getTodayActivityData(
    supabase,
    user,
  );

  if (!data.dailyMatch) {
    return (
      <DailyMatchUnavailable
        serverNow={serverNow}
      />
    );
  }

  const dailyMatch = data.dailyMatch;

  const dailyRating =
    dailyMatch.status === "rated"
      ? await getDailyRatingForMatch(
          supabase,
          user,
          dailyMatch.id,
        )
      : null;

  const canEdit =
    isDailyMatchEditable(dailyMatch);

  const statusLabel =
    getDailyMatchStatusLabel(
      dailyMatch.status,
    );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-app-border bg-app-surface p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-500">
              Daily Match
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                {formatDateOnly(
                  dailyMatch.match_date,
                )}
              </h1>

              <StatusBadge
                status={dailyMatch.status}
                canEdit={canEdit}
              />
            </div>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Catat aktivitas yang benar-benar
              dilakukan sebelum batas input berakhir.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryItem
              icon={
                <Layers3 className="h-4 w-4" />
              }
              label="Jumlah input"
              value={String(
                dailyMatch.input_item_count,
              )}
            />

            <SummaryItem
              icon={
                <Clock3 className="h-4 w-4" />
              }
              label="Input ditutup"
              value={formatDateTime(
                dailyMatch.input_closes_at,
                dailyMatch.timezone,
              )}
            />

            <SummaryItem
              icon={
                <CalendarDays className="h-4 w-4" />
              }
              label="Rating dimulai"
              value={formatDateTime(
                dailyMatch.rating_queues_at,
                dailyMatch.timezone,
              )}
            />
          </div>
        </div>
      </section>

      <DailyMatchLiveStatus
        matchId={dailyMatch.id}
        matchDate={dailyMatch.match_date}
        timeZone={dailyMatch.timezone}
        status={dailyMatch.status}
        inputClosesAt={
          dailyMatch.input_closes_at
        }
        ratingQueuesAt={
          dailyMatch.rating_queues_at
        }
        serverNow={serverNow}
        variant="panel"
      />

      {dailyMatch.status === "rated" ? (
        dailyRating ? (
          <>
            <RatingSummary
              overall_rating={
                dailyRating.overall_rating
              }
              energy_rating={
                dailyRating.energy_rating
              }
              focus_rating={
                dailyRating.focus_rating
              }
              discipline_rating={
                dailyRating.discipline_rating
              }
              source={dailyRating.source}
              status={dailyMatch.status}
            />

            <RatingMetadata
              source={dailyRating.source}
              validationFlags={
                dailyRating.validation_flags
              }
            />
          </>
        ) : (
          <RatingUnavailable />
        )
      ) : null}

      {!canEdit ? (
        <section className="flex items-start gap-4 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
          <div className="rounded-xl bg-amber-400/10 p-2.5 text-amber-300">
            <LockKeyhole
              aria-hidden="true"
              className="h-5 w-5"
            />
          </div>

          <div>
            <h2 className="font-medium text-amber-200">
              Input aktivitas hanya dapat dilihat
            </h2>

            <p className="mt-1 text-sm leading-6 text-amber-200/60">
              Daily Match saat ini berstatus{" "}
              <strong className="font-medium text-amber-200">
                {statusLabel.toLowerCase()}
              </strong>
              , atau batas waktu input telah lewat.
              Aktivitas yang sudah disimpan tetap
              tersedia untuk diperiksa.
            </p>
          </div>
        </section>
      ) : null}

      {canEdit ? (
        <section
          aria-labelledby="activity-input-title"
          className="space-y-4"
        >
          <div>
            <h2
              id="activity-input-title"
              className="font-semibold tracking-tight text-white"
            >
              Tambahkan Aktivitas
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Masukkan aktivitas fisik dan produktif
              yang dilakukan hari ini.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-app-border bg-app-surface p-5 sm:p-6">
              <PhysicalActivityForm
                dailyMatchId={dailyMatch.id}
              />
            </div>

            <div className="rounded-2xl border border-app-border bg-app-surface p-5 sm:p-6">
              <ProductiveActivityForm
                dailyMatchId={dailyMatch.id}
              />
            </div>
          </div>
        </section>
      ) : null}

      <section
        aria-labelledby="activity-list-title"
        className="space-y-4"
      >
        <div>
          <h2
            id="activity-list-title"
            className="font-semibold tracking-tight text-white"
          >
            Aktivitas Hari Ini
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Aktivitas yang sudah tersimpan pada Daily
            Match ini.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <PhysicalActivityList
            activities={
              data.physicalActivities
            }
            canEdit={canEdit}
          />

          <ProductiveActivityList
            activities={
              data.productiveActivities
            }
            canEdit={canEdit}
          />
        </div>
      </section>
    </div>
  );
}

function RatingUnavailable() {
  return (
    <section className="flex items-start gap-4 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
      <div className="rounded-xl bg-amber-400/10 p-2.5 text-amber-300">
        <AlertTriangle
          aria-hidden="true"
          className="h-5 w-5"
        />
      </div>

      <div>
        <h2 className="font-medium text-amber-200">
          Rating belum dapat ditampilkan
        </h2>

        <p className="mt-1 text-sm leading-6 text-amber-200/60">
          Daily Match sudah selesai, tetapi row rating
          belum tersedia untuk akun ini.
        </p>
      </div>
    </section>
  );
}

function getDailyMatchStatusLabel(
  status: DailyMatchStatus,
): string {
  return DAILY_MATCH_STATUS_LABELS[status];
}

function StatusBadge({
  status,
  canEdit,
}: {
  status: DailyMatchStatus;
  canEdit: boolean;
}) {
  return (
    <span
      className={
        canEdit
          ? "inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300"
          : "inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400"
      }
    >
      {canEdit ? (
        <CheckCircle2
          aria-hidden="true"
          className="h-3.5 w-3.5"
        />
      ) : (
        <LockKeyhole
          aria-hidden="true"
          className="h-3.5 w-3.5"
        />
      )}

      {getDailyMatchStatusLabel(status)}
    </span>
  );
}

function SummaryItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-black/30 p-4">
      <div className="flex items-center gap-2 text-xs text-zinc-600">
        {icon}
        {label}
      </div>

      <p className="mt-2 break-words text-sm font-medium text-zinc-300">
        {value}
      </p>
    </div>
  );
}

function DailyMatchUnavailable({
  serverNow,
}: {
  serverNow: string;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <section className="w-full max-w-lg rounded-2xl border border-amber-400/20 bg-app-surface p-6 text-center sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300">
          <AlertTriangle
            aria-hidden="true"
            className="h-7 w-7"
          />
        </div>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-white">
          Daily Match belum tersedia
        </h1>

        <p className="mt-3 text-sm leading-6 text-zinc-500">
          HuMob belum menemukan Daily Match untuk hari
          ini. Data mungkin masih sedang disinkronkan.
          Periksa kembali beberapa saat lagi.
        </p>

        <DailyMatchLiveStatus
          matchId={null}
          matchDate={null}
          timeZone={DEFAULT_TIME_ZONE}
          status={null}
          inputClosesAt={null}
          ratingQueuesAt={null}
          serverNow={serverNow}
          variant="panel"
          className="mt-6 text-left"
        />

        <Link
          href="/dashboard"
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-medium text-black transition-colors hover:bg-zinc-200 focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          <ArrowLeft
            aria-hidden="true"
            className="h-4 w-4"
          />

          Kembali ke Beranda
        </Link>
      </section>
    </div>
  );
}
