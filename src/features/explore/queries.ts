import type { SupabaseClient } from "@supabase/supabase-js";

import {
  ACHIEVEMENT_DEFINITIONS,
  type AchievementCollection,
  type AchievementKey,
  type AchievementState,
} from "@/features/achievement/achievement-types";

import type {
  PublicPerformanceSummary,
  PublicProfileAttribute,
  PublicProfileCardData,
  PublicProfileResult,
  PublicProfileSearchResult,
  PublicRatingHistoryPoint,
} from "@/features/explore/explore-types";

const PUBLIC_PROFILE_SELECT = [
  "id",
  "username",
  "full_name",
  "avatar_url",
  "bio",
].join(",");

const PUBLIC_ACHIEVEMENT_SELECT = [
  "achievement_key",
  "unlocked_at",
].join(",");

const PUBLIC_RATING_SELECT = [
  "energy_rating",
  "focus_rating",
  "discipline_rating",
  "overall_rating",
  "created_at",
].join(",");

const PUBLIC_PROFILE_LIMIT = 12;
const PUBLIC_RATING_LIMIT = 60;

type UnknownRecord = Record<string, unknown>;

type PublicRatingSnapshot = {
  energy: number | null;
  focus: number | null;
  discipline: number | null;
  overall: number | null;
  createdAt: string | null;
};

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

function toNullableNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeProfileCard(
  value: unknown,
): PublicProfileCardData | null {
  const row = asRecord(value);
  const id = asString(row?.id);
  const username = asString(row?.username);

  if (!id || !username) {
    return null;
  }

  return {
    id,
    username,
    displayName:
      asString(row?.full_name) ?? username,
    avatarUrl: asString(row?.avatar_url),
    bio: asString(row?.bio),
  };
}

function normalizeRating(
  value: unknown,
): PublicRatingSnapshot | null {
  const row = asRecord(value);

  if (!row) {
    return null;
  }

  return {
    energy: toNullableNumber(row.energy_rating),
    focus: toNullableNumber(row.focus_rating),
    discipline: toNullableNumber(
      row.discipline_rating,
    ),
    overall: toNullableNumber(row.overall_rating),
    createdAt: asString(row.created_at),
  };
}

function average(values: Array<number | null>): number | null {
  const validValues = values.filter(
    (value): value is number =>
      value !== null && Number.isFinite(value),
  );

  if (validValues.length === 0) {
    return null;
  }

  return (
    validValues.reduce(
      (total, value) => total + value,
      0,
    ) / validValues.length
  );
}

function createPerformanceSummary(
  ratings: PublicRatingSnapshot[],
  totalRatedDays: number,
): PublicPerformanceSummary {
  const averageEnergy = average(
    ratings.map((rating) => rating.energy),
  );
  const averageFocus = average(
    ratings.map((rating) => rating.focus),
  );
  const averageDiscipline = average(
    ratings.map((rating) => rating.discipline),
  );

  const attributes: PublicProfileAttribute[] = [
    {
      key: "energy",
      label: "Energy",
      value: averageEnergy ?? -1,
    },
    {
      key: "focus",
      label: "Focus",
      value: averageFocus ?? -1,
    },
    {
      key: "discipline",
      label: "Discipline",
      value: averageDiscipline ?? -1,
    },
  ];

  const validAttributes = attributes.filter(
    (attribute) => attribute.value >= 0,
  );

  const ratingHistory: PublicRatingHistoryPoint[] =
    ratings
      .flatMap((rating) => {
        if (
          rating.overall === null ||
          !rating.createdAt ||
          Number.isNaN(
            new Date(rating.createdAt).getTime(),
          )
        ) {
          return [];
        }

        return [
          {
            overallRating: rating.overall,
            createdAt: rating.createdAt,
          },
        ];
      })
      .sort((first, second) =>
        first.createdAt.localeCompare(second.createdAt),
      );

  return {
    averageOverall: average(
      ratings.map((rating) => rating.overall),
    ),
    bestOverall: ratings.reduce<number | null>(
      (best, rating) => {
        if (rating.overall === null) {
          return best;
        }

        return best === null
          ? rating.overall
          : Math.max(best, rating.overall);
      },
      null,
    ),
    averageEnergy,
    averageFocus,
    averageDiscipline,
    ratedDays: totalRatedDays,
    sampledRatingCount: ratings.length,
    strongestAttribute:
      validAttributes.length > 0
        ? validAttributes.reduce(
            (strongest, attribute) =>
              attribute.value > strongest.value
                ? attribute
                : strongest,
          )
        : null,
    ratingHistory,
  };
}

function isAchievementKey(
  value: string,
): value is AchievementKey {
  return ACHIEVEMENT_DEFINITIONS.some(
    (definition) => definition.key === value,
  );
}

