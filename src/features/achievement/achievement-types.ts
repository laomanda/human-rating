export const ACHIEVEMENT_DEFINITIONS = [
  {
    key: "first_match",
    title: "First Match",
    description:
      "Terbuka saat rating final pertama berhasil tersimpan.",
  },
  {
    key: "good_form",
    title: "Good Form",
    description:
      "Terbuka saat performa overall mencapai level kuat.",
  },
  {
    key: "unbeaten_week",
    title: "Unbeaten Week",
    description:
      "Terbuka saat kamu menjaga performa kuat selama 7 hari berurutan.",
  },
  {
    key: "focused",
    title: "Focused",
    description:
      "Terbuka saat focus rating mencapai ambang tinggi.",
  },
  {
    key: "elite_performance",
    title: "Elite Performance",
    description:
      "Terbuka saat overall rating mencapai level elite.",
  },
  {
    key: "thirty_matches",
    title: "30 Matches",
    description:
      "Terbuka saat kamu menyelesaikan 30 rating final.",
  },
] as const;

export type AchievementKey =
  (typeof ACHIEVEMENT_DEFINITIONS)[number]["key"];

export type AchievementDefinition =
  (typeof ACHIEVEMENT_DEFINITIONS)[number];

export type AchievementUnlockRow = {
  achievement_key: string;
  unlocked_at: string;
  source_match_id: string | null;
};

export type AchievementState = AchievementDefinition & {
  unlocked: boolean;
  unlockedAt: string | null;
  sourceMatchId: string | null;
};

export type AchievementCollection = {
  available: boolean;
  errorMessage: string | null;
  achievements: AchievementState[];
  latestUnlocked: AchievementState[];
  unlockedCount: number;
  totalCount: number;
};
