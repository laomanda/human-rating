import type { SupabaseClient, User } from "@supabase/supabase-js";

import {
  DAILY_MATCH_STATUSES,
  OTHER_CATEGORIES,
  PHYSICAL_ACTIVITY_TYPES,
  ACTIVITY_INTENSITIES,
  PRODUCTIVE_CATEGORIES,
  SLEEP_QUALITIES,
} from "@/features/activities/types";

import type {
  ActivityIntensity,
  DailyMatch,
  DailyMatchStatus,
  OtherActivity,
  OtherCategory,
  PhysicalActivity,
  PhysicalActivityType,
  ProductiveActivity,
  ProductiveCategory,
  SleepEntry,
  SleepQuality,
  TodayActivityData,
} from "@/features/activities/types";

import { mapActivityDatabaseError } from "@/features/activities/formatters";

const SLEEP_ENTRY_SELECT = `
  id,
  daily_match_id,
  user_id,
  sleep_started_at,
  woke_at,
  duration_minutes,
  quality,
  woke_during_sleep,
  notes,
  created_at,
  updated_at
`;

const PHYSICAL_ACTIVITY_SELECT = `
  id,
  client_instance_id,
  daily_match_id,
  user_id,
  activity_type,
  custom_activity_name,
  intensity,
  reason,
  normalized_signature,
  source_template_id,
  validation_flags,
  created_at,
  updated_at
`;

const PRODUCTIVE_ACTIVITY_SELECT = `
  id,
  client_instance_id,
  daily_match_id,
  user_id,
  category,
  title,
  description,
  normalized_signature,
  source_template_id,
  validation_flags,
  created_at,
  updated_at
`;

const OTHER_ACTIVITY_SELECT = `
  id,
  client_instance_id,
  daily_match_id,
  user_id,
  category,
  title,
  description,
  duration_minutes,
  normalized_signature,
  source_template_id,
  validation_flags,
  created_at,
  updated_at
`;

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as UnknownRecord;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asInteger(value: unknown, fallback = 0): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.trunc(value) : fallback;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
  }

  return fallback;
}

function isDailyMatchStatus(value: string): value is DailyMatchStatus {
  return DAILY_MATCH_STATUSES.includes(value as DailyMatchStatus);
}

function isPhysicalActivityType(value: string): value is PhysicalActivityType {
  return PHYSICAL_ACTIVITY_TYPES.includes(value as PhysicalActivityType);
}

function isActivityIntensity(value: string): value is ActivityIntensity {
  return ACTIVITY_INTENSITIES.includes(value as ActivityIntensity);
}

function isProductiveCategory(value: string): value is ProductiveCategory {
  return PRODUCTIVE_CATEGORIES.includes(value as ProductiveCategory);
}

function isOtherCategory(value: string): value is OtherCategory {
  return OTHER_CATEGORIES.includes(value as OtherCategory);
}

function isSleepQuality(value: string): value is SleepQuality {
  return SLEEP_QUALITIES.includes(value as SleepQuality);
}

function normalizeDailyMatch(value: unknown): DailyMatch | null {
  const row = asRecord(value);

  if (!row) {
    return null;
  }

  const id = asString(row.id);
  const userId = asString(row.user_id);
  const matchDate = asString(row.match_date);
  const timezone = asString(row.timezone);
  const opensAt = asString(row.opens_at);
  const inputClosesAt = asString(row.input_closes_at);
  const ratingQueuesAt = asString(row.rating_queues_at);
  const status = asString(row.status);
  const createdAt = asString(row.created_at);
  const updatedAt = asString(row.updated_at);

  if (
    !id ||
    !userId ||
    !matchDate ||
    !timezone ||
    !opensAt ||
    !inputClosesAt ||
    !ratingQueuesAt ||
    !status ||
    !isDailyMatchStatus(status) ||
    !createdAt ||
    !updatedAt
  ) {
    return null;
  }

  return {
    id,
    user_id: userId,
    match_date: matchDate,
    timezone,
    opens_at: opensAt,
    input_closes_at: inputClosesAt,
    rating_queues_at: ratingQueuesAt,
    status,
    input_item_count: asInteger(row.input_item_count),
    locked_at: asString(row.locked_at),
    queued_at: asString(row.queued_at),
    processing_started_at: asString(row.processing_started_at),
    rated_at: asString(row.rated_at),
    created_at: createdAt,
    updated_at: updatedAt,
  };
}