function createAchievementCollection(
  rows: unknown,
): AchievementCollection {
  const unlocks = new Map<
    AchievementKey,
    string
  >();

  if (Array.isArray(rows)) {
    for (const value of rows) {
      const row = asRecord(value);
      const key = asString(row?.achievement_key);
      const unlockedAt = asString(row?.unlocked_at);

      if (key && unlockedAt && isAchievementKey(key)) {
        unlocks.set(key, unlockedAt);
      }
    }
  }

  const achievements: AchievementState[] =
    ACHIEVEMENT_DEFINITIONS.map((definition) => {
      const unlockedAt = unlocks.get(definition.key) ?? null;

      return {
        ...definition,
        unlocked: unlockedAt !== null,
        unlockedAt,
        sourceMatchId: null,
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

function unavailableAchievements(): AchievementCollection {
  return {
    available: false,
    errorMessage: "Achievement data unavailable",
    achievements: [],
    latestUnlocked: [],
    unlockedCount: 0,
    totalCount: ACHIEVEMENT_DEFINITIONS.length,
  };
}

function escapeIlike(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("%", "\\%")
    .replaceAll("_", "\\_");
}

function unavailableSearchResult(): PublicProfileSearchResult {
  return {
    available: false,
    errorMessage: "Profil tidak dapat dicari saat ini.",
    profiles: [],
  };
}

export async function searchPublicProfiles(
  supabase: SupabaseClient,
  query: string,
): Promise<PublicProfileSearchResult> {
  const normalizedQuery = query.trim();

  if (normalizedQuery.length < 2) {
    return {
      available: true,
      errorMessage: null,
      profiles: [],
    };
  }

  const pattern = `%${escapeIlike(normalizedQuery)}%`;
  const [usernameResult, displayNameResult] =
    await Promise.all([
      supabase
        .from("public_profiles")
        .select(PUBLIC_PROFILE_SELECT)
        .ilike("username", pattern)
        .limit(PUBLIC_PROFILE_LIMIT),
      supabase
        .from("public_profiles")
        .select(PUBLIC_PROFILE_SELECT)
        .ilike("full_name", pattern)
        .limit(PUBLIC_PROFILE_LIMIT),
    ]);

  if (usernameResult.error || displayNameResult.error) {
    console.warn("Public profile search failed", {
      code:
        usernameResult.error?.code ??
        displayNameResult.error?.code ??
        null,
    });

    return unavailableSearchResult();
  }

  const profiles = new Map<string, PublicProfileCardData>();

  for (const row of [
    ...(usernameResult.data ?? []),
    ...(displayNameResult.data ?? []),
  ]) {
    const profile = normalizeProfileCard(row);

    if (profile) {
      profiles.set(profile.id, profile);
    }
  }

  return {
    available: true,
    errorMessage: null,
    profiles: Array.from(profiles.values()).slice(
      0,
      PUBLIC_PROFILE_LIMIT,
    ),
  };
}

export async function getPublicProfile(
  supabase: SupabaseClient,
  username: string,
): Promise<PublicProfileResult> {
  const normalizedUsername = username.trim().toLowerCase();

  if (!/^[a-z0-9._]{4,20}$/.test(normalizedUsername)) {
    return {
      status: "not_found",
      errorMessage: null,
      profile: null,
    };
  }

  const profileResult = await supabase
    .from("public_profiles")
    .select(PUBLIC_PROFILE_SELECT)
    .eq("username", normalizedUsername)
    .maybeSingle();

  if (profileResult.error) {
    console.warn("Public profile query failed", {
      code: profileResult.error.code ?? null,
    });

    return {
      status: "error",
      errorMessage: "Profil publik tidak dapat dimuat.",
      profile: null,
    };
  }

  const profile = normalizeProfileCard(profileResult.data);

  if (!profile) {
    return {
      status: "not_found",
      errorMessage: null,
      profile: null,
    };
  }

  const [achievementResult, ratingsResult] =
    await Promise.all([
      supabase
        .from("public_user_achievements")
        .select(PUBLIC_ACHIEVEMENT_SELECT)
        .eq("user_id", profile.id)
        .order("unlocked_at", {
          ascending: false,
        }),
      supabase
        .from("public_profile_ratings")
        .select(PUBLIC_RATING_SELECT, {
          count: "exact",
        })
        .eq("user_id", profile.id)
        .order("created_at", {
          ascending: false,
        })
        .limit(PUBLIC_RATING_LIMIT),
    ]);

  if (ratingsResult.error) {
    console.warn("Public profile performance query failed", {
      code: ratingsResult.error.code ?? null,
    });

    return {
      status: "error",
      errorMessage: "Ringkasan performa tidak dapat dimuat.",
      profile: null,
    };
  }

  const ratings = (ratingsResult.data ?? [])
    .map(normalizeRating)
    .filter(
      (rating): rating is PublicRatingSnapshot =>
        rating !== null,
    );

  return {
    status: "found",
    errorMessage: null,
    profile: {
      ...profile,
      achievements: achievementResult.error
        ? unavailableAchievements()
        : createAchievementCollection(
            achievementResult.data,
          ),
      performance: createPerformanceSummary(
        ratings,
        ratingsResult.count ?? ratings.length,
      ),
    },
  };
}
