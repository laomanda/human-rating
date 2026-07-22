import type {
  SupabaseClient,
  User,
} from "@supabase/supabase-js";

import {
  DEFAULT_TIME_ZONE,
  getDateKeyForTimeZone,
  normalizeTimeZone,
  toInteger,
  toNullableNumber,
} from "@/features/dashboard/formatters";

import type {
  AppConfigRow,
  DashboardAggregate,
  DashboardData,
  DailyMatchRow,
  DailyRatingRow,
  ProfileSummary,
} from "@/features/dashboard/types";

const PROFILE_SELECT = `
  id,
  username
`;

const APP_CONFIG_SELECT = `
  singleton,
  daily_match_lock_time,
  rating_queue_time,
  new_user_activation_cutoff,
  calibration_days,
  account_deletion_grace_days,
  morning_reminder_time,
  afternoon_reminder_time,
  evening_reminder_time,
  final_reminder_time,
  updated_at
`;

const DAILY_MATCH_SELECT = `
  id,
  user_id,
  match_date,
  timezone,
  opens_at,
  input_closes_at,
  rating_queues_at,
  status,
  input_item_count,
  locked_at,
  queued_at,
  processing_started_at,
  rated_at,
  created_at,
  updated_at
`;

const DAILY_RATING_SELECT = `
  id,
  daily_match_id,
  user_id,
  energy_has_data,
  focus_has_data,
  discipline_has_data,
  responsibility_has_data,
  energy_rating,
  focus_rating,
  discipline_rating,
  responsibility_rating,
  overall_rating,
  source,
  provider_used,
  model_used,
  validation_flags,
  created_at
`;

type QueryError = {
  message: string;
};

type UnknownRecord = Record<string, unknown>;

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

function asBoolean(value: unknown): boolean {
  return value === true;
}

function addWarning(
  warnings: string[],
  label: string,
  error: QueryError | null,
) {
  if (error) {
    warnings.push(`${label}: ${error.message}`);
  }
}

function normalizeProfile(
  value: unknown,
): ProfileSummary | null {
  const row = asRecord(value);

  if (!row) {
    return null;
  }

  const id = asString(row.id);

  if (!id) {
    return null;
  }

  return {
    id,
    username: asString(row.username),
  };
}

function normalizeAppConfig(
  value: unknown,
): AppConfigRow | null {
  const row = asRecord(value);

  if (!row) {
    return null;
  }

  return {
    singleton: row.singleton === true,

    daily_match_lock_time:
      asString(row.daily_match_lock_time) ??
      "23:45:00",

    rating_queue_time:
      asString(row.rating_queue_time) ??
      "23:55:00",

    new_user_activation_cutoff:
      asString(row.new_user_activation_cutoff) ??
      "18:00:00",

    calibration_days: toInteger(
      row.calibration_days,
      7,
    ),

    account_deletion_grace_days: toInteger(
      row.account_deletion_grace_days,
      7,
    ),

    morning_reminder_time:
      asString(row.morning_reminder_time) ??
      "08:00:00",

    afternoon_reminder_time:
      asString(row.afternoon_reminder_time) ??
      "15:00:00",

    evening_reminder_time:
      asString(row.evening_reminder_time) ??
      "21:00:00",

    final_reminder_time:
      asString(row.final_reminder_time) ??
      "23:30:00",

    updated_at: asString(row.updated_at) ?? "",
  };
}