function normalizeSleepEntry(value: unknown): SleepEntry | null {
  const row = asRecord(value);
  if (!row) return null;

  const id = asString(row.id);
  const dailyMatchId = asString(row.daily_match_id);
  const userId = asString(row.user_id);
  const quality = asString(row.quality);

  if (!id || !dailyMatchId || !userId || !quality || !isSleepQuality(quality)) {
    return null;
  }

  return {
    id,
    daily_match_id: dailyMatchId,
    user_id: userId,
    sleep_started_at: asString(row.sleep_started_at),
    woke_at: asString(row.woke_at),
    duration_minutes: asInteger(row.duration_minutes, 480),
    quality,
    woke_during_sleep: row.woke_during_sleep === true,
    notes: asString(row.notes),
    created_at: asString(row.created_at) ?? new Date().toISOString(),
    updated_at: asString(row.updated_at) ?? new Date().toISOString(),
  };
}

function normalizePhysicalActivity(value: unknown): PhysicalActivity | null {
  const row = asRecord(value);

  if (!row) {
    return null;
  }

  const id = asString(row.id);
  const clientInstanceId = asString(row.client_instance_id);
  const dailyMatchId = asString(row.daily_match_id);
  const userId = asString(row.user_id);
  const activityType = asString(row.activity_type);
  const intensity = asString(row.intensity);
  const reason = asString(row.reason);
  const signature = asString(row.normalized_signature);
  const createdAt = asString(row.created_at);
  const updatedAt = asString(row.updated_at);

  if (
    !id ||
    !clientInstanceId ||
    !dailyMatchId ||
    !userId ||
    !activityType ||
    !isPhysicalActivityType(activityType) ||
    !intensity ||
    !isActivityIntensity(intensity) ||
    !reason ||
    !signature ||
    !createdAt ||
    !updatedAt
  ) {
    return null;
  }

  return {
    id,
    client_instance_id: clientInstanceId,
    daily_match_id: dailyMatchId,
    user_id: userId,
    activity_type: activityType,
    custom_activity_name: asString(row.custom_activity_name),
    intensity,
    reason,
    normalized_signature: signature,
    source_template_id: asString(row.source_template_id),
    validation_flags: row.validation_flags ?? [],
    created_at: createdAt,
    updated_at: updatedAt,
  };
}

function normalizeProductiveActivity(value: unknown): ProductiveActivity | null {
  const row = asRecord(value);

  if (!row) {
    return null;
  }

  const id = asString(row.id);
  const clientInstanceId = asString(row.client_instance_id);
  const dailyMatchId = asString(row.daily_match_id);
  const userId = asString(row.user_id);
  const category = asString(row.category);
  const title = asString(row.title);
  const description = asString(row.description);
  const signature = asString(row.normalized_signature);
  const createdAt = asString(row.created_at);
  const updatedAt = asString(row.updated_at);

  if (
    !id ||
    !clientInstanceId ||
    !dailyMatchId ||
    !userId ||
    !category ||
    !isProductiveCategory(category) ||
    !title ||
    !description ||
    !signature ||
    !createdAt ||
    !updatedAt
  ) {
    return null;
  }

  return {
    id,
    client_instance_id: clientInstanceId,
    daily_match_id: dailyMatchId,
    user_id: userId,
    category,
    title,
    description,
    normalized_signature: signature,
    source_template_id: asString(row.source_template_id),
    validation_flags: row.validation_flags ?? [],
    created_at: createdAt,
    updated_at: updatedAt,
  };
}

