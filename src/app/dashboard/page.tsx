import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import {
  Activity,
  BatteryCharging,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Focus,
  Gauge,
  History,
  ShieldCheck,
  Trophy,
} from "lucide-react";

import Image from "next/image";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";

import {
  formatClock,
  formatDateOnly,
  formatDateTime,
  formatScore,
  formatStatus,
  getDateKeyForTimeZone,
  getInitials,
} from "@/features/dashboard/formatters";

import { getDashboardData } from "@/features/dashboard/queries";

import { createClient } from "@/lib/supabase/server";

type GoogleUserMetadata = {
  full_name?: string;
  name?: string;
  avatar_url?: string;
  picture?: string;
};

export const metadata = {
  title: "Dashboard | HuMob",
  description: "HuMob personal performance dashboard.",
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

  const metadata =
    user.user_metadata as GoogleUserMetadata;

  const displayName =
    metadata.full_name ??
    metadata.name ??
    user.email?.split("@")[0] ??
    "HuMob User";

  const avatarUrl =
    metadata.avatar_url ?? metadata.picture ?? null;

  const initials = getInitials(displayName) || "H";

  const latestRatingDate =
    dashboard.latestRatingMatch?.match_date ?? null;

  const todayDate = getDateKeyForTimeZone(
    new Date(),
    dashboard.timeZone,
  );

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white font-semibold text-black">
              H
            </div>

            <div>
              <p className="font-semibold">HuMob</p>
              <p className="text-xs text-zinc-500">
                Functional Dashboard
              </p>
            </div>
          </div>

          <SignOutButton />
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <section className="flex flex-col justify-between gap-5 rounded-2xl border border-white/10 bg-zinc-950 p-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={`${displayName} profile`}
                width={64}
                height={64}
                priority
                className="h-16 w-16 rounded-2xl border border-white/10 object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-lg font-semibold">
                {initials}
              </div>
            )}

            <div>
              <p className="text-sm text-zinc-500">
                Logged in as
              </p>

              <h1 className="mt-1 text-2xl font-semibold">
                {displayName}
              </h1>

              <div className="mt-1 space-y-0.5 text-sm text-zinc-500">
                <p>{user.email}</p>

                {dashboard.profile?.username ? (
                  <p>
                    Username: @
                    {dashboard.profile.username}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-2 text-sm sm:items-end">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
              Authenticated
            </span>

            <span className="text-xs text-zinc-600">
              Timezone: {dashboard.timeZone}
            </span>
          </div>
        </section>

        <section>
          <div className="mb-3">
            <h2 className="font-medium">
              Performance Summary
            </h2>

            <p className="text-sm text-zinc-500">
              Database values, not dummy scores.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <ScoreCard
              icon={<Gauge className="h-5 w-5" />}
              title="Overall Average"
              value={formatScore(
                dashboard.aggregate.averageOverall,
              )}
              description={`${dashboard.aggregate.ratingCount} finalized rating(s)`}
            />

            <ScoreCard
              icon={
                <BatteryCharging className="h-5 w-5" />
              }
              title="Latest Energy"
              value={formatScore(
                dashboard.latestRating?.energy_rating ??
                null,
              )}
              description={
                latestRatingDate
                  ? formatDateOnly(latestRatingDate)
                  : "No finalized rating"
              }
            />

            <ScoreCard
              icon={<Focus className="h-5 w-5" />}
              title="Latest Focus"
              value={formatScore(
                dashboard.latestRating?.focus_rating ??
                null,
              )}
              description={
                dashboard.latestRating?.focus_has_data
                  ? "Input data available"
                  : "No focus data"
              }
            />

            <ScoreCard
              icon={<CheckCircle2 className="h-5 w-5" />}
              title="Latest Discipline"
              value={formatScore(
                dashboard.latestRating
                  ?.discipline_rating ?? null,
              )}
              description={
                dashboard.latestRating
                  ?.discipline_has_data
                  ? "Calculated by backend"
                  : "No discipline data"
              }
            />

            <ScoreCard
              icon={
                <ClipboardCheck className="h-5 w-5" />
              }
              title="Latest Responsibility"
              value={formatScore(
                dashboard.latestRating
                  ?.responsibility_rating ?? null,
              )}
              description={
                dashboard.latestRating
                  ?.responsibility_has_data
                  ? "Input data available"
                  : "No responsibility data"
              }
            />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <DataPanel
            icon={<Activity className="h-5 w-5" />}
            title="Today Match"
            subtitle={formatDateOnly(todayDate)}
          >
            {dashboard.todayMatch ? (
              <dl className="grid gap-4 sm:grid-cols-2">
                <DataItem
                  label="Status"
                  value={formatStatus(
                    dashboard.todayMatch.status,
                  )}
                />

                <DataItem
                  label="Input items"
                  value={String(
                    dashboard.todayMatch.input_item_count,
                  )}
                />

                <DataItem
                  label="Opened"
                  value={formatDateTime(
                    dashboard.todayMatch.opens_at,
                    dashboard.timeZone,
                  )}
                />

                <DataItem
                  label="Input closes"
                  value={formatDateTime(
                    dashboard.todayMatch.input_closes_at,
                    dashboard.timeZone,
                  )}
                />

                <DataItem
                  label="Rating queued at"
                  value={formatDateTime(
                    dashboard.todayMatch.rating_queues_at,
                    dashboard.timeZone,
                  )}
                />

                <DataItem
                  label="Today rating"
                  value={formatScore(
                    dashboard.todayRating?.overall_rating ??
                    null,
                  )}
                />
              </dl>
            ) : (
              <EmptyState
                title="No daily match for today"
                description="No row was found in daily_matches for the current date and timezone."
              />
            )}

            {/* Tombol masuk ke halaman input aktivitas */}
            <div className="mt-5">
              <Link
                href="/dashboard/today"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200"
              >
                Open Today Match
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </DataPanel>

          <DataPanel
            icon={<Trophy className="h-5 w-5" />}
            title="Best Performance"
            subtitle="Highest finalized overall rating"
          >
            {dashboard.bestPerformance ? (
              <div className="space-y-5">
                <div>
                  <p className="text-5xl font-semibold">
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
                    label="Source"
                    value={formatStatus(
                      dashboard.bestPerformance.rating.source,
                    )}
                  />

                  <DataItem
                    label="Provider"
                    value={
                      dashboard.bestPerformance.rating
                        .provider_used ?? "—"
                    }
                  />

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
                </dl>
              </div>
            ) : (
              <EmptyState
                title="No finalized performance"
                description="Best performance will appear after a daily rating is stored."
              />
            )}
          </DataPanel>
        </section>

        <DataPanel
          icon={<History className="h-5 w-5" />}
          title="Recent Performance History"
          subtitle="Last 30 daily match records"
        >
          {dashboard.history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-500">
                    <th className="px-3 py-3 font-medium">
                      Date
                    </th>
                    <th className="px-3 py-3 font-medium">
                      Match Status
                    </th>
                    <th className="px-3 py-3 font-medium">
                      Inputs
                    </th>
                    <th className="px-3 py-3 font-medium">
                      Overall
                    </th>
                    <th className="px-3 py-3 font-medium">
                      Source
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {dashboard.history.map(
                    ({ match, rating }) => (
                      <tr
                        key={match.id}
                        className="border-b border-white/5"
                      >
                        <td className="px-3 py-4">
                          {formatDateOnly(
                            match.match_date,
                          )}
                        </td>

                        <td className="px-3 py-4 text-zinc-400">
                          {formatStatus(match.status)}
                        </td>

                        <td className="px-3 py-4 text-zinc-400">
                          {match.input_item_count}
                        </td>

                        <td className="px-3 py-4 font-medium">
                          {formatScore(
                            rating?.overall_rating ??
                            null,
                          )}
                        </td>

                        <td className="px-3 py-4 text-zinc-400">
                          {rating
                            ? formatStatus(rating.source)
                            : "Not rated"}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No performance history"
              description="No daily_matches rows are available for this account."
            />
          )}
        </DataPanel>

        <section className="grid gap-4 md:grid-cols-3">
          <SystemInfo
            icon={<Clock3 className="h-5 w-5" />}
            title="Input Lock"
            value={formatClock(
              dashboard.appConfig
                ?.daily_match_lock_time ?? null,
            )}
          />

          <SystemInfo
            icon={<CalendarDays className="h-5 w-5" />}
            title="Rating Queue"
            value={formatClock(
              dashboard.appConfig
                ?.rating_queue_time ?? null,
            )}
          />

          <SystemInfo
            icon={<CheckCircle2 className="h-5 w-5" />}
            title="Calibration"
            value={
              dashboard.appConfig
                ? `${dashboard.appConfig.calibration_days} days`
                : "—"
            }
          />
        </section>

        {dashboard.warnings.length > 0 ? (
          <section className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
            <h2 className="font-medium text-amber-300">
              Partial data warning
            </h2>

            <ul className="mt-3 space-y-2 text-sm text-amber-200/70">
              {dashboard.warnings.map((warning) => (
                <li key={warning}>• {warning}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
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
    <article className="rounded-2xl border border-white/10 bg-zinc-950 p-5">
      <div className="text-zinc-500">{icon}</div>

      <p className="mt-5 text-sm text-zinc-500">
        {title}
      </p>

      <p className="mt-1 text-3xl font-semibold">
        {value}
      </p>

      <p className="mt-3 text-xs text-zinc-600">
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
    <section className="rounded-2xl border border-white/10 bg-zinc-950 p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-400">
          {icon}
        </div>

        <div>
          <h2 className="font-medium">{title}</h2>
          <p className="text-sm text-zinc-500">
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
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <dt className="text-xs uppercase tracking-wide text-zinc-600">
        {label}
      </dt>

      <dd className="mt-2 text-sm text-zinc-300">
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
    <article className="flex items-center gap-4 rounded-2xl border border-white/10 bg-zinc-950 p-5">
      <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-500">
        {icon}
      </div>

      <div>
        <p className="text-sm text-zinc-500">
          {title}
        </p>

        <p className="mt-1 font-medium">{value}</p>
      </div>
    </article>
  );
}