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
      status: "open",
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
      energy_weight: 1,
      focus_weight: 1,
      discipline_weight: 1,
      responsibility_weight: 1,
      universal_weight: 0.7,
      personal_weight: 0.3,
      max_ai_adjustment: 2,
      effective_from: "2026-08-04T00:00:00Z",
      created_at: "2026-08-04T00:00:00Z",
    },
    baseline: null,
    sleepEntry: null,
    physicalActivities: [],
    productiveActivities: [],
    responsibilities: [],
    otherActivities: [],
    existingRating: null,
    ...overrides,
  };
}

Deno.test("Scenario A: productive evidence should stay conservative for simple tasks", () => {
  const input = createInput({
    productiveActivities: [
      {
        id: "prod-1",
        daily_match_id: "match-1",
        user_id: "user-1",
        category: "productive",
        title: "Coding",
        description: "membuat website",
        normalized_signature: "coding membuat website",
        validation_flags: null,
        created_at: "2026-08-04T00:00:00Z",
        updated_at: "2026-08-04T00:00:00Z",
      },
    ],
  });

  const result = calculateLogicScores(input);

  assertEquals(result.hasData.responsibility, true);
  assertEquals(result.validationFlags.includes("productive_activity_used_as_responsibility_evidence"), true);
  assertEquals(result.universal.responsibility < 3.5, true);
});

Deno.test("Scenario B: strong responsibility evidence should activate responsibility", () => {
  const input = createInput({
    productiveActivities: [
      {
        id: "prod-2",
        daily_match_id: "match-1",
        user_id: "user-1",
        category: "productive",
        title: "Project Website Kampus",
        description: "menyelesaikan modul login sebelum deadline",
        normalized_signature: "project website kampus menyelesaikan modul login sebelum deadline",
        validation_flags: null,
        created_at: "2026-08-04T00:00:00Z",
        updated_at: "2026-08-04T00:00:00Z",
      },
    ],
  });

  const result = calculateLogicScores(input);

  assertEquals(result.hasData.responsibility, true);
  assertEquals(result.validationFlags.includes("productive_activity_used_as_responsibility_evidence"), true);
  assertEquals(result.universal.responsibility > 0, true);
});

Deno.test("Scenario C: generic learning activity should not trigger responsibility", () => {
  const input = createInput({
    productiveActivities: [
      {
        id: "prod-3",
        daily_match_id: "match-1",
        user_id: "user-1",
        category: "productive",
        title: "Belajar santai",
        description: "menonton tutorial",
        normalized_signature: "belajar santai menonton tutorial",
        validation_flags: null,
        created_at: "2026-08-04T00:00:00Z",
        updated_at: "2026-08-04T00:00:00Z",
      },
    ],
  });

  const result = calculateLogicScores(input);

  assertEquals(result.hasData.responsibility, false);
  assertEquals(result.validationFlags.includes("productive_activity_used_as_responsibility_evidence"), false);
  assertEquals(result.universal.responsibility, 0);
});
