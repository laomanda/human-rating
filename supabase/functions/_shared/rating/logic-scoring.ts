import {
  LOGIC_RULESET_VERSION,
  PHYSICAL_INTENSITY_SCORE,
  RESPONSIBILITY_EXECUTION_SCORE,
  RESPONSIBILITY_IMPORTANCE_WEIGHT,
  SLEEP_QUALITY_ADJUSTMENT,
} from "./constants.ts";

import type {
  CanonicalRatingInput,
  DimensionMap,
  LogicScoreResult,
  ResponsibilityRow,
} from "./types.ts";

import {
  clamp,
  round1,
  uniqueBySignature,
} from "./utils.ts";

function weightedAverage(
  components: Array<{
    score: number;
    weight: number;
  }>,
): number {
  const valid = components.filter(
    (component) =>
      component.weight > 0,
  );

  if (valid.length === 0) {
    return 0;
  }

  const weightedTotal = valid.reduce(
    (total, component) =>
      total +
      component.score *
        component.weight,
    0,
  );

  const totalWeight = valid.reduce(
    (total, component) =>
      total + component.weight,
    0,
  );

  return weightedTotal / totalWeight;
}

/* ============================================================
 * ENERGY
 * ============================================================
 */

function scoreSleep(
  input: CanonicalRatingInput,
): number | null {
  const sleepEntry = input.sleepEntry;

  if (!sleepEntry) {
    return null;
  }

  const duration =
    sleepEntry.duration_minutes;

  let durationScore: number;

  if (
    duration >= 420 &&
    duration <= 540
  ) {
    durationScore = 9.5;
  } else if (
    (
      duration >= 360 &&
      duration < 420
    ) ||
    (
      duration > 540 &&
      duration <= 600
    )
  ) {
    durationScore = 8.0;
  } else if (
    (
      duration >= 300 &&
      duration < 360
    ) ||
    (
      duration > 600 &&
      duration <= 660
    )
  ) {
    durationScore = 6.5;
  } else if (
    (
      duration >= 240 &&
      duration < 300
    ) ||
    (
      duration > 660 &&
      duration <= 720
    )
  ) {
    durationScore = 4.5;
  } else {
    durationScore = 2.5;
  }

  const qualityAdjustment =
    SLEEP_QUALITY_ADJUSTMENT[
      sleepEntry.quality
    ];

  const interruptionPenalty =
    sleepEntry.woke_during_sleep
      ? 0.5
      : 0;

  return round1(
    clamp(
      durationScore +
        qualityAdjustment -
        interruptionPenalty,
    ),
  );
}

function scorePhysical(
  input: CanonicalRatingInput,
): number | null {
  const uniqueActivities =
    uniqueBySignature(
      input.physicalActivities,
    );

  if (uniqueActivities.length === 0) {
    return null;
  }

  const averageIntensity =
    uniqueActivities.reduce(
      (total, activity) =>
        total +
        PHYSICAL_INTENSITY_SCORE[
          activity.intensity
        ],
      0,
    ) / uniqueActivities.length;

  const breadthBonus = Math.min(
    Math.max(
      uniqueActivities.length - 1,
      0,
    ) * 0.35,
    1.0,
  );

  return round1(
    clamp(
      averageIntensity +
        breadthBonus,
    ),
  );
}

function scoreOtherEvidence(
  count: number,
): number | null {
  if (count === 0) {
    return null;
  }

  return round1(
    clamp(
      5.5 +
        Math.min(count, 4) * 0.5,
      0,
      7.5,
    ),
  );
}

function scoreEnergy(
  input: CanonicalRatingInput,
  otherCount: number,
): number {
  const sleepScore =
    scoreSleep(input);

  const physicalScore =
    scorePhysical(input);

  const otherScore =
    scoreOtherEvidence(otherCount);

  return round1(
    clamp(
      weightedAverage([
        {
          score: sleepScore ?? 0,
          weight:
            sleepScore === null
              ? 0
              : 0.55,
        },
        {
          score:
            physicalScore ?? 0,
          weight:
            physicalScore === null
              ? 0
              : 0.4,
        },
        {
          score: otherScore ?? 0,
          weight:
            otherScore === null
              ? 0
              : 0.05,
        },
      ]),
    ),
  );
}

/* ============================================================
 * FOCUS
 * ============================================================
 */

function scoreProductive(
  input: CanonicalRatingInput,
): number | null {
  const uniqueActivities =
    uniqueBySignature(
      input.productiveActivities,
    );

  if (uniqueActivities.length === 0) {
    return null;
  }

  const count =
    uniqueActivities.length;

  if (count === 1) {
    return 6.2;
  }

  if (count === 2) {
    return 7.4;
  }

  if (count === 3) {
    return 8.3;
  }

  if (count === 4) {
    return 9.0;
  }

  return 9.4;
}

