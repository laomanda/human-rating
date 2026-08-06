import type {
  CanonicalRatingInput,
  DatabaseClient,
  DailyMatchRow,
  ExistingRatingRow,
  OtherActivityRow,
  PerformanceBaselineRow,
  PhysicalActivityRow,
  ProductiveActivityRow,
  ProfileRow,
  ScoringConfigRow,
  SleepEntryRow,
} from "./types.ts";

import {
  HttpError,
  toFiniteNumber,
  toInteger,
} from "./utils.ts";

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

const EXISTING_RATING_SELECT = `
  id,
  daily_match_id,
  user_id,
  scoring_config_id,
  energy_has_data,
  focus_has_data,
  discipline_has_data,
  logic_energy,
  logic_focus,
  logic_discipline,
  ai_energy_adjustment,
  ai_focus_adjustment,
  ai_discipline_adjustment,
  energy_rating,
  focus_rating,
  discipline_rating,
  overall_rating,
  source,
  provider_used,
  model_used,
  input_hash,
  validation_flags,
  created_at
`;

type UnknownRecord =
  Record<string, unknown>;

type QueryErrorLike = {
  message: string;
  code?: string | null;
};

function logAndThrowQueryError(
  label: string,
  error: QueryErrorLike | null,
): void {
  if (!error) {
    return;
  }

  console.error(label, {
    code: error.code ?? null,
    message: error.message,
  });

  throw new HttpError(
    500,
    "DATABASE_QUERY_FAILED",
    "The rating data could not be loaded from Supabase.",
  );
}

