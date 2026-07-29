import type { SupabaseClient } from "@supabase/supabase-js";

import {
  ACHIEVEMENT_DEFINITIONS,
  type AchievementCollection,
  type AchievementKey,
  type AchievementState,
  type AchievementUnlockRow,
} from "@/features/achievement/achievement-types";

type UnknownRecord = Record<string, unknown>;

const ACHIEVEMENT_UNLOCK_SELECT = [
  "achievement_key",
  "unlocked_at",
  "source_match_id",
].join(",");

function asRecord(value: unknown): UnknownRecord | null {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as UnknownRecord;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function normalizeAchievementUnlock(
  value: unknown,
): AchievementUnlockRow | null {
  const row = asRecord(value);

  if (!row) {
    return null;
  }

  const achievementKey = asString(
    row.achievement_key,
  );
  const unlockedAt = asString(row.unlocked_at);

  if (!achievementKey || !unlockedAt) {
    return null;
  }

  return {
    achievement_key: achievementKey,
    unlocked_at: unlockedAt,
    source_match_id: asString(
      row.source_match_id,
    ),
  };
}

function createUnavailableCollection(
  message: string | null = null,
): AchievementCollection {
  return {
    available: false,
    errorMessage:
      message ?? "Achievement data unavailable",
    achievements: [],
    latestUnlocked: [],
    unlockedCount: 0,
    totalCount:
      ACHIEVEMENT_DEFINITIONS.length,
  };
}

function buildAchievementCollection(
  unlockRows: AchievementUnlockRow[],
): AchievementCollection {
  const unlockByKey = new Map<
    AchievementKey,
    AchievementUnlockRow
  >();

  for (const row of unlockRows) {
    const key = ACHIEVEMENT_DEFINITIONS.find(
      (definition) =>
        definition.key === row.achievement_key,
    )?.key;

    if (key) {
      unlockByKey.set(key, row);
    }
  }

  const achievements: AchievementState[] =
    ACHIEVEMENT_DEFINITIONS.map((definition) => {
      const unlock = unlockByKey.get(
        definition.key,
      );

      return {
        ...definition,
        unlocked: unlock !== undefined,
        unlockedAt:
          unlock?.unlocked_at ?? null,
        sourceMatchId:
          unlock?.source_match_id ?? null,
      };
    });

  const latestUnlocked = achievements
    .filter((achievement) => achievement.unlocked)
    .sort((first, second) => {
      const firstTime = first.unlockedAt
        ? new Date(first.unlockedAt).getTime()
        : 0;
      const secondTime = second.unlockedAt
        ? new Date(second.unlockedAt).getTime()
        : 0;

      return secondTime - firstTime;
    });

  return {
    available: true,
    errorMessage: null,
    achievements,
    latestUnlocked,
    unlockedCount: latestUnlocked.length,
    totalCount: ACHIEVEMENT_DEFINITIONS.length,
  };
}

export function getAchievementStatus(
  collection: AchievementCollection,
  key: AchievementKey,
): boolean {
  return collection.achievements.some(
    (achievement) =>
      achievement.key === key &&
      achievement.unlocked,
  );
}

export function getLatestUnlockedAchievements(
  collection: AchievementCollection,
  limit = 3,
): AchievementState[] {
  return collection.latestUnlocked.slice(
    0,
    limit,
  );
}

export async function getAchievementCollection(
  supabase: SupabaseClient,
  userId: string,
): Promise<AchievementCollection> {
  const { data, error } = await supabase
    .from("user_achievements")
    .select(ACHIEVEMENT_UNLOCK_SELECT)
    .eq("user_id", userId)
    .order("unlocked_at", {
      ascending: false,
    });

  if (error) {
    console.warn(
      "Achievement query failed",
      {
        code: error.code ?? null,
        message: error.message,
      },
    );

    return createUnavailableCollection();
  }

  const unlockRows = Array.isArray(data)
    ? data
        .map(normalizeAchievementUnlock)
        .filter(
          (
            row,
          ): row is AchievementUnlockRow =>
            row !== null,
        )
    : [];

  return buildAchievementCollection(
    unlockRows,
  );
}