function normalizeDailyMatch(
  value: unknown,
): DailyMatchRow | null {
  const row = asRecord(value);

  if (!row) {
    return null;
  }

  const id = asString(row.id);
  const userId = asString(row.user_id);
  const matchDate = asString(row.match_date);

  if (!id || !userId || !matchDate) {
    return null;
  }

  return {
    id,
    user_id: userId,
    match_date: matchDate,

    timezone: normalizeTimeZone(
      asString(row.timezone),
    ),

    opens_at: asString(row.opens_at) ?? "",

    input_closes_at:
      asString(row.input_closes_at) ?? "",

    rating_queues_at:
      asString(row.rating_queues_at) ?? "",

    status: asString(row.status) ?? "unknown",

    input_item_count: toInteger(
      row.input_item_count,
    ),

    locked_at: asString(row.locked_at),
    queued_at: asString(row.queued_at),

    processing_started_at: asString(
      row.processing_started_at,
    ),

    rated_at: asString(row.rated_at),
    created_at: asString(row.created_at) ?? "",
    updated_at: asString(row.updated_at) ?? "",
  };
}

function normalizeDailyRating(
  value: unknown,
): DailyRatingRow | null {
  const row = asRecord(value);

  if (!row) {
    return null;
  }

  const id = asString(row.id);
  const dailyMatchId = asString(
    row.daily_match_id,
  );
  const userId = asString(row.user_id);

  if (!id || !dailyMatchId || !userId) {
    return null;
  }

  return {
    id,
    daily_match_id: dailyMatchId,
    user_id: userId,

    energy_has_data: asBoolean(
      row.energy_has_data,
    ),

    focus_has_data: asBoolean(
      row.focus_has_data,
    ),

    discipline_has_data: asBoolean(
      row.discipline_has_data,
    ),

    responsibility_has_data: asBoolean(
      row.responsibility_has_data,
    ),

    energy_rating: toNullableNumber(
      row.energy_rating,
    ),

    focus_rating: toNullableNumber(
      row.focus_rating,
    ),

    discipline_rating: toNullableNumber(
      row.discipline_rating,
    ),

    responsibility_rating: toNullableNumber(
      row.responsibility_rating,
    ),

    overall_rating: toNullableNumber(
      row.overall_rating,
    ),

    source: asString(row.source) ?? "unknown",
    provider_used: asString(row.provider_used),
    model_used: asString(row.model_used),

    validation_flags:
      row.validation_flags ?? [],

    created_at: asString(row.created_at) ?? "",
  };
}

function normalizeMatches(
  value: unknown,
): DailyMatchRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeDailyMatch)
    .filter(
      (row): row is DailyMatchRow =>
        row !== null,
    );
}

function normalizeRatings(
  value: unknown,
): DailyRatingRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeDailyRating)
    .filter(
      (row): row is DailyRatingRow =>
        row !== null,
    );
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

  const total = validValues.reduce(
    (sum, value) => sum + value,
    0,
  );

  return total / validValues.length;
}

function createRatingAggregate(
  ratings: DailyRatingRow[],
): DashboardAggregate {
  return {
    averageOverall: average(
      ratings.map(
        (rating) => rating.overall_rating,
      ),
    ),

    averageEnergy: average(
      ratings.map(
        (rating) => rating.energy_rating,
      ),
    ),

    averageFocus: average(
      ratings.map(
        (rating) => rating.focus_rating,
      ),
    ),

    averageDiscipline: average(
      ratings.map(
        (rating) =>
          rating.discipline_rating,
      ),
    ),

    averageResponsibility: average(
      ratings.map(
        (rating) =>
          rating.responsibility_rating,
      ),
    ),

    ratingCount: ratings.length,
  };
}