function normalizeDailyMatch(
  row: UnknownRecord,
): DailyMatchRow {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    match_date: String(row.match_date),
    timezone: String(row.timezone),

    opens_at: String(row.opens_at),
    input_closes_at: String(
      row.input_closes_at,
    ),

    rating_queues_at: String(
      row.rating_queues_at,
    ),

    status: String(
      row.status,
    ) as DailyMatchRow["status"],

    input_item_count: toInteger(
      row.input_item_count,
    ),

    locked_at:
      typeof row.locked_at === "string"
        ? row.locked_at
        : null,

    queued_at:
      typeof row.queued_at === "string"
        ? row.queued_at
        : null,

    processing_started_at:
      typeof row.processing_started_at ===
      "string"
        ? row.processing_started_at
        : null,

    rated_at:
      typeof row.rated_at === "string"
        ? row.rated_at
        : null,

    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function normalizeScoringConfig(
  row: UnknownRecord,
): ScoringConfigRow {
  const config: ScoringConfigRow = {
    id: String(row.id),
    version: String(row.version),
    is_active: row.is_active === true,

    energy_weight: toFiniteNumber(
      row.energy_weight,
    ),

    focus_weight: toFiniteNumber(
      row.focus_weight,
    ),

    discipline_weight: toFiniteNumber(
      row.discipline_weight,
    ),

    universal_weight: toFiniteNumber(
      row.universal_weight,
    ),

    personal_weight: toFiniteNumber(
      row.personal_weight,
    ),

    max_ai_adjustment: toFiniteNumber(
      row.max_ai_adjustment,
    ),

    effective_from: String(
      row.effective_from,
    ),

    created_at: String(row.created_at),
  };

  const dimensionWeightTotal =
    config.energy_weight +
    config.focus_weight +
    config.discipline_weight;

  const blendWeightTotal =
    config.universal_weight +
    config.personal_weight;

  if (
    Math.abs(
      dimensionWeightTotal - 1,
    ) > 0.05 ||
    Math.abs(
      blendWeightTotal - 1,
    ) > 0.05 ||
    config.max_ai_adjustment < 0 ||
    config.max_ai_adjustment > 0.5
  ) {
    // If historical weights added up to 1 with 4 dimensions, normalize them to 3 dimensions
    if (dimensionWeightTotal > 0) {
      config.energy_weight = config.energy_weight / dimensionWeightTotal;
      config.focus_weight = config.focus_weight / dimensionWeightTotal;
      config.discipline_weight = config.discipline_weight / dimensionWeightTotal;
    }
  }

  return config;
}

function normalizeBaseline(
  row: UnknownRecord | null,
): PerformanceBaselineRow | null {
  if (!row) {
    return null;
  }

  return {
    user_id: String(row.user_id),

    calibration_match_count: toInteger(
      row.calibration_match_count,
    ),

    energy_baseline: toFiniteNumber(
      row.energy_baseline,
    ),

    focus_baseline: toFiniteNumber(
      row.focus_baseline,
    ),

    discipline_baseline: toFiniteNumber(
      row.discipline_baseline,
    ),

    calibration_completed_at:
      typeof row.calibration_completed_at ===
      "string"
        ? row.calibration_completed_at
        : null,

    updated_at: String(row.updated_at),
  };
}

function normalizeSleepEntry(
  row: UnknownRecord | null,
): SleepEntryRow | null {
  if (!row) {
    return null;
  }

  return {
    id: String(row.id),
    daily_match_id: String(row.daily_match_id),
    user_id: String(row.user_id),

    sleep_started_at: String(row.sleep_started_at ?? row.created_at ?? ""),
    woke_at: String(row.woke_at ?? row.created_at ?? ""),
    duration_minutes: toInteger(row.duration_minutes ?? (row.sleep_hours ? (row.sleep_hours as number) * 60 : 0)),
    quality: String(row.quality ?? row.perceived_quality ?? "moderate"),
    woke_during_sleep: row.woke_during_sleep === true,

    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function normalizeExistingRating(
  row: UnknownRecord | null,
): ExistingRatingRow | null {
  if (!row) {
    return null;
  }

  return {
    id: String(row.id),
    daily_match_id: String(row.daily_match_id),
    user_id: String(row.user_id),
    scoring_config_id: String(row.scoring_config_id),

    energy_has_data: row.energy_has_data === true,
    focus_has_data: row.focus_has_data === true,
    discipline_has_data: row.discipline_has_data === true,

    logic_energy: toFiniteNumber(row.logic_energy),
    logic_focus: toFiniteNumber(row.logic_focus),
    logic_discipline: toFiniteNumber(row.logic_discipline),

    ai_energy_adjustment: toFiniteNumber(row.ai_energy_adjustment),
    ai_focus_adjustment: toFiniteNumber(row.ai_focus_adjustment),
    ai_discipline_adjustment: toFiniteNumber(row.ai_discipline_adjustment),

    energy_rating: toFiniteNumber(row.energy_rating),
    focus_rating: toFiniteNumber(row.focus_rating),
    discipline_rating: toFiniteNumber(row.discipline_rating),
    overall_rating: toFiniteNumber(row.overall_rating),

    source: String(row.source) as ExistingRatingRow["source"],
    provider_used: typeof row.provider_used === "string" ? row.provider_used : null,
    model_used: typeof row.model_used === "string" ? row.model_used : null,
    input_hash: String(row.input_hash),
    validation_flags: row.validation_flags ?? [],

    created_at: String(row.created_at),
  };
}

function normalizePhysicalRows(
  rows: UnknownRecord[],
): PhysicalActivityRow[] {
  return rows.map((row) => ({
    id: String(row.id),
    daily_match_id: String(row.daily_match_id),
    user_id: String(row.user_id),

    activity_type: String(row.activity_type ?? row.category ?? "other"),
    custom_activity_name:
      typeof row.custom_activity_name === "string"
        ? row.custom_activity_name
        : typeof row.custom_name === "string"
          ? row.custom_name
          : null,
    duration_minutes:
      typeof row.duration_minutes === "number" && Number.isFinite(row.duration_minutes)
        ? row.duration_minutes
        : null,
    intensity: typeof row.intensity === "string" ? row.intensity : null,
    reason: typeof row.reason === "string" ? row.reason : null,

    normalized_signature: String(row.normalized_signature ?? row.signature_hash ?? ""),
    validation_flags: row.validation_flags ?? [],

    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }));
}

function normalizeProductiveRows(
  rows: UnknownRecord[],
): ProductiveActivityRow[] {
  return rows.map((row) => ({
    id: String(row.id),
    daily_match_id: String(row.daily_match_id),
    user_id: String(row.user_id),

    category: String(row.category),
    title: String(row.title),
    description: typeof row.description === "string" ? row.description : null,
    duration_minutes:
      typeof row.duration_minutes === "number" && Number.isFinite(row.duration_minutes)
        ? row.duration_minutes
        : null,

    normalized_signature: String(row.normalized_signature ?? row.signature_hash ?? ""),
    validation_flags: row.validation_flags ?? [],

    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }));
}

function normalizeOtherRows(
  rows: UnknownRecord[],
): OtherActivityRow[] {
  return rows.map((row) => ({
    id: String(row.id),
    daily_match_id: String(row.daily_match_id),
    user_id: String(row.user_id),

    description: String(row.description ?? row.notes ?? row.title ?? ""),
    classified_attribute:
      typeof row.classified_attribute === "string"
        ? row.classified_attribute
        : null,

    normalized_signature: String(row.normalized_signature ?? row.signature_hash ?? ""),
    validation_flags: row.validation_flags ?? [],

    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }));
}

export async function loadCanonicalRatingInput(
  admin: DatabaseClient,
  dailyMatchId: string,
): Promise<CanonicalRatingInput> {
  const matchResult = await admin
    .from("daily_matches")
    .select(DAILY_MATCH_SELECT)
    .eq("id", dailyMatchId)
    .maybeSingle();

  logAndThrowQueryError(
    "Daily Match query failed",
    matchResult.error,
  );

  if (!matchResult.data) {
    throw new HttpError(
      404,
      "DAILY_MATCH_NOT_FOUND",
      "Daily Match was not found.",
    );
  }

  const dailyMatch =
    normalizeDailyMatch(
      matchResult.data as UnknownRecord,
    );

  const configEffectiveAt =
    dailyMatch.rating_queues_at;

  const [
    profileResult,
    configResult,
    baselineResult,
    sleepResult,
    physicalResult,
    productiveResult,
    otherResult,
    existingRatingResult,
  ] = await Promise.all([
    admin
      .from("profiles")
      .select(
        "id, account_status, timezone",
      )
      .eq("id", dailyMatch.user_id)
      .maybeSingle(),

    admin
      .from("scoring_configs")
      .select("*")
      .lte(
        "effective_from",
        configEffectiveAt,
      )
      .order("effective_from", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle(),

    admin
      .from("performance_baselines")
      .select("*")
      .eq("user_id", dailyMatch.user_id)
      .maybeSingle(),

    admin
      .from("sleep_entries")
      .select("*")
      .eq(
        "daily_match_id",
        dailyMatch.id,
      )
      .eq("user_id", dailyMatch.user_id)
      .maybeSingle(),

    admin
      .from("physical_activities")
      .select(`
        id,
        daily_match_id,
        user_id,
        activity_type,
        custom_activity_name,
        intensity,
        reason,
        normalized_signature,
        validation_flags,
        created_at,
        updated_at
      `)
      .eq(
        "daily_match_id",
        dailyMatch.id,
      )
      .eq("user_id", dailyMatch.user_id)
      .order("created_at", {
        ascending: true,
      }),

    admin
      .from("productive_activities")
      .select(`
        id,
        daily_match_id,
        user_id,
        category,
        title,
        description,
        normalized_signature,
        validation_flags,
        created_at,
        updated_at
      `)
      .eq(
        "daily_match_id",
        dailyMatch.id,
      )
      .eq("user_id", dailyMatch.user_id)
      .order("created_at", {
        ascending: true,
      }),

    admin
      .from("other_activities")
      .select(`
        id,
        daily_match_id,
        user_id,
        description,
        normalized_signature,
        classified_attribute,
        validation_flags,
        created_at,
        updated_at
      `)
      .eq(
        "daily_match_id",
        dailyMatch.id,
      )
      .eq("user_id", dailyMatch.user_id)
      .order("created_at", {
        ascending: true,
      }),

    admin
      .from("daily_ratings")
      .select(EXISTING_RATING_SELECT)
      .eq(
        "daily_match_id",
        dailyMatch.id,
      )
      .maybeSingle(),
  ]);

  logAndThrowQueryError(
    "Profile query failed",
    profileResult.error,
  );

  logAndThrowQueryError(
    "Scoring config query failed",
    configResult.error,
  );

  logAndThrowQueryError(
    "Performance baseline query failed",
    baselineResult.error,
  );

  logAndThrowQueryError(
    "Sleep query failed",
    sleepResult.error,
  );

  logAndThrowQueryError(
    "Physical activities query failed",
    physicalResult.error,
  );

  logAndThrowQueryError(
    "Productive activities query failed",
    productiveResult.error,
  );

  logAndThrowQueryError(
    "Other activities query failed",
    otherResult.error,
  );

  logAndThrowQueryError(
    "Existing rating query failed",
    existingRatingResult.error,
  );

  if (!profileResult.data) {
    throw new HttpError(
      404,
      "PROFILE_NOT_FOUND",
      "HuMob profile was not found.",
    );
  }

  if (
    profileResult.data.account_status !==
    "active"
  ) {
    throw new HttpError(
      403,
      "ACCOUNT_NOT_ACTIVE",
      "The account is not active.",
    );
  }

  if (!configResult.data) {
    throw new HttpError(
      500,
      "SCORING_CONFIG_NOT_FOUND",
      "No scoring configuration is effective for this Daily Match.",
    );
  }

  return {
    dailyMatch,

    profile:
      profileResult.data as ProfileRow,

    scoringConfig:
      normalizeScoringConfig(
        configResult.data as UnknownRecord,
      ),

    baseline:
      normalizeBaseline(
        (
          baselineResult.data as
            | UnknownRecord
            | null
        ) ?? null,
      ),

    sleepEntry:
      normalizeSleepEntry(
        (
          sleepResult.data as
            | UnknownRecord
            | null
        ) ?? null,
      ),

    physicalActivities:
      normalizePhysicalRows(
        (
          physicalResult.data ??
          []
        ) as UnknownRecord[],
      ),

    productiveActivities:
      normalizeProductiveRows(
        (
          productiveResult.data ??
          []
        ) as UnknownRecord[],
      ),

    otherActivities:
      normalizeOtherRows(
        (
          otherResult.data ??
          []
        ) as UnknownRecord[],
      ),

    existingRating:
      normalizeExistingRating(
        (
          existingRatingResult.data as
            | UnknownRecord
            | null
        ) ?? null,
      ),
  };
}
