import type { ReactNode } from "react";

import {
  BadgeCheck,
  CalendarDays,
  Crown,
  Flame,
  Lock,
  Sparkles,
  Target,
} from "lucide-react";

import { formatDateOnly } from "@/features/dashboard/formatters";

import type {
  AchievementKey,
  AchievementState,
} from "@/features/achievement/achievement-types";

type AchievementCardProps = {
  achievement: AchievementState;
};

const ACHIEVEMENT_ICONS: Readonly<
  Record<AchievementKey, ReactNode>
> = {
  first_match: (
    <Sparkles className="h-5 w-5" />
  ),
  good_form: (
    <BadgeCheck className="h-5 w-5" />
  ),
  unbeaten_week: (
    <Flame className="h-5 w-5" />
  ),
  focused: (
    <Target className="h-5 w-5" />
  ),
  elite_performance: (
    <Crown className="h-5 w-5" />
  ),
  thirty_matches: (
    <CalendarDays className="h-5 w-5" />
  ),
};

export function AchievementCard({
  achievement,
}: AchievementCardProps) {
  const icon = ACHIEVEMENT_ICONS[
    achievement.key
  ];

  return (
    <article
      className={`rounded-2xl border p-4 sm:p-5 ${
        achievement.unlocked
          ? "border-emerald-400/20 bg-emerald-400/5"
          : "border-white/10 bg-black/20"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`rounded-xl border p-2.5 ${
              achievement.unlocked
                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                : "border-white/10 bg-white/5 text-zinc-500"
            }`}
          >
            {icon}
          </div>

          <div className="min-w-0">
            <h3 className="truncate font-medium text-white">
              {achievement.title}
            </h3>

            <p className="mt-1 text-sm leading-6 text-zinc-500">
              {achievement.description}
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
            achievement.unlocked
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
              : "border-white/10 bg-white/[0.03] text-zinc-500"
          }`}
        >
          {achievement.unlocked
            ? "Terbuka"
            : "Terkunci"}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-zinc-600">
        {achievement.unlocked ? (
          <BadgeCheck className="h-3.5 w-3.5" />
        ) : (
          <Lock className="h-3.5 w-3.5" />
        )}

        <span>
          {achievement.unlocked
            ? `Terbuka pada ${formatDateOnly(
                achievement.unlockedAt,
              )}`
            : "Akan terbuka saat syarat terpenuhi."}
        </span>
      </div>
    </article>
  );
}
