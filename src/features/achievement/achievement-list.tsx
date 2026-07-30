import {
  AlertTriangle,
  Trophy,
} from "lucide-react";

import { AchievementCard } from "@/features/achievement/achievement-card";
import type {
  AchievementState,
} from "@/features/achievement/achievement-types";

type AchievementListProps = {
  title: string;
  subtitle: string;
  achievements: AchievementState[];
  unlockedCount: number;
  totalCount: number;
  available: boolean;
  emptyMessage?: string;
};

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/20 p-6 text-center">
      <div className="max-w-md">
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

export function AchievementList({
  title,
  subtitle,
  achievements,
  unlockedCount,
  totalCount,
  available,
  emptyMessage = "Belum ada achievement yang terbuka.",
}: AchievementListProps) {
  const progressPercentage =
    totalCount > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (unlockedCount / totalCount) * 100,
          ),
        )
      : 0;

  if (!available) {
    return (
      <section
        aria-labelledby="achievement-list-title"
        className="rounded-2xl border border-app-border bg-app-surface p-5 sm:p-6"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-400">
            <AlertTriangle className="h-5 w-5" />
          </div>

          <div>
            <h2
              id="achievement-list-title"
              className="font-medium text-white"
            >
              {title}
            </h2>

            <p className="text-sm text-zinc-500">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <EmptyState
            title="Achievement data unavailable"
            description="Achievement data unavailable"
          />
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="achievement-list-title"
      className="rounded-2xl border border-app-border bg-app-surface p-5 sm:p-6"
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-400">
            <Trophy className="h-5 w-5" />
          </div>

          <div>
            <h2
              id="achievement-list-title"
              className="font-medium text-white"
            >
              {title}
            </h2>

            <p className="text-sm text-zinc-500">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="min-w-32">
          <p className="text-right text-sm text-zinc-500">
            {unlockedCount}/{totalCount} terbuka
          </p>

          <div
            role="progressbar"
            aria-label="Progress achievement"
            aria-valuemin={0}
            aria-valuemax={totalCount}
            aria-valuenow={unlockedCount}
            aria-valuetext={`${unlockedCount} dari ${totalCount} achievement terbuka`}
            className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]"
          >
            <div
              className="h-full rounded-full bg-emerald-400"
              style={{
                width: `${progressPercentage}%`,
              }}
            />
          </div>
        </div>
      </div>

      {achievements.length > 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {achievements.map((achievement) => (
            <AchievementCard
              key={achievement.key}
              achievement={achievement}
            />
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            title="Belum ada achievement"
            description={emptyMessage}
          />
        </div>
      )}
    </section>
  );
}
