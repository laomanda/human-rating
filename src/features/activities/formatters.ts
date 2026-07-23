import type {
  ActivityIntensity,
  DailyMatch,
  DailyMatchStatus,
  PhysicalActivityType,
  ProductiveCategory,
} from "@/features/activities/types";

const PHYSICAL_ACTIVITY_LABELS: Record<
  PhysicalActivityType,
  string
> = {
  walking: "Walking",
  running: "Running",
  gym: "Gym",
  cycling: "Cycling",
  swimming: "Swimming",
  team_sport: "Team Sport",
  physical_work: "Physical Work",
  stretching: "Stretching",
  other: "Other Activity",
};

const INTENSITY_LABELS: Record<
  ActivityIntensity,
  string
> = {
  light: "Light",
  moderate: "Moderate",
  heavy: "Heavy",
};

const PRODUCTIVE_CATEGORY_LABELS: Record<
  ProductiveCategory,
  string
> = {
  work: "Work",
  study: "Study",
  assignment: "Assignment",
  skill_development: "Skill Development",
  business: "Business",
  creative_work: "Creative Work",
  household: "Household",
  other: "Other",
};

const DAILY_MATCH_STATUS_LABELS: Record<
  DailyMatchStatus,
  string
> = {
  open: "Open",
  locked: "Locked",
  queued: "Queued",
  processing: "Processing",
  rated: "Rated",
  failed: "Failed",
};

type SupabaseErrorLike = {
  message: string;
  code?: string | null;
  details?: string | null;
  hint?: string | null;
};

export function formatPhysicalActivityType(
  value: PhysicalActivityType,
): string {
  return PHYSICAL_ACTIVITY_LABELS[value];
}

export function formatActivityIntensity(
  value: ActivityIntensity,
): string {
  return INTENSITY_LABELS[value];
}

export function formatProductiveCategory(
  value: ProductiveCategory,
): string {
  return PRODUCTIVE_CATEGORY_LABELS[value];
}

export function formatDailyMatchStatus(
  value: DailyMatchStatus,
): string {
  return DAILY_MATCH_STATUS_LABELS[value];
}

export function isDailyMatchEditable(
  dailyMatch: DailyMatch,
  now = new Date(),
): boolean {
  if (dailyMatch.status !== "open") {
    return false;
  }

  const closesAt = new Date(
    dailyMatch.input_closes_at,
  );

  if (Number.isNaN(closesAt.getTime())) {
    return false;
  }

  return now.getTime() < closesAt.getTime();
}

export function mapActivityDatabaseError(
  error: SupabaseErrorLike,
): string {
  const combinedMessage = [
    error.code,
    error.message,
    error.details,
    error.hint,
  ]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();

  if (combinedMessage.includes("AUTH_REQUIRED")) {
    return "Your session has expired. Please sign in again.";
  }

  if (
    combinedMessage.includes("PROFILE_NOT_FOUND")
  ) {
    return "Your HuMob profile could not be found.";
  }

  if (
    combinedMessage.includes("ACCOUNT_NOT_ACTIVE")
  ) {
    return "This account is not currently active.";
  }

  if (
    combinedMessage.includes(
      "DAILY_MATCH_NOT_FOUND",
    )
  ) {
    return "The selected Daily Match could not be found.";
  }

  if (
    combinedMessage.includes(
      "DAILY_MATCH_OWNER_MISMATCH",
    )
  ) {
    return "This Daily Match does not belong to your account.";
  }

  if (
    combinedMessage.includes(
      "DAILY_MATCH_RELATION_IMMUTABLE",
    )
  ) {
    return "The activity cannot be moved to another Daily Match.";
  }

  if (
    combinedMessage.includes("DAILY_MATCH_LOCKED")
  ) {
    return "Today's activity input has been locked.";
  }

  if (
    combinedMessage.includes(
      "PHYSICAL_ACTIVITIES_REASON_CHECK",
    )
  ) {
    return "Physical activity reason must contain between 5 and 500 characters.";
  }

  if (
    combinedMessage.includes(
      "PHYSICAL_ACTIVITIES_CHECK",
    )
  ) {
    return "Custom physical activity information is invalid.";
  }

  if (
    combinedMessage.includes(
      "PRODUCTIVE_ACTIVITIES_TITLE_CHECK",
    )
  ) {
    return "Productive activity title must contain between 3 and 120 characters.";
  }

  if (
    combinedMessage.includes(
      "PRODUCTIVE_ACTIVITIES_DESCRIPTION_CHECK",
    )
  ) {
    return "Productive activity description must contain between 5 and 500 characters.";
  }

  if (
    combinedMessage.includes("23505") ||
    combinedMessage.includes(
      "DUPLICATE KEY VALUE",
    )
  ) {
    return "This request has already been saved.";
  }

  if (
    combinedMessage.includes("42501") ||
    combinedMessage.includes(
      "ROW-LEVEL SECURITY",
    ) ||
    combinedMessage.includes(
      "PERMISSION DENIED",
    )
  ) {
    return "You do not have permission to modify this activity.";
  }

  return "The activity operation could not be completed. Please try again.";
}