function scoreFocus(
  input: CanonicalRatingInput,
  otherCount: number,
): number {
  const productiveScore =
    scoreProductive(input);

  const otherScore =
    scoreOtherEvidence(otherCount);

  return round1(
    clamp(
      weightedAverage([
        {
          score:
            productiveScore ?? 0,

          weight:
            productiveScore === null
              ? 0
              : 0.9,
        },
        {
          score:
            otherScore ?? 0,

          weight:
            otherScore === null
              ? 0
              : 0.1,
        },
      ]),
    ),
  );
}

/* ============================================================
 * RESPONSIBILITY
 * ============================================================
 */

function responsibilityCompletionRatio(
  responsibilities: ResponsibilityRow[],
): number | null {
  const uniqueResponsibilities =
    uniqueBySignature(
      responsibilities,
    );

  if (
    uniqueResponsibilities.length === 0
  ) {
    return null;
  }

  let weightedScore = 0;
  let totalWeight = 0;

  for (
    const responsibility of
    uniqueResponsibilities
  ) {
    const importanceWeight =
      RESPONSIBILITY_IMPORTANCE_WEIGHT[
        responsibility.importance
      ];

    const executionScore =
      RESPONSIBILITY_EXECUTION_SCORE[
        responsibility.execution_status
      ];

    weightedScore +=
      executionScore *
      importanceWeight;

    totalWeight += importanceWeight;
  }

  if (totalWeight === 0) {
    return null;
  }

  return (
    clamp(
      weightedScore /
        totalWeight,
    ) / 10
  );
}

function scoreResponsibility(
  input: CanonicalRatingInput,
  otherCount: number,
): {
  score: number;
  completionRatio: number | null;
} {
  const completionRatio =
    responsibilityCompletionRatio(
      input.responsibilities,
    );

  const responsibilityScore =
    completionRatio === null
      ? null
      : completionRatio * 10;

  const otherScore =
    scoreOtherEvidence(otherCount);

  return {
    score: round1(
      clamp(
        weightedAverage([
          {
            score:
              responsibilityScore ??
              0,

            weight:
              responsibilityScore ===
              null
                ? 0
                : 0.9,
          },
          {
            score:
              otherScore ?? 0,

            weight:
              otherScore === null
                ? 0
                : 0.1,
          },
        ]),
      ),
    ),

    completionRatio,
  };
}

/* ============================================================
 * PERSONAL BASELINE BLEND
 * ============================================================
 */

function blendWithBaseline(
  universal: number,
  baseline: number,
  universalWeight: number,
  personalWeight: number,
): number {
  return round1(
    clamp(
      universal *
        universalWeight +
        baseline *
          personalWeight,
    ),
  );
}

/* ============================================================
 * MAIN LOGIC SCORE
 * ============================================================
 */

