import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ProfileAttributeKey,
  ProfilePageData,
  ProfilePerformanceStats,
  ProfileRecord,
  StrongestProfileAttribute,
} from "@/features/profile/types";

import { getAchievementCollection } from "@/features/achievement/queries";

const PROFILE_SELECT = [
  "id",
  "username",
  "full_name",
  "avatar_url",
  "bio",
  "is_private",
  "timezone",
  "onboarding_completed",
  "account_status",
  "created_at",
  "updated_at",
].join(",");

const PROFILE_RATING_SELECT = [
  "energy_rating",
  "focus_rating",
  "discipline_rating",
  "overall_rating",
].join(",");

type RatingSnapshot = {
  energy: number | null;
  focus: number | null;
  discipline: number | null;
  overall: number | null;
};

type AttributeCandidate = {
  key: ProfileAttributeKey;
  label: string;
  value: number | null;
};

function toNullableNumber(
  value: unknown,
): number | null {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim() !== ""
  ) {
    const parsed = Number(value);

    return Number.isFinite(parsed)
      ? parsed
      : null;
  }

  return null;
}

function normalizeRatingSnapshot(
  value: unknown,
): RatingSnapshot | null {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return null;
  }

  const row =
    value as Record<string, unknown>;

  return {
    energy: toNullableNumber(
      row.energy_rating,
    ),
    focus: toNullableNumber(
      row.focus_rating,
    ),
    discipline: toNullableNumber(
      row.discipline_rating,
    ),
    overall: toNullableNumber(
      row.overall_rating,
    ),
  };
}

function average(
  values: Array<number | null>,
): number | null {
  const validValues = values.filter(
    (value): value is number =>
      value !== null &&
      Number.isFinite(value),
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

function getStrongestAttribute(
  ratings: RatingSnapshot[],
): StrongestProfileAttribute | null {
  const candidates: AttributeCandidate[] = [
    {
      key: "energy",
      label: "Energy",
      value: average(
        ratings.map(
          (rating) => rating.energy,
        ),
      ),
    },
    {
      key: "focus",
      label: "Focus",
      value: average(
        ratings.map(
          (rating) => rating.focus,
        ),
      ),
    },
    {
      key: "discipline",
      label: "Discipline",
      value: average(
        ratings.map(
          (rating) =>
            rating.discipline,
        ),
      ),
    },
  ];

  const validCandidates =
    candidates.filter(
      (
        candidate,
      ): candidate is {
        key: ProfileAttributeKey;
        label: string;
        value: number;
      } => candidate.value !== null,
    );

  if (validCandidates.length === 0) {
    return null;
  }

  return validCandidates.reduce(
    (strongest, candidate) =>
      candidate.value > strongest.value
        ? candidate
        : strongest,
  );
}

function createPerformanceStats(
  ratings: RatingSnapshot[],
  ratedDays: number,
  bestOverall: number | null,
): ProfilePerformanceStats {
  return {
    averageOverall: average(
      ratings.map(
        (rating) => rating.overall,
      ),
    ),
    bestOverall,
    ratedDays,
    strongestAttribute:
      getStrongestAttribute(ratings),
  };
}

/**
 * Mengambil profil milik authenticated user.
 *
 * Database RLS tetap menjadi lapisan keamanan
 * utama terhadap akses profil.
 */
export async function getMyProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfileRecord | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Profil gagal dimuat: ${error.message}`,
    );
  }

  return data as ProfileRecord | null;
}

/**
 * Mengambil profil beserta ringkasan performa.
 *
 * Rata-rata atribut menggunakan maksimal
 * 60 rating terbaru agar konsisten dengan
 * ringkasan Dashboard saat ini.
 */
export async function getMyProfilePageData(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfilePageData | null> {
  const [
    profile,
    ratingsResult,
    ratedDaysResult,
    bestRatingResult,
    achievementsResult,
  ] = await Promise.all([
    getMyProfile(supabase, userId),

    supabase
      .from("daily_ratings")
      .select(PROFILE_RATING_SELECT)
      .eq("user_id", userId)
      .not("overall_rating", "is", null)
      .order("created_at", {
        ascending: false,
      })
      .limit(60),

    supabase
      .from("daily_ratings")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("user_id", userId)
      .not("overall_rating", "is", null),

    supabase
      .from("daily_ratings")
      .select("overall_rating")
      .eq("user_id", userId)
      .not("overall_rating", "is", null)
      .order("overall_rating", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle(),

    getAchievementCollection(
      supabase,
      userId,
    ),
  ]);

  if (!profile) {
    return null;
  }

  if (ratingsResult.error) {
    throw new Error(
      `Ringkasan rating gagal dimuat: ${ratingsResult.error.message}`,
    );
  }

  if (ratedDaysResult.error) {
    throw new Error(
      `Jumlah hari yang dinilai gagal dimuat: ${ratedDaysResult.error.message}`,
    );
  }

  if (bestRatingResult.error) {
    throw new Error(
      `Performa terbaik gagal dimuat: ${bestRatingResult.error.message}`,
    );
  }

  const ratings = Array.isArray(
    ratingsResult.data,
  )
    ? ratingsResult.data
        .map(normalizeRatingSnapshot)
        .filter(
          (
            rating,
          ): rating is RatingSnapshot =>
            rating !== null,
        )
    : [];

  const bestRatingRow =
    bestRatingResult.data as
      | Record<string, unknown>
      | null;

  const bestOverall =
    bestRatingRow === null
      ? null
      : toNullableNumber(
          bestRatingRow.overall_rating,
        );

  const ratedDays =
    ratedDaysResult.count ??
    ratings.length;

  return {
    profile,
    stats: createPerformanceStats(
      ratings,
      ratedDays,
      bestOverall,
    ),
    achievements: achievementsResult,
  };
}
