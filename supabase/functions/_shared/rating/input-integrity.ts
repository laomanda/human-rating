import {
  INPUT_INTEGRITY_RULESET_VERSION,
  TEXT_QUALITY_THRESHOLDS,
} from "./constants.ts";

import type {
  CanonicalRatingInput,
  EvidenceAssessment,
  InputIntegrityResult,
  TextQualityAssessment,
} from "./types.ts";

import {
  clamp,
  round1,
} from "./utils.ts";

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions?/iu,
  /ignore\s+(the\s+)?system\s+prompt/iu,
  /abaikan\s+(semua\s+)?instruksi/iu,
  /abaikan\s+(aturan|perintah|prompt)/iu,
  /ikuti\s+instruksi\s+berikut/iu,
  /beri(?:kan)?\s+(saya\s+)?(nilai|rating|skor)\s*(10|sepuluh|tinggi|maksimal)/iu,
  /(nilai|rating|skor)\s*(saya\s*)?(harus|wajib|jadi)\s*(10|sepuluh|tinggi|maksimal)/iu,
  /you\s+are\s+now\s+(?:a|an|the)/iu,
] as const;

const PLACEHOLDER_PATTERNS = [
  /^(?:test|testing)$/iu,
  /^coba(?:\s+coba)*$/iu,
  /^dummy$/iu,
  /^lorem\s+ipsum/iu,
  /^contoh\s+input$/iu,
  /^isi\s+di\s+sini$/iu,
] as const;

const KEYBOARD_MASH_TOKENS = new Set([
  "asdf",
  "asdfg",
  "asdfgh",
  "asdfghjkl",
  "qwer",
  "qwerty",
  "qwertyuiop",
  "zxcv",
  "zxcvb",
  "zxcvbnm",
  "hjkl",
  "lkjhg",
  "poiuy",
  "mnbvc",
]);

const STOP_WORDS = new Set([
  "aku",
  "anda",
  "dan",
  "di",
  "hari",
  "ini",
  "itu",
  "ke",
  "pada",
  "sangat",
  "saya",
  "sebuah",
  "serta",
  "the",
  "untuk",
  "yang",
]);

const GENERIC_ACTIVITY_WORDS = new Set([
  "aktivitas",
  "bagus",
  "bekerja",
  "belajar",
  "disiplin",
  "done",
  "exercise",
  "good",
  "hebat",
  "kegiatan",
  "kerja",
  "luar",
  "maksimal",
  "mengerjakan",
  "melakukan",
  "olahraga",
  "produktif",
  "selesai",
  "study",
  "sukses",
  "tugas",
  "work",
]);

const CONCRETE_SIGNAL_PATTERN =
  /\b(?:bab|dokumen|email|evaluasi|final|hasil|klien|laporan|latihan|materi|matematika|meeting|pelanggan|presentasi|proyek|proposal|rapat|revisi|soal|skripsi|tim|ujian)\b/iu;

const ACTION_SIGNAL_PATTERN =
  /\b(?:analisis|belajar|berlatih|berolahraga|bekerja|diskusi|evaluasi|jalan|jogging|kerja|lari|membaca|membantu|membuat|memperbaiki|mempelajari|menangani|mengerjakan|mengirim|menulis|menyelesaikan|merancang|olahraga|rapat|review|revisi)\b/iu;

const OUTCOME_SIGNAL_PATTERN =
  /\b(?:berhasil|diterima|dikirim|diselesaikan|final|rampung|selesai|tercapai|terkirim)\b/iu;

const SELF_ASSESSMENT_PATTERN =
  /\b(?:saya|aku)\s+(?:(?:adalah|orang)\s+)?(?:merasa\s+)?(?:sangat\s+)?(?:disiplin|hebat|luar\s+biasa|maksimal|produktif|sukses)\b/iu;

const COUNTERPRODUCTIVE_ACTIVITY_PATTERN =
  /\b(?:doomscroll|scroll|scrolling|media\s+sosial|sosial\s+media|tiktok|instagram|game|gaming|rebahan|malas|menunda|prokrastinasi)\b/iu;

