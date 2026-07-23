export const PHYSICAL_ACTIVITY_TYPES = [
  "walking",
  "running",
  "gym",
  "cycling",
  "swimming",
  "team_sport",
  "physical_work",
  "stretching",
  "other",
] as const;

export const ACTIVITY_INTENSITIES = [
  "light",
  "moderate",
  "heavy",
] as const;

export const PRODUCTIVE_CATEGORIES = [
  "work",
  "study",
  "assignment",
  "skill_development",
  "business",
  "creative_work",
  "household",
  "other",
] as const;

export const DAILY_MATCH_STATUSES = [
  "open",
  "locked",
  "queued",
  "processing",
  "rated",
  "failed",
] as const;

export type PhysicalActivityType =
  (typeof PHYSICAL_ACTIVITY_TYPES)[number];

export type ActivityIntensity =
  (typeof ACTIVITY_INTENSITIES)[number];

export type ProductiveCategory =
  (typeof PRODUCTIVE_CATEGORIES)[number];

export type DailyMatchStatus =
  (typeof DAILY_MATCH_STATUSES)[number];

export type DailyMatch = {
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

export type PhysicalActivity = {
  id: string;
  client_instance_id: string;
  daily_match_id: string;
  user_id: string;
  activity_type: PhysicalActivityType;
  custom_activity_name: string | null;
  intensity: ActivityIntensity;
  reason: string;
  normalized_signature: string;
  source_template_id: string | null;
  validation_flags: unknown;
  created_at: string;
  updated_at: string;
};

export type ProductiveActivity = {
  id: string;
  client_instance_id: string;
  daily_match_id: string;
  user_id: string;
  category: ProductiveCategory;
  title: string;
  description: string;
  normalized_signature: string;
  source_template_id: string | null;
  validation_flags: unknown;
  created_at: string;
  updated_at: string;
};

export type TodayActivityData = {
  dailyMatch: DailyMatch | null;
  physicalActivities: PhysicalActivity[];
  productiveActivities: ProductiveActivity[];
};

export type ActivityFieldErrors = Record<string, string[]>;

export type ActivityActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors: ActivityFieldErrors;
  completedAt: number;
};

export const INITIAL_ACTIVITY_ACTION_STATE: ActivityActionState = {
  status: "idle",
  message: "",
  fieldErrors: {},
  completedAt: 0,
};