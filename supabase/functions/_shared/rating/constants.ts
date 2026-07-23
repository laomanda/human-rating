export const LOGIC_RULESET_VERSION =
  "humob-logic-v1.0.0";

/*
 * Primary AI provider.
 *
 * llama-3.3-70b-versatile is being retired,
 * therefore HuMob uses GPT-OSS 120B.
 */
export const PRIMARY_AI_PROVIDER = "groq";

export const PRIMARY_AI_MODEL =
  "openai/gpt-oss-120b";

export const PRIMARY_AI_ENDPOINT =
  "https://api.groq.com/openai/v1/chat/completions";

export const AI_REQUEST_TIMEOUT_MS = 20_000;

export const PRIMARY_AI_MAX_ATTEMPTS = 2;
export const BACKUP_AI_MAX_ATTEMPTS = 2;

export const PROCESSING_STALE_AFTER_MS =
  10 * 60 * 1000;

export const RETRYABLE_HTTP_STATUSES =
  new Set<number>([
    408,
    409,
    425,
    429,
    500,
    502,
    503,
    504,
  ]);

export const FINALIZABLE_MATCH_STATUSES = [
  "open",
  "locked",
  "queued",
  "failed",
] as const;

/*
 * Initial deterministic HuMob ruleset.
 *
 * These constants are versioned through:
 * LOGIC_RULESET_VERSION.
 */
export const SLEEP_QUALITY_ADJUSTMENT = {
  poor: -2.0,
  fair: -0.8,
  good: 0.0,
  very_good: 0.5,
} as const;

export const PHYSICAL_INTENSITY_SCORE = {
  light: 6.0,
  moderate: 7.8,
  heavy: 9.0,
} as const;

export const RESPONSIBILITY_EXECUTION_SCORE = {
  completed: 10.0,
  partially_completed: 6.0,
  not_completed: 0.0,
} as const;

export const RESPONSIBILITY_IMPORTANCE_WEIGHT = {
  low: 1.0,
  normal: 1.25,
  important: 1.5,
  very_important: 2.0,
} as const;