import {
  LOGIC_RULESET_VERSION,
  PHYSICAL_INTENSITY_SCORE,
  RESPONSIBILITY_EXECUTION_SCORE,
  RESPONSIBILITY_IMPORTANCE_WEIGHT,
  SLEEP_QUALITY_ADJUSTMENT,
} from "./constants.ts";

import {
  analyzeInputIntegrity,
} from "./input-integrity.ts";

import type {
  CanonicalRatingInput,
  DimensionMap,
  EvidenceAssessment,
  LogicScoreResult,
  OtherActivityRow,
  PhysicalActivityRow,
  ProductiveActivityRow,
  ResponsibilityRow,
} from "./types.ts";

import {
  clamp,
  round1,
} from "./utils.ts";

type AssessedRow<T> = {
  row: T;
  assessment: EvidenceAssessment;
};

const COUNTERPRODUCTIVE_FLAG =
  "counterproductive_activity";

const ACTION_EVIDENCE_PATTERN =
  /\b(?:belajar|berlatih|evaluasi|follow\s*up|jalan|lari|membaca|membuat|memperbaiki|mempelajari|mengerjakan|mengirim|menulis|menyelesaikan|review)\b/iu;

const COMPLETION_EVIDENCE_PATTERN =
  /\b(?:diselesaikan|final|follow\s*up|mengirim|menyelesaikan|rampung|selesai|terkirim)\b/iu;

const SPECIFIC_DELIVERABLE_PATTERN =
  /\b(?:dokumen|hasil|keuangan|laporan|manager|modul|proyek|project|revisi|tim)\b/iu;

const BASIC_CONTEXT_PATTERN =
  /\b(?:deadline|kuliah|kewajiban|meeting|pekerjaan|tugas)\b/iu;

const NUMERIC_DETAIL_PATTERN =
  /\b\d+(?:[.,]\d+)?\b/u;

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

  const weightedTotal =
    valid.reduce(
      (total, component) =>
        total +
        component.score *
        component.weight,
      0,
    );

  const totalWeight =
    valid.reduce(
      (total, component) =>
        total + component.weight,
      0,
    );

  return weightedTotal / totalWeight;
}

function average(
  values: number[],
): number {
  if (values.length === 0) {
    return 0;
  }

  return (
    values.reduce(
      (total, value) =>
        total + value,
      0,
    ) / values.length
  );
}

function evidenceStrength(
  ...values: Array<
    string | null | undefined
  >
): number {
  const text = values
    .filter(Boolean)
    .join(" ")
    .normalize("NFKC")
    .toLowerCase();

  if (!text) {
    return 0;
  }

  let strength = 0;

  if (
    COMPLETION_EVIDENCE_PATTERN.test(
      text,
    )
  ) {
    strength += 0.35;
  }

  if (
    SPECIFIC_DELIVERABLE_PATTERN.test(
      text,
    )
  ) {
    strength += 0.3;
  }

  if (
    BASIC_CONTEXT_PATTERN.test(text)
  ) {
    strength += 0.15;
  }

  if (
    ACTION_EVIDENCE_PATTERN.test(text)
  ) {
    strength += 0.1;
  }

  if (
    NUMERIC_DETAIL_PATTERN.test(text)
  ) {
    strength += 0.1;
  }

  return clamp(strength, 0, 1);
}

function acceptedRows<
  T extends {
    id: string;
  },
>(
  rows: T[],
  assessments: EvidenceAssessment[],
): AssessedRow<T>[] {
  const assessmentById =
    new Map(
      assessments.map(
        (assessment) => [
          assessment.id,
          assessment,
        ],
      ),
    );

  return rows.flatMap((row) => {
    const assessment =
      assessmentById.get(row.id);

    if (!assessment?.accepted) {
      return [];
    }

    return [
      {
        row,
        assessment,
      },
    ];
  });
}

/* ============================================================
 * ENERGY
 * ============================================================
 */