function normalizeOtherActivity(value: unknown): OtherActivity | null {
  const row = asRecord(value);
  if (!row) return null;

  const id = asString(row.id);
  const clientInstanceId = asString(row.client_instance_id);
  const dailyMatchId = asString(row.daily_match_id);
  const userId = asString(row.user_id);
  const category = asString(row.category);
  const title = asString(row.title);
  const description = asString(row.description);
  const signature = asString(row.normalized_signature);
  const createdAt = asString(row.created_at);
  const updatedAt = asString(row.updated_at);

  if (
    !id ||
    !clientInstanceId ||
    !dailyMatchId ||
    !userId ||
    !category ||
    !isOtherCategory(category) ||
    !title ||
    !description ||
    !signature ||
    !createdAt ||
    !updatedAt
  ) {
    return null;
  }

  return {
    id,
    client_instance_id: clientInstanceId,
    daily_match_id: dailyMatchId,
    user_id: userId,
    category,
    title,
    description,
    duration_minutes: row.duration_minutes ? asInteger(row.duration_minutes) : null,
    normalized_signature: signature,
    source_template_id: asString(row.source_template_id),
    validation_flags: row.validation_flags ?? [],
    created_at: createdAt,
    updated_at: updatedAt,
  };
}

function normalizePhysicalActivities(value: unknown): PhysicalActivity[] {
  if (!Array.isArray(value)) return [];
  return value.map(normalizePhysicalActivity).filter((act): act is PhysicalActivity => act !== null);
}

function normalizeProductiveActivities(value: unknown): ProductiveActivity[] {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeProductiveActivity).filter((act): act is ProductiveActivity => act !== null);
}

function normalizeOtherActivities(value: unknown): OtherActivity[] {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeOtherActivity).filter((act): act is OtherActivity => act !== null);
}

async function ensureTodayDailyMatch(
  supabase: SupabaseClient,
): Promise<DailyMatch | null> {
  const { data, error } = await supabase.rpc("ensure_today_daily_match");

  if (error) {
    throw new Error(mapActivityDatabaseError(error));
  }

  if (data === null) {
    return null;
  }

  const rawMatch = Array.isArray(data) ? data[0] ?? null : data;
  const dailyMatch = normalizeDailyMatch(rawMatch);

  if (!dailyMatch) {
    throw new Error("The Daily Match response was incomplete or invalid.");
  }

  return dailyMatch;
}

export async function getTodayActivityData(
  supabase: SupabaseClient,
  user: User,
): Promise<TodayActivityData> {
  const dailyMatch = await ensureTodayDailyMatch(supabase);

  if (!dailyMatch) {
    return {
      dailyMatch: null,
      sleepEntry: null,
      physicalActivities: [],
      productiveActivities: [],
      otherActivities: [],
    };
  }

  if (dailyMatch.user_id !== user.id) {
    throw new Error("The Daily Match does not belong to the signed-in account.");
  }

  const [
    sleepResult,
    physicalResult,
    productiveResult,
    otherResult,
  ] = await Promise.all([
    supabase
      .from("sleep_entries")
      .select(SLEEP_ENTRY_SELECT)
      .eq("user_id", user.id)
      .eq("daily_match_id", dailyMatch.id)
      .maybeSingle(),

    supabase
      .from("physical_activities")
      .select(PHYSICAL_ACTIVITY_SELECT)
      .eq("user_id", user.id)
      .eq("daily_match_id", dailyMatch.id)
      .order("created_at", { ascending: false }),

    supabase
      .from("productive_activities")
      .select(PRODUCTIVE_ACTIVITY_SELECT)
      .eq("user_id", user.id)
      .eq("daily_match_id", dailyMatch.id)
      .order("created_at", { ascending: false }),

    supabase
      .from("other_activities")
      .select(OTHER_ACTIVITY_SELECT)
      .eq("user_id", user.id)
      .eq("daily_match_id", dailyMatch.id)
      .order("created_at", { ascending: false }),
  ]);

  return {
    dailyMatch,
    sleepEntry: sleepResult.data ? normalizeSleepEntry(sleepResult.data) : null,
    physicalActivities: normalizePhysicalActivities(physicalResult.data),
    productiveActivities: normalizeProductiveActivities(productiveResult.data),
    otherActivities: normalizeOtherActivities(otherResult.data),
  };
}
