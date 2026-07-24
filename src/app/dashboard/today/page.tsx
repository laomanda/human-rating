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

import {
  formatDailyMatchStatus,
  isDailyMatchEditable,
} from "@/features/activities/formatters";

import { getTodayActivityData } from "@/features/activities/queries";

import {
  DEFAULT_TIME_ZONE,
  formatDateOnly,
  formatDateTime,
} from "@/features/dashboard/formatters";

import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Today Match | HuMob",
  description:
    "Manage today's HuMob performance activities.",
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

  const canEdit =
    isDailyMatchEditable(dailyMatch);

  const visibleActivityCount =
    data.physicalActivities.length +
    data.productiveActivities.length;

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>

          <div className="text-right">
            <p className="font-medium">
              Today Match
            </p>

            <p className="text-xs text-zinc-600">
              HuMob Daily Performance
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <section className="rounded-2xl border border-white/10 bg-zinc-950 p-6">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {formatDateOnly(
                    dailyMatch.match_date,
                  )}
                </h1>

                <StatusBadge
                  status={dailyMatch.status}
                  canEdit={canEdit}
                />
              </div>

              <p className="mt-2 text-sm text-zinc-500">
                Timezone: {dailyMatch.timezone}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <SummaryItem
                icon={
                  <Layers3 className="h-4 w-4" />
                }
                label="Total Inputs"
                value={String(
                  dailyMatch.input_item_count,
                )}
              />

              <SummaryItem
                icon={
                  <Clock3 className="h-4 w-4" />
                }
                label="Input Closes"
                value={formatDateTime(
                  dailyMatch.input_closes_at,
                  dailyMatch.timezone,
                )}
              />

              <SummaryItem
                icon={
                  <CalendarDays className="h-4 w-4" />
                }
                label="Rating Queue"
                value={formatDateTime(
                  dailyMatch.rating_queues_at,
                  dailyMatch.timezone,
                )}
              />
            </div>
          </div>

          {dailyMatch.input_item_count !==
          visibleActivityCount ? (
            <p className="mt-5 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-xs leading-5 text-zinc-600">
              Total Inputs includes every supported HuMob
              input category. This page currently displays
              {` ${visibleActivityCount} `}
              Physical and Productive activity record(s).
            </p>
          ) : null}
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

        {!canEdit ? (
          <section className="flex items-start gap-4 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
            <div className="rounded-xl bg-amber-400/10 p-2.5 text-amber-300">
              <LockKeyhole className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-medium text-amber-200">
                Activity input is read-only
              </h2>

              <p className="mt-1 text-sm leading-6 text-amber-200/60">
                This Daily Match is{" "}
                {formatDailyMatchStatus(
                  dailyMatch.status,
                ).toLowerCase()}
                , or its input deadline has passed. Existing
                records remain available for review.
              </p>
            </div>
          </section>
        ) : null}

        {canEdit ? (
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-zinc-950 p-6">
              <PhysicalActivityForm
                dailyMatchId={dailyMatch.id}
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-zinc-950 p-6">
              <ProductiveActivityForm
                dailyMatchId={dailyMatch.id}
              />
            </div>
          </section>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-2">
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
        </section>
      </div>
    </main>
  );
}

function StatusBadge({
  status,
  canEdit,
}: {
  status:
    | "open"
    | "locked"
    | "queued"
    | "processing"
    | "rated"
    | "failed";
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
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <LockKeyhole className="h-3.5 w-3.5" />
      )}

      {formatDailyMatchStatus(status)}
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
    <div className="min-w-44 rounded-xl border border-white/10 bg-black/30 p-4">
      <div className="flex items-center gap-2 text-xs text-zinc-600">
        {icon}
        {label}
      </div>

      <p className="mt-2 text-sm font-medium text-zinc-300">
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
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <section className="w-full max-w-lg rounded-2xl border border-amber-400/20 bg-zinc-950 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <h1 className="mt-6 text-2xl font-semibold">
          Daily Match is not active yet
        </h1>

        <p className="mt-3 text-sm leading-6 text-zinc-500">
          Your account has not reached its Daily Match
          activation date. This can occur when an account is
          created after the configured activation cutoff.
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
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-medium text-black transition hover:bg-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Return to Dashboard
        </Link>
      </section>
    </main>
  );
}