export async function getDashboardData(
  supabase: SupabaseClient,
  user: User,
): Promise<DashboardData> {
  const warnings: string[] = [];

  const [
    profileResult,
    appConfigResult,
    matchesResult,
    ratingsResult,
    bestRatingResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("id", user.id)
      .maybeSingle(),

    supabase
      .from("app_config")
      .select(APP_CONFIG_SELECT)
      .eq("singleton", true)
      .maybeSingle(),

    supabase
      .from("daily_matches")
      .select(DAILY_MATCH_SELECT)
      .eq("user_id", user.id)
      .order("match_date", {
        ascending: false,
      })
      .limit(45),

    supabase
      .from("daily_ratings")
      .select(DAILY_RATING_SELECT)
      .eq("user_id", user.id)
      .not("overall_rating", "is", null)
      .order("created_at", {
        ascending: false,
      })
      .limit(60),

    supabase
      .from("daily_ratings")
      .select(DAILY_RATING_SELECT)
      .eq("user_id", user.id)
      .not("overall_rating", "is", null)
      .order("overall_rating", {
        ascending: false,
      })
      .order("created_at", {
        ascending: true,
      })
      .limit(1)
      .maybeSingle(),
  ]);

  addWarning(
    warnings,
    "Profile query failed",
    profileResult.error,
  );

  addWarning(
    warnings,
    "App config query failed",
    appConfigResult.error,
  );

  addWarning(
    warnings,
    "Daily matches query failed",
    matchesResult.error,
  );

  addWarning(
    warnings,
    "Daily ratings query failed",
    ratingsResult.error,
  );

  addWarning(
    warnings,
    "Best rating query failed",
    bestRatingResult.error,
  );

  const profile = normalizeProfile(
    profileResult.data,
  );

  const appConfig = normalizeAppConfig(
    appConfigResult.data,
  );

  const matches = normalizeMatches(
    matchesResult.data,
  );

  const ratings = normalizeRatings(
    ratingsResult.data,
  );

  /*
   * Rata-rata dihitung di server Next.js dari maksimal
   * 60 daily rating terbaru.
   *
   * Kita tidak memakai fungsi aggregate PostgREST karena
   * aggregate functions tidak diaktifkan pada Supabase ini.
   */
  const aggregate = createRatingAggregate(
    ratings,
  );

  const ratingByMatchId = new Map<
    string,
    DailyRatingRow
  >(
    ratings.map((rating) => [
      rating.daily_match_id,
      rating,
    ]),
  );

  const timeZone =
    matches.at(0)?.timezone ??
    DEFAULT_TIME_ZONE;

  const todayDate = getDateKeyForTimeZone(
    new Date(),
    timeZone,
  );

  const todayMatch =
    matches.find(
      (match) =>
        match.match_date === todayDate,
    ) ?? null;

  const todayRating = todayMatch
    ? ratingByMatchId.get(todayMatch.id) ??
      null
    : null;

  const latestRating =
    ratings.at(0) ?? null;

  const latestRatingMatch = latestRating
    ? matches.find(
        (match) =>
          match.id ===
          latestRating.daily_match_id,
      ) ?? null
    : null;

  let bestRating = normalizeDailyRating(
    bestRatingResult.data,
  );

  if (!bestRating) {
    bestRating =
      [...ratings].sort(
        (first, second) =>
          (second.overall_rating ?? -1) -
          (first.overall_rating ?? -1),
      )[0] ?? null;
  }

  let bestMatch = bestRating
    ? matches.find(
        (match) =>
          match.id ===
          bestRating.daily_match_id,
      ) ?? null
    : null;

  /*
   * Riwayat daily_matches hanya mengambil 45 row terbaru.
   * Jika best rating berada di luar rentang itu, ambil
   * daily match terkait secara terpisah.
   */
  if (bestRating && !bestMatch) {
    const bestMatchResult = await supabase
      .from("daily_matches")
      .select(DAILY_MATCH_SELECT)
      .eq("id", bestRating.daily_match_id)
      .eq("user_id", user.id)
      .maybeSingle();

    addWarning(
      warnings,
      "Best performance date query failed",
      bestMatchResult.error,
    );

    bestMatch = normalizeDailyMatch(
      bestMatchResult.data,
    );
  }

  const history = matches
    .slice(0, 30)
    .map((match) => ({
      match,
      rating:
        ratingByMatchId.get(match.id) ??
        null,
    }));

  return {
    profile,
    appConfig,
    timeZone,

    todayMatch,
    todayRating,

    latestRating,
    latestRatingMatch,

    bestPerformance: bestRating
      ? {
          rating: bestRating,
          match: bestMatch,
        }
      : null,

    aggregate,
    history,
    warnings,
  };
}