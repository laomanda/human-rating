import {
  calculateLogicScores,
} from "../logic-scoring.ts";

import type {
  CanonicalRatingInput,
  DimensionMap,
  OtherActivityRow,
  PhysicalActivityRow,
  ProductiveActivityRow,
  ResponsibilityRow,
  SleepEntryRow,
} from "../types.ts";

function assert(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const NOW =
  "2026-07-28T00:00:00.000Z";

const USER_ID =
  "22222222-2222-4222-8222-222222222222";

let sequence = 0;

function nextId(prefix: string): string {
  sequence += 1;

  return `${prefix}-${sequence}`;
}

function round1(value: number): number {
  return (
    Math.round(
      (value + Number.EPSILON) * 10,
    ) / 10
  );
}

function calculateOverall(
  input: CanonicalRatingInput,
  ratings: DimensionMap,
): number {
  const config =
    input.scoringConfig;

  return round1(
    Math.min(
      10,

      Math.max(
        0,
        ratings.energy *
          config.energy_weight +
          ratings.focus *
            config.focus_weight +
          ratings.discipline *
            config.discipline_weight +
          ratings.responsibility *
            config
              .responsibility_weight,
      ),
    ),
  );
}

function withInputCount(
  input: CanonicalRatingInput,
): CanonicalRatingInput {
  return {
    ...input,

    dailyMatch: {
      ...input.dailyMatch,

      input_item_count:
        (input.sleepEntry ? 1 : 0) +
        input.physicalActivities.length +
        input.productiveActivities.length +
        input.responsibilities.length +
        input.otherActivities.length,
    },
  };
}

function baseInput(
  overrides:
    Partial<CanonicalRatingInput> = {},
): CanonicalRatingInput {
  return withInputCount({
    dailyMatch: {
      id:
        "11111111-1111-4111-8111-111111111111",

      user_id: USER_ID,
      match_date: "2026-07-28",
      timezone: "Asia/Bangkok",
      opens_at: NOW,
      input_closes_at: NOW,
      rating_queues_at: NOW,
      status: "queued",
      input_item_count: 0,
      locked_at: null,
      queued_at: null,
      processing_started_at: null,
      rated_at: null,
      created_at: NOW,
      updated_at: NOW,
    },

    profile: {
      id: USER_ID,
      account_status: "active",
      timezone: "Asia/Bangkok",
    },

    scoringConfig: {
      id:
        "33333333-3333-4333-8333-333333333333",

      version:
        "simulation-equal-weights",

      is_active: true,
      energy_weight: 0.25,
      focus_weight: 0.25,
      discipline_weight: 0.25,
      responsibility_weight: 0.25,
      universal_weight: 1,
      personal_weight: 0,
      max_ai_adjustment: 0.5,
      effective_from: NOW,
      created_at: NOW,
    },

    baseline: null,
    sleepEntry: null,
    physicalActivities: [],
    productiveActivities: [],
    responsibilities: [],
    otherActivities: [],
    existingRating: null,

    ...overrides,
  });
}

function sleepEntry(
  durationMinutes: number,
  quality:
    | "poor"
    | "fair"
    | "good"
    | "very_good" = "good",
): SleepEntryRow {
  return {
    id: nextId("sleep"),
    daily_match_id: "daily-match",
    user_id: USER_ID,
    sleep_started_at: NOW,
    woke_at: NOW,
    duration_minutes: durationMinutes,
    quality,
    woke_during_sleep: false,
    validation_flags: [],
    created_at: NOW,
    updated_at: NOW,
  };
}

function physicalActivity(
  activityType: string,
  intensity:
    | "light"
    | "moderate"
    | "heavy",
  reason: string,
): PhysicalActivityRow {
  return {
    id: nextId("physical"),
    daily_match_id: "daily-match",
    user_id: USER_ID,
    activity_type: activityType,
    custom_activity_name: null,
    intensity,
    reason,
    normalized_signature:
      `${activityType}|${intensity}|${reason}`.toLowerCase(),
    validation_flags: [],
    created_at: NOW,
    updated_at: NOW,
  };
}

function productiveActivity(
  title: string,
  description = title,
  signature = `${title}|${description}`,
): ProductiveActivityRow {
  return {
    id: nextId("productive"),
    daily_match_id: "daily-match",
    user_id: USER_ID,
    category: "work",
    title,
    description,
    normalized_signature:
      signature.toLowerCase(),
    validation_flags: [],
    created_at: NOW,
    updated_at: NOW,
  };
}

function responsibility(
  description: string,
): ResponsibilityRow {
  return {
    id: nextId("responsibility"),
    daily_match_id: "daily-match",
    user_id: USER_ID,
    category: "daily",
    description,
    execution_status: "completed",
    importance: "normal",
    normalized_signature:
      description.toLowerCase(),
    validation_flags: [],
    created_at: NOW,
    updated_at: NOW,
  };
}

function otherActivity(
  description: string,
  attribute:
    | "energy"
    | "focus"
    | "discipline"
    | "responsibility" = "focus",
  signature = `${attribute}|${description}`,
): OtherActivityRow {
  return {
    id: nextId("other"),
    daily_match_id: "daily-match",
    user_id: USER_ID,
    description,
    normalized_signature:
      signature.toLowerCase(),
    classified_attribute: attribute,
    validation_flags: [],
    created_at: NOW,
    updated_at: NOW,
  };
}

function simulate(
  input: CanonicalRatingInput,
): {
  overall: number;
  logic: ReturnType<
    typeof calculateLogicScores
  >;
} {
  const logic =
    calculateLogicScores(input);

  return {
    overall: calculateOverall(
      input,
      logic.logic,
    ),

    logic,
  };
}

Deno.test(
  "bad day remains low",
  () => {
    const result = simulate(
      baseInput({
        sleepEntry: sleepEntry(
          180,
          "poor",
        ),

        otherActivities: [
          otherActivity(
            "Scroll media sosial selama 5 jam",
          ),
        ],
      }),
    );

    assert(
      result.overall <= 4,
      `Bad day overall must be <= 4, received ${result.overall}.`,
    );
  },
);

Deno.test(
  "normal day stays in medium range",
  () => {
    const result = simulate(
      baseInput({
        sleepEntry: sleepEntry(420),

        physicalActivities: [
          physicalActivity(
            "walk",
            "light",
            "Jalan kaki 30 menit untuk menjaga stamina",
          ),
        ],

        productiveActivities: [
          productiveActivity(
            "Mengerjakan tugas kuliah",
          ),
        ],

        responsibilities: [
          responsibility(
            "Menyelesaikan kewajiban harian",
          ),
        ],
      }),
    );

    assert(
      result.overall >= 5 &&
        result.overall <= 8,
      `Normal day must be 5-8, received ${result.overall}.`,
    );
  },
);

Deno.test(
  "high performance day is high but not perfect",
  () => {
    const result = simulate(
      baseInput({
        sleepEntry: sleepEntry(
          480,
          "very_good",
        ),

        physicalActivities: [
          physicalActivity(
            "gym",
            "heavy",
            "Gym 45 menit untuk latihan kekuatan",
          ),
        ],

        productiveActivities: [
          productiveActivity(
            "Menyelesaikan project",
            "Menyelesaikan project dan mengirim hasil final kepada tim",
          ),
        ],

        responsibilities: [
          responsibility(
            "Meeting dan follow up pekerjaan",
          ),
        ],
      }),
    );

    assert(
      result.overall >= 8 &&
        result.overall <= 9.5,
      `High performance must be 8-9.5, received ${result.overall}.`,
    );
  },
);

Deno.test(
  "self-claim cheat does not create evidence",
  () => {
    const result = simulate(
      baseInput({
        otherActivities: [
          otherActivity(
            "Saya disiplin",
            "discipline",
          ),
          otherActivity(
            "Saya produktif",
          ),
          otherActivity(
            "Saya sukses",
            "responsibility",
          ),
        ],
      }),
    );

    assert(
      result.logic.metrics
        .acceptedEvidenceCount === 0,
      "Self claims must not become accepted evidence.",
    );

    assert(
      result.overall <= 1,
      `Cheat overall must be <= 1, received ${result.overall}.`,
    );
  },
);

Deno.test(
  "one strong evidence beats spam activity",
  () => {
    const spam = simulate(
      baseInput({
        productiveActivities:
          Array.from(
            {
              length: 10,
            },
            (_, index) =>
              productiveActivity(
                "Saya bekerja",
                "Saya bekerja",
                `spam-${index}`,
              ),
          ),
      }),
    );

    const strong = simulate(
      baseInput({
        productiveActivities: [
          productiveActivity(
            "Menyelesaikan laporan proyek",
            "Menyelesaikan laporan proyek dan mengirim hasil final",
          ),
        ],
      }),
    );

    assert(
      strong.overall >
        spam.overall,
      `Strong evidence ${strong.overall} must beat spam ${spam.overall}.`,
    );
  },
);