function scoreSleep(
  input: CanonicalRatingInput,
  sleepAccepted: boolean,
): number | null {
  const sleepEntry =
    input.sleepEntry;

  if (
    !sleepEntry ||
    !sleepAccepted
  ) {
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
  activities: Array<
    AssessedRow<PhysicalActivityRow>
  >,
): number | null {
  if (activities.length === 0) {
    return null;
  }

  const scores =
    activities.map(
      ({
        row,
        assessment,
      }) => {
        const intensityScore =
          PHYSICAL_INTENSITY_SCORE[
          row.intensity
          ];

        /*
         * No breadth or quantity bonus.
         */
        const qualityMultiplier =
          0.85 +
          assessment.qualityScore *
          0.15;

        return (
          intensityScore *
          qualityMultiplier
        );
      },
    );

  return round1(
    clamp(average(scores)),
  );
}

function scoreOtherEvidence(
  activities: Array<
    AssessedRow<OtherActivityRow>
  >,
): number | null {
  if (activities.length === 0) {
    return null;
  }

  const evidenceScores =
    activities.map(
      ({ row, assessment }) => {
        if (
          assessment.flags.includes(
            COUNTERPRODUCTIVE_FLAG,
          )
        ) {
          return 1.5;
        }

        return (
          4.0 +
          assessment.qualityScore *
            1.4 +
          evidenceStrength(
            row.description,
          ) *
            2.1
        );
      },
    );

  const averageScore =
    average(evidenceScores);

  const bestScore =
    Math.max(...evidenceScores);

  /*
   * Quantity is excluded. Counterproductive
   * evidence is valid history, but it cannot
   * become positive performance.
   */
  return round1(
    clamp(
      averageScore * 0.75 +
        bestScore * 0.25,
      0,
      7.5,
    ),
  );
}

function scoreEnergy(
  input: CanonicalRatingInput,
  sleepAccepted: boolean,

  physical: Array<
    AssessedRow<PhysicalActivityRow>
  >,

  other: Array<
    AssessedRow<OtherActivityRow>
  >,
): number {
  const sleepScore =
    scoreSleep(
      input,
      sleepAccepted,
    );

  const physicalScore =
    scorePhysical(physical);

  const otherScore =
    scoreOtherEvidence(other);

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
  activities: Array<
    AssessedRow<ProductiveActivityRow>
  >,
): number | null {
  if (activities.length === 0) {
    return null;
  }

  const evidenceScores =
    activities.map(
      ({ row, assessment }) =>
        4.2 +
        assessment.qualityScore *
          1.8 +
        evidenceStrength(
          row.title,
          row.description,
        ) *
          3.0,
    );

  const averageScore =
    average(evidenceScores);

  const bestScore =
    Math.max(...evidenceScores);

  /*
   * One high-quality activity can score well.
   * Many low-quality activities cannot inflate
   * the result because count is absent.
   */
  return round1(
    clamp(
      averageScore * 0.7 +
      bestScore * 0.3,
    ),
  );
}

function scoreFocus(
  productive: Array<
    AssessedRow<ProductiveActivityRow>
  >,

  other: Array<
    AssessedRow<OtherActivityRow>
  >,
): number {
  const productiveScore =
    scoreProductive(productive);

  const otherScore =
    scoreOtherEvidence(other);

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
          score: otherScore ?? 0,

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
  responsibilities: Array<
    AssessedRow<ResponsibilityRow>
  >,
): number | null {
  if (
    responsibilities.length === 0
  ) {
    return null;
  }

  let weightedScore = 0;
  let totalWeight = 0;

  for (
    const {
      row,
      assessment,
    } of responsibilities
  ) {
    const importanceWeight =
      RESPONSIBILITY_IMPORTANCE_WEIGHT[
      row.importance
      ];

    const executionScore =
      RESPONSIBILITY_EXECUTION_SCORE[
      row.execution_status
      ];

    const completionStrength =
      evidenceStrength(
        row.description,
      );

    const evidenceMultiplier =
      0.45 +
      completionStrength * 0.4 +
      assessment.qualityScore *
        0.15;

    weightedScore +=
      executionScore *
      evidenceMultiplier *
      importanceWeight;

    totalWeight +=
      importanceWeight;
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
  responsibilities: Array<
    AssessedRow<ResponsibilityRow>
  >,

  other: Array<
    AssessedRow<OtherActivityRow>
  >,
): {
  score: number;
  completionRatio: number | null;
} {
  const completionRatio =
    responsibilityCompletionRatio(
      responsibilities,
    );

  const responsibilityScore =
    completionRatio === null
      ? null
      : completionRatio * 10;

  const otherScore =
    scoreOtherEvidence(other);

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
 * PERSONAL BASELINE
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
 * MAIN
 * ============================================================
 */

export function calculateLogicScores(
  input: CanonicalRatingInput,
): LogicScoreResult {
  const integrity =
    analyzeInputIntegrity(input);

  const physical =
    acceptedRows(
      input.physicalActivities,
      integrity.physical,
    );

  const productive =
    acceptedRows(
      input.productiveActivities,
      integrity.productive,
    );

  const responsibilities =
    acceptedRows(
      input.responsibilities,
      integrity.responsibilities,
    );

  const other =
    acceptedRows(
      input.otherActivities,
      integrity.other,
    );

  const otherByAttribute = {
    energy: other.filter(
      ({ row }) =>
        row.classified_attribute ===
        "energy",
    ),

    focus: other.filter(
      ({ row }) =>
        row.classified_attribute ===
        "focus",
    ),

    discipline: other.filter(
      ({ row }) =>
        row.classified_attribute ===
        "discipline",
    ),

    responsibility: other.filter(
      ({ row }) =>
        row.classified_attribute ===
        "responsibility",
    ),
  };

  const hasData = {
    energy:
      integrity.sleepAccepted ||
      physical.length > 0 ||
      otherByAttribute.energy
        .length > 0,

    focus:
      productive.length > 0 ||
      otherByAttribute.focus
        .length > 0,

    discipline:
      integrity.metrics
        .acceptedEvidenceCount > 0,

    responsibility:
      responsibilities.length > 0 ||
      otherByAttribute
        .responsibility.length > 0,
  };

  const validationFlags: string[] = [
    LOGIC_RULESET_VERSION,
    ...integrity.validationFlags,
  ];

  if (
    input.dailyMatch
      .input_item_count !==
    integrity.metrics.rawInputCount
  ) {
    validationFlags.push(
      "daily_match_input_count_mismatch",
    );
  }

  if (
    integrity.metrics.rawInputCount ===
    0 ||
    integrity.metrics
      .acceptedEvidenceCount === 0
  ) {
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

      integrity,

      metrics: {
        ...integrity.metrics,

        uniqueEvidenceCount:
          integrity.metrics
            .acceptedEvidenceCount,

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

        integrity.metrics
          .rawInputCount === 0
          ? "no_activity"
          : "no_valid_activity",
      ],
    };
  }

  const rawEnergy =
    hasData.energy
      ? scoreEnergy(
        input,
        integrity.sleepAccepted,
        physical,
        otherByAttribute.energy,
      )
      : 0;

  const energy =
    integrity.metrics
      .timePlausibilityConflict
      ? Math.min(
        rawEnergy,
        6.0,
      )
      : rawEnergy;

  const rawFocus =
    hasData.focus
      ? scoreFocus(
        productive,
        otherByAttribute.focus,
      )
      : 0;

  const rawResponsibilityResult =
    hasData.responsibility
      ? scoreResponsibility(
        responsibilities,
        otherByAttribute
          .responsibility,
      )
      : {
        score: 0,
        completionRatio: null,
      };

  /*
   * Konflik durasi tidak membuktikan user berbohong.
   * Namun data tersebut tidak cukup konsisten untuk
   * mendukung rating tinggi atau adjustment AI.
   */
  const focus =
    integrity.metrics
      .timePlausibilityConflict
      ? Math.min(
        rawFocus,
        6.0,
      )
      : rawFocus;

  const responsibilityResult =
    integrity.metrics
      .timePlausibilityConflict
      ? {
        ...rawResponsibilityResult,

        score: Math.min(
          rawResponsibilityResult
            .score,
          6.0,
        ),
      }
      : rawResponsibilityResult;

  const directCoverage =
    [
      hasData.energy,
      hasData.focus,
      hasData.responsibility,
    ].filter(Boolean).length / 3;

  const completionRatio =
    responsibilityResult
      .completionRatio ?? 0;

  const counterproductiveEvidenceCount =
    [
      ...integrity.physical,
      ...integrity.productive,
      ...integrity.responsibilities,
      ...integrity.other,
    ].filter((assessment) =>
      assessment.flags.includes(
        COUNTERPRODUCTIVE_FLAG,
      ),
    ).length;

  const integrityPenalty =
    (
      1 -
      integrity.metrics
        .acceptanceRatio
    ) *
    2.0 +
    Math.min(
      integrity.metrics
        .duplicateEvidenceCount *
      0.5,
      1,
    ) +
    Math.min(
      counterproductiveEvidenceCount *
        2.5,
      4,
    ) +
    (
      integrity.metrics
        .timePlausibilityConflict
        ? 3.0
        : 0
    );

  const reliableEvidence =
    integrity.metrics
      .averageEvidenceQuality *
    integrity.metrics
      .acceptanceRatio;

  /*
   * Discipline measures clean, reliable execution
   * and coverage. It does not reward raw quantity.
   */
  const discipline =
    hasData.discipline
      ? round1(
        clamp(
          1.0 +
          directCoverage * 1.4 +
          reliableEvidence * 2.2 +
          completionRatio * 2.2 +
          integrity.metrics
            .acceptanceRatio *
          0.8 -
          integrityPenalty,
          0,
          9.2,
        ),
      )
      : 0;

  const universal:
    DimensionMap = {
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
    DimensionMap | null =
    baselineReady
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
      hasData.energy &&
        baseline
        ? blendWithBaseline(
          universal.energy,
          baseline.energy,
          config.universal_weight,
          config.personal_weight,
        )
        : universal.energy,

    focus:
      hasData.focus &&
        baseline
        ? blendWithBaseline(
          universal.focus,
          baseline.focus,
          config.universal_weight,
          config.personal_weight,
        )
        : universal.focus,

    discipline:
      hasData.discipline &&
        baseline
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

  if (
    integrity.metrics
      .timePlausibilityConflict
  ) {
    validationFlags.push(
      "time_plausibility_conflict_score_constrained",
    );
  }

  if (
    counterproductiveEvidenceCount > 0
  ) {
    validationFlags.push(
      `counterproductive_evidence_${counterproductiveEvidenceCount}`,
    );
  }

  validationFlags.push(
    "activity_quantity_not_used_as_direct_score_multiplier",
  );

  return {
    hasData,
    universal,
    baselineApplied: baselineReady,
    baseline,
    logic,
    integrity,

    metrics: {
      ...integrity.metrics,

      uniqueEvidenceCount:
        integrity.metrics
          .acceptedEvidenceCount,

      energyEvidenceCount:
        (
          integrity.sleepAccepted
            ? 1
            : 0
        ) +
        physical.length +
        otherByAttribute.energy
          .length,

      focusEvidenceCount:
        productive.length +
        otherByAttribute.focus
          .length,

      disciplineEvidenceCount:
        integrity.metrics
          .acceptedEvidenceCount,

      responsibilityEvidenceCount:
        responsibilities.length +
        otherByAttribute
          .responsibility.length,

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