const TOKEN_PATTERN =
  /[\p{L}\p{N}]+/gu;

const LETTER_PATTERN =
  /\p{L}/gu;

const NUMBER_PATTERN =
  /\p{N}/gu;

const VOWEL_PATTERN =
  /[aeiou]/giu;

/*
 * Durasi hanya diekstrak bila angka berada dekat
 * kata aktivitas atau penanda durasi.
 *
 * Ini menghindari angka seperti:
 * "deadline 10 jam lagi"
 * dianggap otomatis sebagai waktu kerja.
 */
const DURATION_CONTEXT_PATTERN =
  /(?:\b(?:belajar|bekerja|berolahraga|exercise|jogging|kerja|lari|latihan|membaca|mengerjakan|menulis|menyelesaikan|olahraga|rapat|sleep|study|tidur|work)\b|(?:selama|for))[^.,;\n]{0,36}?(\d{1,3}(?:[.,]\d+)?)\s*(jam|hours?|hrs?|hr|menit|minutes?|mins?|min)\b/giu;

function normalizeText(
  value: string,
): string {
  return value
    .normalize("NFKC")
    .replace(
      /[\u0000-\u001F\u007F]/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function countMatches(
  value: string,
  pattern: RegExp,
): number {
  return value.match(pattern)?.length ?? 0;
}

function uniqueRatio(
  tokens: string[],
): number {
  if (tokens.length === 0) {
    return 0;
  }

  return (
    new Set(tokens).size /
    tokens.length
  );
}

function maximumTokenFrequencyRatio(
  tokens: string[],
): number {
  if (tokens.length === 0) {
    return 0;
  }

  const frequencies =
    new Map<string, number>();

  for (const token of tokens) {
    frequencies.set(
      token,
      (frequencies.get(token) ?? 0) + 1,
    );
  }

  let maximum = 0;

  for (const frequency of frequencies.values()) {
    maximum = Math.max(
      maximum,
      frequency,
    );
  }

  return maximum / tokens.length;
}

function hasPromptInjection(
  value: string,
): boolean {
  return PROMPT_INJECTION_PATTERNS.some(
    (pattern) => pattern.test(value),
  );
}

function isPlaceholderText(
  value: string,
): boolean {
  return PLACEHOLDER_PATTERNS.some(
    (pattern) => pattern.test(value),
  );
}

function isKeyboardMashToken(
  token: string,
): boolean {
  if (
    KEYBOARD_MASH_TOKENS.has(token)
  ) {
    return true;
  }

  return /^(?:asdf|qwer|zxcv|hjkl|lkjhg|poiuy|mnbvc)[a-z]*$/iu.test(
    token,
  );
}

function detectKeyboardMash(
  tokens: string[],
): boolean {
  return tokens.some(
    isKeyboardMashToken,
  );
}

function detectRandomText(
  tokens: string[],
  letterCount: number,
): boolean {
  if (letterCount === 0) {
    return false;
  }

  const alphabeticTokens =
    tokens.filter(
      (token) =>
        /^\p{L}+$/u.test(token),
    );

  const veryLongTokens =
    alphabeticTokens.filter(
      (token) => token.length >= 24,
    );

  const vowellessLongTokens =
    alphabeticTokens.filter(
      (token) => {
        if (token.length < 7) {
          return false;
        }

        return (
          countMatches(
            token,
            VOWEL_PATTERN,
          ) === 0
        );
      },
    );

  const suspiciousLongTokens =
    alphabeticTokens.filter(
      (token) => {
        if (token.length < 12) {
          return false;
        }

        const vowelCount =
          countMatches(
            token,
            VOWEL_PATTERN,
          );

        const vowelRatio =
          vowelCount /
          token.length;

        return (
          vowelRatio < 0.12 ||
          /[^aeiou\W\d_]{8,}/iu.test(
            token,
          )
        );
      },
    );

  const averageAlphabeticLength =
    alphabeticTokens.length === 0
      ? 0
      : alphabeticTokens.reduce(
          (total, token) =>
            total + token.length,
          0,
        ) / alphabeticTokens.length;

  return (
    veryLongTokens.length >= 2 ||
    (
      veryLongTokens.length === 1 &&
      alphabeticTokens.length <= 2
    ) ||
    vowellessLongTokens.length >= 2 ||
    suspiciousLongTokens.length >= 2 ||
    (
      alphabeticTokens.length >= 2 &&
      averageAlphabeticLength >= 17
    )
  );
}

function durationToMinutes(
  amount: number,
  unit: string,
): number {
  const normalizedUnit =
    unit.toLowerCase();

  if (
    normalizedUnit === "jam" ||
    normalizedUnit === "hour" ||
    normalizedUnit === "hours" ||
    normalizedUnit === "hr" ||
    normalizedUnit === "hrs"
  ) {
    return amount * 60;
  }

  return amount;
}

export function extractClaimedDurationMinutes(
  rawValue: string,
): number {
  const normalized =
    normalizeText(rawValue);

  if (!normalized) {
    return 0;
  }

  /*
   * Buat instance RegExp baru supaya state lastIndex
   * tidak dibagi antar pemanggilan.
   */
  const pattern = new RegExp(
    DURATION_CONTEXT_PATTERN.source,
    DURATION_CONTEXT_PATTERN.flags,
  );

  let totalMinutes = 0;

  for (
    const match of normalized.matchAll(
      pattern,
    )
  ) {
    const numericValue =
      Number(
        match[1].replace(",", "."),
      );

    if (
      !Number.isFinite(
        numericValue,
      ) ||
      numericValue <= 0
    ) {
      continue;
    }

    totalMinutes +=
      durationToMinutes(
        numericValue,
        match[2],
      );
  }

  return Math.round(totalMinutes);
}

export function analyzeTextQuality(
  rawValue: string | null | undefined,
): TextQualityAssessment {
  const normalizedText =
    normalizeText(rawValue ?? "");

  if (!normalizedText) {
    return {
      accepted: false,
      normalizedText,
      qualityScore: 0,
      tokenCount: 0,
      meaningfulTokenCount: 0,
      flags: ["empty_text"],
    };
  }

  const flags: string[] = [];

  const tokens =
    normalizedText.match(
      TOKEN_PATTERN,
    ) ?? [];

  const letterCount =
    countMatches(
      normalizedText,
      LETTER_PATTERN,
    );

  const numberCount =
    countMatches(
      normalizedText,
      NUMBER_PATTERN,
    );

  const visibleCharacterCount =
    normalizedText
      .replace(/\s/g, "")
      .length;

  const symbolCount =
    Math.max(
      visibleCharacterCount -
        letterCount -
        numberCount,
      0,
    );

  const meaningfulTokens =
    tokens.filter(
      (token) =>
        token.length >= 2 &&
        token.length <= 23,
    );

  const contentTokens =
    meaningfulTokens.filter(
      (token) =>
        !STOP_WORDS.has(token),
    );

  const hasConcreteSignal =
    CONCRETE_SIGNAL_PATTERN.test(
      normalizedText,
    );

  const hasActionSignal =
    ACTION_SIGNAL_PATTERN.test(
      normalizedText,
    );

  const hasOutcomeSignal =
    OUTCOME_SIGNAL_PATTERN.test(
      normalizedText,
    );

  const hasNumericDetail =
    numberCount > 0;

  const promptInjection =
    hasPromptInjection(
      normalizedText,
    );

  const placeholder =
    isPlaceholderText(
      normalizedText,
    );

  const keyboardMash =
    detectKeyboardMash(tokens);

  const randomText =
    detectRandomText(
      tokens,
      letterCount,
    );

  const repeatedCharacter =
    /(.)\1{5,}/iu.test(
      normalizedText,
    );

  const excessiveRepetition =
    tokens.length >= 4 &&
    maximumTokenFrequencyRatio(
      tokens,
    ) >= 0.6;

  const symbolRatio =
    visibleCharacterCount === 0
      ? 0
      : symbolCount /
        visibleCharacterCount;

  const symbolHeavy =
    symbolRatio >= 0.45 &&
    letterCount < 8;

  const genericOnly =
    contentTokens.length === 0 ||
    contentTokens.every(
      (token) =>
        GENERIC_ACTIVITY_WORDS.has(
          token,
        ),
    );

  const unsupportedSelfAssessment =
    SELF_ASSESSMENT_PATTERN.test(
      normalizedText,
    ) &&
    !hasConcreteSignal &&
    !hasOutcomeSignal &&
    !hasNumericDetail;

  const counterproductiveActivity =
    COUNTERPRODUCTIVE_ACTIVITY_PATTERN.test(
      normalizedText,
    );

  const lowInformation =
    meaningfulTokens.length < 2 ||
    letterCount < 5 ||
    (
      contentTokens.length < 2 &&
      !hasConcreteSignal &&
      !hasOutcomeSignal &&
      !hasNumericDetail
    );

  if (promptInjection) {
    flags.push(
      "prompt_injection",
    );
  }

  if (placeholder) {
    flags.push(
      "placeholder_text",
    );
  }

  if (keyboardMash) {
    flags.push(
      "keyboard_mash",
    );
  }

  if (randomText) {
    flags.push(
      "random_text",
    );
  }

  if (repeatedCharacter) {
    flags.push(
      "repeated_characters",
    );
  }

  if (excessiveRepetition) {
    flags.push(
      "excessive_repetition",
    );
  }

  if (symbolHeavy) {
    flags.push(
      "symbol_heavy",
    );
  }

  if (lowInformation) {
    flags.push(
      "low_information",
    );
  }

  if (genericOnly) {
    flags.push(
      "generic_claim",
    );
  }

  if (unsupportedSelfAssessment) {
    flags.push(
      "unsupported_self_assessment",
    );
  }

  if (counterproductiveActivity) {
    flags.push(
      "counterproductive_activity",
    );
  }

  let qualityScore = 1;

  if (lowInformation) {
    qualityScore -= 0.55;
  }

  if (tokens.length < 4) {
    qualityScore -= 0.15;
  }

  if (genericOnly) {
    qualityScore -= 0.55;
  }

  if (unsupportedSelfAssessment) {
    qualityScore -= 0.75;
  }

  if (hasActionSignal) {
    qualityScore += 0.08;
  }

  if (hasConcreteSignal) {
    qualityScore += 0.1;
  }

  if (hasOutcomeSignal) {
    qualityScore += 0.08;
  }

  if (hasNumericDetail) {
    qualityScore += 0.05;
  }

  if (
    uniqueRatio(tokens) < 0.55
  ) {
    qualityScore -= 0.18;
  }

  if (excessiveRepetition) {
    qualityScore -= 0.45;
  }

  if (repeatedCharacter) {
    qualityScore -= 0.35;
  }

  if (symbolHeavy) {
    qualityScore -= 0.6;
  }

  if (randomText) {
    qualityScore -= 0.8;
  }

  if (keyboardMash) {
    qualityScore -= 0.9;
  }

  if (placeholder) {
    qualityScore -= 0.9;
  }

  if (promptInjection) {
    qualityScore = 0;
  }

  if (counterproductiveActivity) {
    qualityScore = Math.min(
      qualityScore,
      0.2,
    );
  }

  qualityScore =
    round1(
      clamp(
        qualityScore,
        0,
        1,
      ),
    );

  const hardRejected =
    promptInjection ||
    placeholder ||
    keyboardMash ||
    randomText ||
    symbolHeavy ||
    excessiveRepetition ||
    repeatedCharacter ||
    unsupportedSelfAssessment;

  return {
    accepted:
      !hardRejected &&
      qualityScore >=
        TEXT_QUALITY_THRESHOLDS
          .minimumAccepted,

    normalizedText,
    qualityScore,
    tokenCount: tokens.length,

    meaningfulTokenCount:
      meaningfulTokens.length,

    flags,
  };
}

function mergeFlags(
  ...groups: string[][]
): string[] {
  return [
    ...new Set(
      groups.flat(),
    ),
  ];
}

function createDuplicateKey(
  ...values: Array<
    string | null | undefined
  >
): string {
  return values
    .map((value) =>
      normalizeText(value ?? ""),
    )
    .filter(Boolean)
    .join("|");
}

function duplicateAwareAssessment(
  assessment: EvidenceAssessment,
  duplicateKey: string,
  seenKeys: Set<string>,
): EvidenceAssessment {
  if (!assessment.accepted) {
    return assessment;
  }

  if (
    duplicateKey &&
    seenKeys.has(duplicateKey)
  ) {
    return {
      ...assessment,
      accepted: false,
      qualityScore: 0,

      flags: mergeFlags(
        assessment.flags,
        ["duplicate_evidence"],
      ),
    };
  }

  if (duplicateKey) {
    seenKeys.add(duplicateKey);
  }

  return assessment;
}

function assessPhysicalActivities(
  input: CanonicalRatingInput,
): EvidenceAssessment[] {
  const seenKeys =
    new Set<string>();

  return input.physicalActivities.map(
    (activity) => {
      const customName =
        activity.activity_type ===
        "other"
          ? analyzeTextQuality(
              activity
                .custom_activity_name,
            )
          : null;

      const reason =
        analyzeTextQuality(
          activity.reason,
        );

      /*
       * Jenis dan intensity merupakan evidence
       * terstruktur. Reason tidak diwajibkan sebagai
       * evidence bermakna.
       */
      const customNameInvalid =
        activity.activity_type ===
          "other" &&
        !customName?.accepted;

      const accepted =
        !customNameInvalid;

      const qualityScore =
        accepted
          ? round1(
              clamp(
                0.72 +
                  (
                    customName
                      ?.qualityScore ??
                    0.8
                  ) *
                    0.18 +
                  (
                    reason.accepted
                      ? reason
                          .qualityScore
                      : 0
                  ) *
                    0.1,
                0,
                1,
              ),
            )
          : 0;

      const assessment:
        EvidenceAssessment = {
        id: activity.id,
        kind: "physical",
        accepted,
        qualityScore,

        flags: mergeFlags(
          customName?.flags ?? [],

          reason.flags.map(
            (flag) =>
              `reason_${flag}`,
          ),
        ),
      };

      return duplicateAwareAssessment(
        assessment,

        createDuplicateKey(
          activity.activity_type,
          activity
            .custom_activity_name,
          activity.intensity,
        ),

        seenKeys,
      );
    },
  );
}

function assessProductiveActivities(
  input: CanonicalRatingInput,
): EvidenceAssessment[] {
  const seenKeys =
    new Set<string>();

  return input.productiveActivities.map(
    (activity) => {
      const title =
        analyzeTextQuality(
          activity.title,
        );

      const description =
        analyzeTextQuality(
          activity.description,
        );

      const combined =
        analyzeTextQuality(
          [
            activity.category,
            activity.title,
            activity.description,
          ].join(" "),
        );

      const hardRejected =
        [
          ...title.flags,
          ...description.flags,
        ].some((flag) =>
          [
            "prompt_injection",
            "keyboard_mash",
            "random_text",
            "placeholder_text",
            "symbol_heavy",
            "excessive_repetition",
            "repeated_characters",
            "unsupported_self_assessment",
          ].includes(flag),
        );

      const qualityScore =
        round1(
          clamp(
            title.qualityScore *
              0.45 +
              description
                .qualityScore *
                0.4 +
              combined.qualityScore *
                0.15,
            0,
            1,
          ),
        );

      const accepted =
        !hardRejected &&
        qualityScore >=
          TEXT_QUALITY_THRESHOLDS
            .minimumAccepted;

      const assessment:
        EvidenceAssessment = {
        id: activity.id,
        kind: "productive",
        accepted,

        qualityScore:
          accepted
            ? qualityScore
            : 0,

        flags: mergeFlags(
          title.flags.map(
            (flag) =>
              `title_${flag}`,
          ),

          description.flags.map(
            (flag) =>
              `description_${flag}`,
          ),
        ),
      };

      return duplicateAwareAssessment(
        assessment,

        createDuplicateKey(
          activity.category,
          activity.title,
          activity.description,
        ),

        seenKeys,
      );
    },
  );
}

function assessResponsibilities(
  input: CanonicalRatingInput,
): EvidenceAssessment[] {
  const seenKeys =
    new Set<string>();

  return input.responsibilities.map(
    (responsibility) => {
      const description =
        analyzeTextQuality(
          responsibility.description,
        );

      const accepted =
        description.accepted;

      const qualityScore =
        accepted
          ? round1(
              clamp(
                0.4 +
                  description
                    .qualityScore *
                    0.6,
                0,
                1,
              ),
            )
          : 0;

      const assessment:
        EvidenceAssessment = {
        id: responsibility.id,
        kind: "responsibility",
        accepted,
        qualityScore,
        flags: description.flags,
      };

      return duplicateAwareAssessment(
        assessment,

        createDuplicateKey(
          responsibility.category,
          responsibility.description,
          responsibility
            .execution_status,
          responsibility.importance,
        ),

        seenKeys,
      );
    },
  );
}

function assessOtherActivities(
  input: CanonicalRatingInput,
): EvidenceAssessment[] {
  const seenKeys =
    new Set<string>();

  return input.otherActivities.map(
    (activity) => {
      const description =
        analyzeTextQuality(
          activity.description,
        );

      const accepted =
        description.accepted &&
        description.qualityScore >=
          TEXT_QUALITY_THRESHOLDS
            .minimumOtherActivity;

      const assessment:
        EvidenceAssessment = {
        id: activity.id,
        kind: "other",
        accepted,

        qualityScore:
          accepted
            ? description
                .qualityScore
            : 0,

        flags: description.flags,
      };

      return duplicateAwareAssessment(
        assessment,

        createDuplicateKey(
          activity.description,
          activity
            .classified_attribute,
        ),

        seenKeys,
      );
    },
  );
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

function acceptedIdSet(
  assessments: EvidenceAssessment[],
): Set<string> {
  return new Set(
    assessments
      .filter(
        (assessment) =>
          assessment.accepted,
      )
      .map(
        (assessment) =>
          assessment.id,
      ),
  );
}

function calculateClaimedDurationMinutes(
  input: CanonicalRatingInput,

  physical:
    EvidenceAssessment[],

  productive:
    EvidenceAssessment[],

  responsibilities:
    EvidenceAssessment[],

  other:
    EvidenceAssessment[],

  sleepAccepted: boolean,
): number {
  let totalMinutes =
    sleepAccepted
      ? input.sleepEntry
          ?.duration_minutes ?? 0
      : 0;

  const physicalIds =
    acceptedIdSet(physical);

  const productiveIds =
    acceptedIdSet(productive);

  const responsibilityIds =
    acceptedIdSet(
      responsibilities,
    );

  const otherIds =
    acceptedIdSet(other);

  for (
    const activity of
    input.physicalActivities
  ) {
    if (
      !physicalIds.has(
        activity.id,
      )
    ) {
      continue;
    }

    totalMinutes +=
      extractClaimedDurationMinutes(
        [
          activity
            .custom_activity_name,
          activity.reason,
        ]
          .filter(Boolean)
          .join(" "),
      );
  }

  for (
    const activity of
    input.productiveActivities
  ) {
    if (
      !productiveIds.has(
        activity.id,
      )
    ) {
      continue;
    }

    totalMinutes +=
      extractClaimedDurationMinutes(
        [
          activity.title,
          activity.description,
        ].join(" "),
      );
  }

  for (
    const responsibility of
    input.responsibilities
  ) {
    if (
      !responsibilityIds.has(
        responsibility.id,
      )
    ) {
      continue;
    }

    totalMinutes +=
      extractClaimedDurationMinutes(
        responsibility.description,
      );
  }

  for (
    const activity of
    input.otherActivities
  ) {
    if (
      !otherIds.has(
        activity.id,
      )
    ) {
      continue;
    }

    totalMinutes +=
      extractClaimedDurationMinutes(
        activity.description,
      );
  }

  return totalMinutes;
}

export function analyzeInputIntegrity(
  input: CanonicalRatingInput,
): InputIntegrityResult {
  const sleepAccepted =
    Boolean(
      input.sleepEntry &&
        input.sleepEntry
          .duration_minutes > 0 &&
        input.sleepEntry
          .duration_minutes <=
          1440,
    );

  const physical =
    assessPhysicalActivities(input);

  const productive =
    assessProductiveActivities(input);

  const responsibilities =
    assessResponsibilities(input);

  const other =
    assessOtherActivities(input);

  const allAssessments = [
    ...physical,
    ...productive,
    ...responsibilities,
    ...other,
  ];

  const rawInputCount =
    (input.sleepEntry ? 1 : 0) +
    allAssessments.length;

  const acceptedAssessments =
    allAssessments.filter(
      (assessment) =>
        assessment.accepted,
    );

  const rejectedEvidenceCount =
    allAssessments.length -
      acceptedAssessments.length +
    (
      input.sleepEntry &&
      !sleepAccepted
        ? 1
        : 0
    );

  const duplicateEvidenceCount =
    allAssessments.filter(
      (assessment) =>
        assessment.flags.includes(
          "duplicate_evidence",
        ),
    ).length;

  const acceptedEvidenceCount =
    acceptedAssessments.length +
    (sleepAccepted ? 1 : 0);

  const qualityValues = [
    ...acceptedAssessments.map(
      (assessment) =>
        assessment.qualityScore,
    ),

    ...(sleepAccepted
      ? [0.9]
      : []),
  ];

  const averageEvidenceQuality =
    round1(
      clamp(
        average(qualityValues),
        0,
        1,
      ),
    );

  const acceptanceRatio =
    rawInputCount === 0
      ? 0
      : round1(
          clamp(
            acceptedEvidenceCount /
              rawInputCount,
            0,
            1,
          ),
        );

  const meaningfulTextEvidenceCount =
    acceptedAssessments.filter(
      (assessment) =>
        assessment.kind !==
          "physical" ||
        assessment.qualityScore >=
          0.75,
    ).length;

  const claimedDurationMinutes =
    calculateClaimedDurationMinutes(
      input,
      physical,
      productive,
      responsibilities,
      other,
      sleepAccepted,
    );

  const timePlausibilityConflict =
    claimedDurationMinutes > 1440;

  const validationFlags: string[] = [
    INPUT_INTEGRITY_RULESET_VERSION,
  ];

  if (rejectedEvidenceCount > 0) {
    validationFlags.push(
      `integrity_rejected_evidence_${rejectedEvidenceCount}`,
    );
  }

  if (duplicateEvidenceCount > 0) {
    validationFlags.push(
      `integrity_duplicate_evidence_${duplicateEvidenceCount}`,
    );
  }

  const aggregateFlags =
    new Set(
      allAssessments.flatMap(
        (assessment) =>
          assessment.flags,
      ),
    );

  for (const flag of aggregateFlags) {
    validationFlags.push(
      `integrity_${flag}`,
    );
  }

  if (
    rawInputCount > 0 &&
    acceptedEvidenceCount === 0
  ) {
    validationFlags.push(
      "integrity_all_inputs_rejected",
    );
  }

  if (timePlausibilityConflict) {
    validationFlags.push(
      "time_plausibility_conflict",
    );

    validationFlags.push(
      `claimed_duration_minutes_${claimedDurationMinutes}`,
    );
  }

  const aiEligible =
    acceptedEvidenceCount > 0 &&
    meaningfulTextEvidenceCount > 0 &&
    averageEvidenceQuality >=
      TEXT_QUALITY_THRESHOLDS
        .minimumAiEligibleAverage &&
    !aggregateFlags.has(
      "prompt_injection",
    ) &&
    !timePlausibilityConflict;

  if (
    !aiEligible &&
    rawInputCount > 0
  ) {
    validationFlags.push(
      "integrity_ai_not_eligible",
    );
  }

  return {
    sleepAccepted,
    physical,
    productive,
    responsibilities,
    other,

    metrics: {
      rawInputCount,
      acceptedEvidenceCount,
      rejectedEvidenceCount,
      duplicateEvidenceCount,
      meaningfulTextEvidenceCount,
      averageEvidenceQuality,
      acceptanceRatio,
      claimedDurationMinutes,
      timePlausibilityConflict,
    },

    aiEligible,
    validationFlags,
  };
}
