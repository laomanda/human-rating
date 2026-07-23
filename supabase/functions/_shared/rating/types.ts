import type {
  SupabaseClient,
} from "@supabase/supabase-js";

export type DatabaseClient = SupabaseClient;

/* ============================================================
 * DATABASE ENUMS
 * ============================================================
 */

export type DailyMatchStatus =
  | "open"
  | "locked"
  | "queued"
  | "processing"
  | "rated"
  | "failed";

export type RatingSource =
  | "ai_primary"
  | "ai_fallback"
  | "logic_fallback"
  | "no_activity";

export type SleepQuality =
  | "poor"
  | "fair"
  | "good"
  | "very_good";

export type ActivityIntensity =
  | "light"
  | "moderate"
  | "heavy";

export type ExecutionStatus =
  | "completed"
  | "partially_completed"
  | "not_completed";

export type ImportanceLevel =
  | "low"
  | "normal"
  | "important"
  | "very_important";

export type PerformanceAttribute =
  | "energy"
  | "focus"
  | "discipline"
  | "responsibility";

/* ============================================================
 * DATABASE ROWS
 * ============================================================
 */

export type DailyMatchRow = {
  id: string;
  user_id: string;
  match_date: string;
  timezone: string;

  opens_at: string;
  input_closes_at: string;
  rating_queues_at: string;

  status: DailyMatchStatus;
  input_item_count: number;

  locked_at: string | null;
  queued_at: string | null;
  processing_started_at: string | null;
  rated_at: string | null;

  created_at: string;
  updated_at: string;
};

export type ProfileRow = {
  id: string;
  account_status: string;
  timezone: string;
};

export type ScoringConfigRow = {
  id: string;
  version: string;
  is_active: boolean;

  energy_weight: number;
  focus_weight: number;
  discipline_weight: number;
  responsibility_weight: number;

  universal_weight: number;
  personal_weight: number;
  max_ai_adjustment: number;

  effective_from: string;
  created_at: string;
};

export type PerformanceBaselineRow = {
  user_id: string;

  calibration_match_count: number;

  energy_baseline: number;
  focus_baseline: number;
  discipline_baseline: number;
  responsibility_baseline: number;

  calibration_completed_at: string | null;
  updated_at: string;
};

export type SleepEntryRow = {
  id: string;
  daily_match_id: string;
  user_id: string;

  sleep_started_at: string;
  woke_at: string;
  duration_minutes: number;
  quality: SleepQuality;
  woke_during_sleep: boolean;

  validation_flags: unknown;

  created_at: string;
  updated_at: string;
};

export type PhysicalActivityRow = {
  id: string;
  daily_match_id: string;
  user_id: string;

  activity_type: string;
  custom_activity_name: string | null;
  intensity: ActivityIntensity;
  reason: string;

  normalized_signature: string;
  validation_flags: unknown;

  created_at: string;
  updated_at: string;
};

export type ProductiveActivityRow = {
  id: string;
  daily_match_id: string;
  user_id: string;

  category: string;
  title: string;
  description: string;

  normalized_signature: string;
  validation_flags: unknown;

  created_at: string;
  updated_at: string;
};

export type ResponsibilityRow = {
  id: string;
  daily_match_id: string;
  user_id: string;

  category: string;
  description: string;
  execution_status: ExecutionStatus;
  importance: ImportanceLevel;

  normalized_signature: string;
  validation_flags: unknown;

  created_at: string;
  updated_at: string;
};

export type OtherActivityRow = {
  id: string;
  daily_match_id: string;
  user_id: string;

  description: string;
  normalized_signature: string;

  classified_attribute:
    | PerformanceAttribute
    | null;

  validation_flags: unknown;

  created_at: string;
  updated_at: string;
};

export type ExistingRatingRow = {
  id: string;
  daily_match_id: string;
  user_id: string;
  scoring_config_id: string;

  energy_has_data: boolean;
  focus_has_data: boolean;
  discipline_has_data: boolean;
  responsibility_has_data: boolean;

  logic_energy: number;
  logic_focus: number;
  logic_discipline: number;
  logic_responsibility: number;

  ai_energy_adjustment: number;
  ai_focus_adjustment: number;
  ai_discipline_adjustment: number;
  ai_responsibility_adjustment: number;

  energy_rating: number;
  focus_rating: number;
  discipline_rating: number;
  responsibility_rating: number;
  overall_rating: number;

  source: RatingSource;

  provider_used: string | null;
  model_used: string | null;

  input_hash: string;
  validation_flags: unknown;

  created_at: string;
};

/* ============================================================
 * CANONICAL INPUT
 * ============================================================
 */

export type CanonicalRatingInput = {
  dailyMatch: DailyMatchRow;
  profile: ProfileRow;
  scoringConfig: ScoringConfigRow;
  baseline: PerformanceBaselineRow | null;

  sleepEntry: SleepEntryRow | null;

  physicalActivities: PhysicalActivityRow[];
  productiveActivities: ProductiveActivityRow[];
  responsibilities: ResponsibilityRow[];
  otherActivities: OtherActivityRow[];

  existingRating: ExistingRatingRow | null;
};

/* ============================================================
 * RATING TYPES
 * ============================================================
 */

export type DimensionMap = {
  energy: number;
  focus: number;
  discipline: number;
  responsibility: number;
};

export type DimensionAvailability = {
  energy: boolean;
  focus: boolean;
  discipline: boolean;
  responsibility: boolean;
};

export type LogicScoreMetrics = {
  rawInputCount: number;
  uniqueEvidenceCount: number;

  energyEvidenceCount: number;
  focusEvidenceCount: number;
  disciplineEvidenceCount: number;
  responsibilityEvidenceCount: number;

  responsibilityCompletionRatio:
    | number
    | null;

  databaseInputCount: number;
};

export type LogicScoreResult = {
  hasData: DimensionAvailability;

  universal: DimensionMap;

  baselineApplied: boolean;
  baseline: DimensionMap | null;

  logic: DimensionMap;

  metrics: LogicScoreMetrics;
  validationFlags: string[];
};

/* ============================================================
 * AI TYPES
 * ============================================================
 */

export type AiSuggestedRatings =
  DimensionMap & {
    overall: number;
  };

export type AiProviderResult = {
  source:
    | "ai_primary"
    | "ai_fallback";

  provider: string;
  model: string;

  suggestedRatings: AiSuggestedRatings;
  validationFlags: string[];
};

export type AiProviderRunResult = {
  result: AiProviderResult | null;
  validationFlags: string[];
};

/* ============================================================
 * FINAL RATING
 * ============================================================
 */

export type FinalRatingResult = {
  source: RatingSource;

  provider: string | null;
  model: string | null;

  adjustments: DimensionMap;
  ratings: DimensionMap;

  overall: number;
  validationFlags: string[];
};

/* ============================================================
 * REQUEST AUTH
 * ============================================================
 */

export type RequestAuth =
  | {
      kind: "user";
      userId: string;
    }
  | {
      kind: "job";
    };

export type RatingAction =
  | "preview"
  | "finalize";

export type RatingRequestBody = {
  dailyMatchId: string;
  action: RatingAction;
  useAi: boolean;
};