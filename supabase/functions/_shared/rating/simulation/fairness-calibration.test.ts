import {
  calculateLogicScores,
} from "../logic-scoring.ts";

import type {
  CanonicalRatingInput,
  DailyMatchRow,
  ExistingRatingRow,
  OtherActivityRow,
  PhysicalActivityRow,
  ProductiveActivityRow,
  ProfileRow,
  ResponsibilityRow,
  ScoringConfigRow,
  SleepEntryRow,
} from "../types.ts";

function assert(
  condition: boolean,
  message: string,
) {
  if (!condition) {
    throw new Error(message);
  }
}

function printResult(
  name: string,
  result: any,
) {
  console.log("\n=================");
  console.log(name);
  console.log("=================");

  console.log(
    JSON.stringify(
      result,
      null,
      2,
    ),
  );
}

function calculateOverall(
  score: ReturnType<typeof calculateLogicScores>,
) {
  return (
    score.logic.energy +
    score.logic.focus +
    score.logic.discipline +
    score.logic.responsibility
  ) / 4;
}

function createBaseInput(
  overrides: Partial<CanonicalRatingInput> = {},
): CanonicalRatingInput {
  const baseDailyMatch: DailyMatchRow = {
    id: "daily-match-1",
    user_id: "user-1",
    match_date: "2026-07-28",
    timezone: "UTC",
    opens_at: "2026-07-28T00:00:00Z",
    input_closes_at: "2026-07-28T23:59:59Z",
    rating_queues_at: "2026-07-28T23:59:59Z",
    status: "open",
    input_item_count: 0,
    locked_at: null,
    queued_at: null,
    processing_started_at: null,
    rated_at: null,
    created_at: "2026-07-28T00:00:00Z",
    updated_at: "2026-07-28T00:00:00Z",
  };

  const baseProfile: ProfileRow = {
    id: "user-1",
    account_status: "active",
    timezone: "UTC",
  };

  const baseScoringConfig: ScoringConfigRow = {
    id: "config-1",
    version: "1",
    is_active: true,
    energy_weight: 0.25,
    focus_weight: 0.25,
    discipline_weight: 0.25,
    responsibility_weight: 0.25,
    universal_weight: 0.7,
    personal_weight: 0.3,
    max_ai_adjustment: 1,
    effective_from: "2026-01-01T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
  };

  return {
    dailyMatch: baseDailyMatch,
    profile: baseProfile,
    scoringConfig: baseScoringConfig,
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

Deno.test(
  "HuMob fairness calibration scenarios",
  async () => {

    /*
    TEST 1
    Bad day
    */

    const badDay = createBaseInput({
      dailyMatch: {
        ...createBaseInput().dailyMatch,
        input_item_count: 0,
      },
    });

    const badScore =
      calculateLogicScores(
        badDay,
      );

    printResult(
      "BAD DAY",
      badScore,
    );

    /*
    TEST 2
    Normal productive day
    */

    const normalDay = createBaseInput({
      dailyMatch: {
        ...createBaseInput().dailyMatch,
        input_item_count: 2,
      },
      sleepEntry: {
        id: "sleep-1",
        daily_match_id: "daily-match-1",
        user_id: "user-1",
        sleep_started_at: "2026-07-27T23:00:00Z",
        woke_at: "2026-07-28T07:30:00Z",
        duration_minutes: 510,
        quality: "good",
        woke_during_sleep: false,
        validation_flags: {},
        created_at: "2026-07-28T07:30:00Z",
        updated_at: "2026-07-28T07:30:00Z",
      } as SleepEntryRow,
      productiveActivities: [
        {
          id: "productive-1",
          daily_match_id: "daily-match-1",
          user_id: "user-1",
          category: "work",
          title: "Menulis laporan akhir",
          description:
            "Menyelesaikan laporan akhir akhir untuk klien dan mengirim hasil final sebelum tenggat.",
          normalized_signature: "productive-1",
          validation_flags: {},
          created_at: "2026-07-28T08:00:00Z",
          updated_at: "2026-07-28T08:00:00Z",
        },
      ],
    });

    const normalScore =
      calculateLogicScores(
        normalDay,
      );

    printResult(
      "NORMAL DAY",
      normalScore,
    );

    /*
    TEST 3
    High performance
    */

    const highDay = createBaseInput({
      dailyMatch: {
        ...createBaseInput().dailyMatch,
        input_item_count: 5,
      },
      sleepEntry: {
        id: "sleep-2",
        daily_match_id: "daily-match-1",
        user_id: "user-1",
        sleep_started_at: "2026-07-27T22:30:00Z",
        woke_at: "2026-07-28T07:00:00Z",
        duration_minutes: 510,
        quality: "very_good",
        woke_during_sleep: false,
        validation_flags: {},
        created_at: "2026-07-28T07:00:00Z",
        updated_at: "2026-07-28T07:00:00Z",
      } as SleepEntryRow,
      physicalActivities: [
        {
          id: "physical-1",
          daily_match_id: "daily-match-1",
          user_id: "user-1",
          activity_type: "Jogging",
          custom_activity_name: "Lari pagi",
          intensity: "moderate",
          reason: "Lari pagi 45 menit persiapan presentasi.",
          normalized_signature: "physical-1",
          validation_flags: {},
          created_at: "2026-07-28T06:30:00Z",
          updated_at: "2026-07-28T06:30:00Z",
        },
      ],
      productiveActivities: [
        {
          id: "productive-2",
          daily_match_id: "daily-match-1",
          user_id: "user-1",
          category: "work",
          title: "Presentasi proyek",
          description:
            "Menyelesaikan persiapan presentasi proposal dan mengirim ringkasan hasil kepada tim.",
          normalized_signature: "productive-2",
          validation_flags: {},
          created_at: "2026-07-28T10:00:00Z",
          updated_at: "2026-07-28T10:00:00Z",
        },
      ],
      responsibilities: [
        {
          id: "responsibility-1",
          daily_match_id: "daily-match-1",
          user_id: "user-1",
          category: "work",
          description:
            "Menangani review tim akhir dan menyelesaikan tugas penting sebelum deadline.",
          execution_status: "completed",
          importance: "important",
          normalized_signature: "responsibility-1",
          validation_flags: {},
          created_at: "2026-07-28T11:00:00Z",
          updated_at: "2026-07-28T11:00:00Z",
        },
      ],
      otherActivities: [
        {
          id: "other-1",
          daily_match_id: "daily-match-1",
          user_id: "user-1",
          description:
            "Menyelesaikan riset akhir dan mengirim email tindak lanjut kepada klien.",
          normalized_signature: "other-1",
          classified_attribute: "discipline",
          validation_flags: {},
          created_at: "2026-07-28T10:30:00Z",
          updated_at: "2026-07-28T10:30:00Z",
        },
      ],
    });

    const highScore =
      calculateLogicScores(
        highDay,
      );


    printResult(
      "HIGH PERFORMANCE",
      highScore,
    );


    /*
    FAIRNESS CHECK
    */


    assert(
      calculateOverall(badScore) <
      calculateOverall(normalScore),
      "Bad day cannot exceed normal day",
    );

    assert(
      calculateOverall(normalScore) <
      calculateOverall(highScore),
      "Normal day cannot exceed high performance",
    );

  },
);