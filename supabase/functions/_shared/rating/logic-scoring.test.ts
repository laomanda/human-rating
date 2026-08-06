import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

import { calculateLogicScores } from "./logic-scoring.ts";
import type { CanonicalRatingInput } from "./types.ts";

function createInput(overrides: Partial<CanonicalRatingInput> = {}): CanonicalRatingInput {
  return {
    dailyMatch: {
      id: "match-1",
      user_id: "user-1",
      match_date: "2026-08-04",
      timezone: "UTC",
      opens_at: "2026-08-04T00:00:00Z",
      input_closes_at: "2026-08-04T23:59:59Z",
      rating_queues_at: "2026-08-04T23:59:59Z",
      status: "editable",
      input_item_count: 1,
      locked_at: null,
      queued_at: null,
      processing_started_at: null,
      rated_at: null,
      created_at: "2026-08-04T00:00:00Z",
      updated_at: "2026-08-04T00:00:00Z",
    },
    profile: {
      id: "profile-1",
      account_status: "active",
      timezone: "UTC",
    },
    scoringConfig: {
      id: "config-1",
      version: "test",
      is_active: true,
      energy_weight: 0.35,
      focus_weight: 0.35,
      discipline_weight: 0.30,
      universal_weight: 0.7,
      personal_weight: 0.3,
      max_ai_adjustment: 0.2,
      effective_from: "2026-08-04T00:00:00Z",
      created_at: "2026-08-04T00:00:00Z",
    },
    baseline: null,
    sleepEntry: null,
    physicalActivities: [],
    productiveActivities: [],
    otherActivities: [],
    existingRating: null,
    ...overrides,
  };
}

Deno.test("Scenario A: productive activity calculates focus score", () => {
  const input = createInput({
    productiveActivities: [
      {
        id: "prod-1",
        daily_match_id: "match-1",
        user_id: "user-1",
        category: "deep_work",
        title: "Coding Website",
        description: "membuat modul autentikasi",
        duration_minutes: 120,
        normalized_signature: "coding membuat modul",
        validation_flags: [],
        created_at: "2026-08-04T00:00:00Z",
        updated_at: "2026-08-04T00:00:00Z",
      },
    ],
  });

  const result = calculateLogicScores(input);

  assertEquals(result.hasData.focus, true);
  assertEquals(result.universal.focus > 0, true);
});
