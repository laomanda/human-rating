import {
  LOGIC_RULESET_VERSION,
} from "./constants.ts";

import type {
  CanonicalRatingInput,
} from "./types.ts";

import {
  stableStringify,
} from "./utils.ts";

function sortableRows<
  T extends {
    id: string;
  },
>(
  rows: T[],
): T[] {
  return [...rows].sort(
    (left, right) =>
      left.id.localeCompare(
        right.id,
      ),
  );
}

export async function createInputHash(
  input: CanonicalRatingInput,
): Promise<string> {
  const payload = {
    rulesetVersion:
      LOGIC_RULESET_VERSION,

    scoringConfig: {
      id:
        input.scoringConfig.id,

      version:
        input.scoringConfig.version,

      energyWeight:
        input.scoringConfig
          .energy_weight,

      focusWeight:
        input.scoringConfig
          .focus_weight,

      disciplineWeight:
        input.scoringConfig
          .discipline_weight,

      responsibilityWeight:
        input.scoringConfig
          .responsibility_weight,

      universalWeight:
        input.scoringConfig
          .universal_weight,

      personalWeight:
        input.scoringConfig
          .personal_weight,

      maxAiAdjustment:
        input.scoringConfig
          .max_ai_adjustment,

      effectiveFrom:
        input.scoringConfig
          .effective_from,
    },

    baseline: input.baseline
      ? {
          calibrationMatchCount:
            input.baseline
              .calibration_match_count,

          energy:
            input.baseline
              .energy_baseline,

          focus:
            input.baseline
              .focus_baseline,

          discipline:
            input.baseline
              .discipline_baseline,

          responsibility:
            input.baseline
              .responsibility_baseline,

          completedAt:
            input.baseline
              .calibration_completed_at,

          updatedAt:
            input.baseline
              .updated_at,
        }
      : null,

    dailyMatch: {
      id:
        input.dailyMatch.id,

      userId:
        input.dailyMatch.user_id,

      matchDate:
        input.dailyMatch.match_date,

      timezone:
        input.dailyMatch.timezone,

      inputItemCount:
        input.dailyMatch
          .input_item_count,

      inputClosesAt:
        input.dailyMatch
          .input_closes_at,

      ratingQueuesAt:
        input.dailyMatch
          .rating_queues_at,
    },

    sleepEntry: input.sleepEntry
      ? {
          id:
            input.sleepEntry.id,

          sleepStartedAt:
            input.sleepEntry
              .sleep_started_at,

          wokeAt:
            input.sleepEntry.woke_at,

          durationMinutes:
            input.sleepEntry
              .duration_minutes,

          quality:
            input.sleepEntry.quality,

          wokeDuringSleep:
            input.sleepEntry
              .woke_during_sleep,

          updatedAt:
            input.sleepEntry.updated_at,
        }
      : null,

    physicalActivities:
      sortableRows(
        input.physicalActivities,
      ).map((activity) => ({
        id: activity.id,

        activityType:
          activity.activity_type,

        customActivityName:
          activity
            .custom_activity_name,

        intensity:
          activity.intensity,

        reason:
          activity.reason,

        normalizedSignature:
          activity
            .normalized_signature,

        updatedAt:
          activity.updated_at,
      })),

    productiveActivities:
      sortableRows(
        input.productiveActivities,
      ).map((activity) => ({
        id: activity.id,

        category:
          activity.category,

        title:
          activity.title,

        description:
          activity.description,

        normalizedSignature:
          activity
            .normalized_signature,

        updatedAt:
          activity.updated_at,
      })),

    responsibilities:
      sortableRows(
        input.responsibilities,
      ).map(
        (responsibility) => ({
          id:
            responsibility.id,

          category:
            responsibility.category,

          description:
            responsibility.description,

          executionStatus:
            responsibility
              .execution_status,

          importance:
            responsibility.importance,

          normalizedSignature:
            responsibility
              .normalized_signature,

          updatedAt:
            responsibility.updated_at,
        }),
      ),

    otherActivities:
      sortableRows(
        input.otherActivities,
      ).map((activity) => ({
        id:
          activity.id,

        description:
          activity.description,

        normalizedSignature:
          activity
            .normalized_signature,

        classifiedAttribute:
          activity
            .classified_attribute,

        updatedAt:
          activity.updated_at,
      })),
  };

  const bytes =
    new TextEncoder().encode(
      stableStringify(payload),
    );

  const digest =
    await crypto.subtle.digest(
      "SHA-256",
      bytes,
    );

  return Array.from(
    new Uint8Array(digest),
  )
    .map((byte) =>
      byte
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");
}