export function calculateLogicScores(
  input: CanonicalRatingInput,
): LogicScoreResult {
  const uniquePhysical =
    uniqueBySignature(
      input.physicalActivities,
    );

  const uniqueProductive =
    uniqueBySignature(
      input.productiveActivities,
    );

  const uniqueResponsibilities =
    uniqueBySignature(
      input.responsibilities,
    );

  const uniqueOther =
    uniqueBySignature(
      input.otherActivities,
    );

  const otherCounts = {
    energy: uniqueOther.filter(
      (activity) =>
        activity.classified_attribute ===
        "energy",
    ).length,

    focus: uniqueOther.filter(
      (activity) =>
        activity.classified_attribute ===
        "focus",
    ).length,

    discipline: uniqueOther.filter(
      (activity) =>
        activity.classified_attribute ===
        "discipline",
    ).length,

    responsibility:
      uniqueOther.filter(
        (activity) =>
          activity.classified_attribute ===
          "responsibility",
      ).length,
  };

  const rawInputCount =
    (input.sleepEntry ? 1 : 0) +
    input.physicalActivities.length +
    input.productiveActivities.length +
    input.responsibilities.length +
    input.otherActivities.length;

  const uniqueEvidenceCount =
    (input.sleepEntry ? 1 : 0) +
    uniquePhysical.length +
    uniqueProductive.length +
    uniqueResponsibilities.length +
    uniqueOther.length;

  const hasData = {
    energy:
      Boolean(input.sleepEntry) ||
      uniquePhysical.length > 0 ||
      otherCounts.energy > 0,

    focus:
      uniqueProductive.length > 0 ||
      otherCounts.focus > 0,

    discipline:
      uniqueEvidenceCount > 0,

    responsibility:
      uniqueResponsibilities.length >
        0 ||
      otherCounts.responsibility > 0,
  };

  const validationFlags: string[] = [
    LOGIC_RULESET_VERSION,
  ];

  if (
    input.dailyMatch
      .input_item_count !==
    rawInputCount
  ) {
    validationFlags.push(
      "daily_match_input_count_mismatch",
    );
  }

  if (
    rawInputCount !==
    uniqueEvidenceCount
  ) {
    validationFlags.push(
      "duplicate_signatures_deduplicated_for_scoring",
    );
  }

  if (rawInputCount === 0) {
    return {
      hasData,

      universal: {
        energy: 0,
        focus: 0,
        discipline: 0,
        responsibility: 0,
      },

      baselineApplied: false,
      baseline: null,

      logic: {
        energy: 0,
        focus: 0,
        discipline: 0,
        responsibility: 0,
      },

      metrics: {
        rawInputCount: 0,
        uniqueEvidenceCount: 0,

        energyEvidenceCount: 0,
        focusEvidenceCount: 0,
        disciplineEvidenceCount: 0,
        responsibilityEvidenceCount: 0,

        responsibilityCompletionRatio:
          null,

        databaseInputCount:
          input.dailyMatch
            .input_item_count,
      },

      validationFlags: [
        ...validationFlags,
        "no_activity",
      ],
    };
  }

  const energy = hasData.energy
    ? scoreEnergy(
        input,
        otherCounts.energy,
      )
    : 0;

  const focus = hasData.focus
    ? scoreFocus(
        input,
        otherCounts.focus,
      )
    : 0;

  const responsibilityResult =
    hasData.responsibility
      ? scoreResponsibility(
          input,
          otherCounts.responsibility,
        )
      : {
          score: 0,
          completionRatio: null,
        };

  /*
   * Discipline is synthesized from:
   * - coverage of primary dimensions
   * - amount of unique evidence
   * - responsibility completion
   * - explicitly classified discipline evidence
   */
  const directCoverage =
    [
      hasData.energy,
      hasData.focus,
      hasData.responsibility,
    ].filter(Boolean).length / 3;

  const consistencyRatio =
    Math.min(
      uniqueEvidenceCount / 5,
      1,
    );

  const completionRatio =
    responsibilityResult
      .completionRatio ??
    directCoverage;

  const disciplineEvidenceBonus =
    Math.min(
      otherCounts.discipline *
        0.3,
      0.6,
    );

  const discipline =
    hasData.discipline
      ? round1(
          clamp(
            3.0 +
              directCoverage *
                3.0 +
              consistencyRatio *
                2.0 +
              completionRatio *
                2.0 +
              disciplineEvidenceBonus,
          ),
        )
      : 0;

  const universal: DimensionMap = {
    energy,
    focus,
    discipline,

    responsibility:
      responsibilityResult.score,
  };

  const baselineReady = Boolean(
    input.baseline &&
      input.baseline
        .calibration_match_count >= 7 &&
      input.baseline
        .calibration_completed_at,
  );

  const baseline:
    | DimensionMap
    | null = baselineReady
    ? {
        energy:
          input.baseline!
            .energy_baseline,

        focus:
          input.baseline!
            .focus_baseline,

        discipline:
          input.baseline!
            .discipline_baseline,

        responsibility:
          input.baseline!
            .responsibility_baseline,
      }
    : null;

  const config =
    input.scoringConfig;

  const logic: DimensionMap = {
    energy:
      hasData.energy && baseline
        ? blendWithBaseline(
            universal.energy,
            baseline.energy,
            config.universal_weight,
            config.personal_weight,
          )
        : universal.energy,

    focus:
      hasData.focus && baseline
        ? blendWithBaseline(
            universal.focus,
            baseline.focus,
            config.universal_weight,
            config.personal_weight,
          )
        : universal.focus,

    discipline:
      hasData.discipline && baseline
        ? blendWithBaseline(
            universal.discipline,
            baseline.discipline,
            config.universal_weight,
            config.personal_weight,
          )
        : universal.discipline,

    responsibility:
      hasData.responsibility &&
      baseline
        ? blendWithBaseline(
            universal.responsibility,
            baseline.responsibility,
            config.universal_weight,
            config.personal_weight,
          )
        : universal.responsibility,
  };

  validationFlags.push(
    baselineReady
      ? "personal_baseline_applied"
      : "universal_only_uncalibrated",
  );

  return {
    hasData,
    universal,

    baselineApplied:
      baselineReady,

    baseline,
    logic,

    metrics: {
      rawInputCount,
      uniqueEvidenceCount,

      energyEvidenceCount:
        (input.sleepEntry ? 1 : 0) +
        uniquePhysical.length +
        otherCounts.energy,

      focusEvidenceCount:
        uniqueProductive.length +
        otherCounts.focus,

      disciplineEvidenceCount:
        uniqueEvidenceCount +
        otherCounts.discipline,

      responsibilityEvidenceCount:
        uniqueResponsibilities.length +
        otherCounts.responsibility,

      responsibilityCompletionRatio:
        responsibilityResult
          .completionRatio,

      databaseInputCount:
        input.dailyMatch
          .input_item_count,
    },

    validationFlags,
  };
}