import type { DatabaseClient } from "./types.ts";

import { HttpError, isUuid } from "./utils.ts";

export const DEFAULT_RATING_WORKER_BATCH_SIZE = 10;

export const MAX_RATING_WORKER_BATCH_SIZE = 20;

export const DEFAULT_RATING_WORKER_CONCURRENCY = 2;

export const MAX_RATING_WORKER_CONCURRENCY = 4;

export const DEFAULT_GENERATOR_TIMEOUT_MS = 45_000;

const SAFE_CONFLICT_CODES = new Set<string>([
  "RATING_CLAIM_CONFLICT",
  "RATING_ALREADY_PROCESSING",
  "RATING_NOT_ELIGIBLE",
  "RATING_ALREADY_EXISTS",
]);

export type RatingWorkerOptions = {
  batchSize: number;
  concurrency: number;
  useAi: boolean;
};

export type RatingWorkerCandidate = {
  dailyMatchId: string;
  ratingQueuesAt: string;
};

export type RatingWorkerItemStatus =
  | "rated"
  | "skipped"
  | "failed";

export type RatingWorkerItemResult = {
  dailyMatchId: string;

  status: RatingWorkerItemStatus;

  httpStatus:
    | number
    | null;

  code:
    | string
    | null;
};

export type RatingWorkerBatchSummary = {
  requested: number;
  candidatesFound: number;
  attempted: number;

  rated: number;
  skipped: number;
  failed: number;

  hasMore: boolean;
  useAi: boolean;
  concurrency: number;
  durationMs: number;
};

export type RatingWorkerRunResult = {
  batch: RatingWorkerBatchSummary;

  results: RatingWorkerItemResult[];
};

export type LoadRatingCandidatesInput = {
  limit: number;
  nowIso: string;
};

export type FinalizeRatingInput = {
  dailyMatchId: string;
  useAi: boolean;
};

export type RatingWorkerDependencies = {
  loadCandidates: (
    input: LoadRatingCandidatesInput,
  ) => Promise<
    RatingWorkerCandidate[]
  >;

  finalizeRating: (
    input: FinalizeRatingInput,
  ) => Promise<
    RatingWorkerItemResult
  >;

  now?: () => Date;
};

export type GeneratorCallOptions = {
  generatorUrl: string;
  jobSecret: string;

  dailyMatchId: string;
  useAi: boolean;

  timeoutMs?: number;

  fetchImpl?: typeof fetch;
};

type UnknownRecord = Record<string, unknown>;

function isRecord(
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function readNestedErrorCode(
  value: unknown,
): string | null {
  if (!isRecord(value)) {
    return null;
  }

  const error = value.error;

  if (!isRecord(error)) {
    return null;
  }

  return typeof error.code ===
      "string"
    ? error.code
    : null;
}

function isSuccessfulFinalizePayload(
  value: unknown,
): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.success === true &&
    value.action ===
      "finalize" &&
    value.persisted === true
  );
}

function validatePositiveInteger(
  value: number,
  minimum: number,
  maximum: number,
  code: string,
  fieldName: string,
): void {
  if (
    !Number.isInteger(value) ||
    value < minimum ||
    value > maximum
  ) {
    throw new HttpError(
      400,
      code,
      `${fieldName} must be an integer from ${minimum} to ${maximum}.`,
    );
  }
}

export function validateRatingWorkerOptions(
  options: RatingWorkerOptions,
): void {
  validatePositiveInteger(
    options.batchSize,
    1,
    MAX_RATING_WORKER_BATCH_SIZE,
    "INVALID_BATCH_SIZE",
    "batchSize",
  );

  validatePositiveInteger(
    options.concurrency,
    1,
    MAX_RATING_WORKER_CONCURRENCY,
    "INVALID_CONCURRENCY",
    "concurrency",
  );

  if (
    options.concurrency >
      options.batchSize
  ) {
    throw new HttpError(
      400,
      "CONCURRENCY_EXCEEDS_BATCH",
      "concurrency cannot exceed batchSize.",
    );
  }

  if (
    typeof options.useAi !==
      "boolean"
  ) {
    throw new HttpError(
      400,
      "INVALID_USE_AI",
      "useAi must be a boolean.",
    );
  }
}

function normalizeCandidate(
  row: unknown,
): RatingWorkerCandidate {
  if (!isRecord(row)) {
    throw new HttpError(
      500,
      "WORKER_INVALID_CANDIDATE",
      "A queued Daily Match returned an invalid database row.",
    );
  }

  const id = row.id;

  const ratingQueuesAt = row.rating_queues_at;

  if (
    !isUuid(id) ||
    typeof ratingQueuesAt !==
      "string" ||
    Number.isNaN(
      new Date(
        ratingQueuesAt,
      ).getTime(),
    )
  ) {
    throw new HttpError(
      500,
      "WORKER_INVALID_CANDIDATE",
      "A queued Daily Match returned invalid candidate fields.",
    );
  }

  return {
    dailyMatchId: id,
    ratingQueuesAt,
  };
}

/**
 * Load only Daily Matches that:
 *
 * - have status queued;
 * - have reached rating_queues_at;
 * - have not been marked rated.
 *
 * The worker does not update lifecycle state directly.
 * generate-ai-rating remains responsible for the
 * queued -> processing -> rated transition.
 */
export async function loadQueuedRatingCandidates(
  admin: DatabaseClient,
  input: LoadRatingCandidatesInput,
): Promise<
  RatingWorkerCandidate[]
> {
  const {
    data,
    error,
  } = await admin
    .from("daily_matches")
    .select(
      "id, rating_queues_at",
    )
    .eq(
      "status",
      "queued",
    )
    .lte(
      "rating_queues_at",
      input.nowIso,
    )
    .is(
      "rated_at",
      null,
    )
    .order(
      "rating_queues_at",
      {
        ascending: true,
      },
    )
    .limit(
      input.limit,
    );

  if (error) {
    console.error(
      "Queued Daily Match query failed",
      {
        code: error.code ?? null,

        message: error.message,
      },
    );

    throw new HttpError(
      500,
      "WORKER_QUERY_FAILED",
      "Queued Daily Matches could not be loaded.",
    );
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map(
    normalizeCandidate,
  );
}

async function readJsonSafely(
  response: Response,
): Promise<unknown> {
  const text = await response.text();

  if (
    text.trim() === ""
  ) {
    return null;
  }

  try {
    return JSON.parse(
      text,
    ) as unknown;
  } catch {
    return null;
  }
}

/**
 * Calls the canonical rating generator.
 *
 * No scoring logic exists in this worker.
 * All finalization continues through:
 *
 * generate-ai-rating
 * action = finalize
 */
export async function callRatingGenerator(
  options: GeneratorCallOptions,
): Promise<
  RatingWorkerItemResult
> {
  const fetchImpl = options.fetchImpl ??
    fetch;

  const timeoutMs = options.timeoutMs ??
    DEFAULT_GENERATOR_TIMEOUT_MS;

  const controller = new AbortController();

  const timeoutId = setTimeout(
    () => controller.abort(),
    timeoutMs,
  );

  try {
    const response = await fetchImpl(
      options.generatorUrl,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          "x-humob-job-secret": options.jobSecret,
        },

        body: JSON.stringify({
          dailyMatchId: options.dailyMatchId,

          action: "finalize",

          useAi: options.useAi,
        }),

        signal: controller.signal,
      },
    );

    const payload = await readJsonSafely(
      response,
    );

    if (
      response.ok &&
      isSuccessfulFinalizePayload(
        payload,
      )
    ) {
      return {
        dailyMatchId: options.dailyMatchId,

        status: "rated",

        httpStatus: response.status,

        code: null,
      };
    }

    const errorCode = readNestedErrorCode(
      payload,
    );

    if (
      response.status === 409 &&
      errorCode !== null &&
      SAFE_CONFLICT_CODES.has(
        errorCode,
      )
    ) {
      return {
        dailyMatchId: options.dailyMatchId,

        status: "skipped",

        httpStatus: response.status,

        code: errorCode,
      };
    }

    return {
      dailyMatchId: options.dailyMatchId,

      status: "failed",

      httpStatus: response.status,

      code: errorCode ??
        (
          response.ok
            ? "INVALID_GENERATOR_RESPONSE"
            : `GENERATOR_HTTP_${response.status}`
        ),
    };
  } catch (error) {
    const timedOut = controller.signal
      .aborted ||
      (
        error instanceof
          DOMException &&
        error.name ===
          "AbortError"
      );

    return {
      dailyMatchId: options.dailyMatchId,

      status: "failed",

      httpStatus: null,

      code: timedOut ? "GENERATOR_TIMEOUT" : "GENERATOR_NETWORK_ERROR",
    };
  } finally {
    clearTimeout(
      timeoutId,
    );
  }
}

async function runWithConcurrency(
  candidates: RatingWorkerCandidate[],
  concurrency: number,
  useAi: boolean,
  finalizeRating: RatingWorkerDependencies[
    "finalizeRating"
  ],
): Promise<
  RatingWorkerItemResult[]
> {
  const results = new Array<
    RatingWorkerItemResult
  >(
    candidates.length,
  );

  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (true) {
      const currentIndex = nextIndex;

      nextIndex += 1;

      if (
        currentIndex >=
          candidates.length
      ) {
        return;
      }

      const candidate = candidates[
        currentIndex
      ];

      try {
        const result = await finalizeRating({
          dailyMatchId: candidate
            .dailyMatchId,

          useAi,
        });

        /*
         * The candidate ID remains canonical.
         * A malformed dependency result cannot replace it.
         */
        results[
          currentIndex
        ] = {
          dailyMatchId: candidate
            .dailyMatchId,

          status: result.status,

          httpStatus: result.httpStatus,

          code: result.code,
        };
      } catch {
        /*
         * Do not expose dependency errors,
         * provider messages, or secrets.
         */
        results[
          currentIndex
        ] = {
          dailyMatchId: candidate
            .dailyMatchId,

          status: "failed",

          httpStatus: null,

          code: "WORKER_ITEM_FAILED",
        };
      }
    }
  }

  const workerCount = Math.min(
    concurrency,
    candidates.length,
  );

  await Promise.all(
    Array.from(
      {
        length: workerCount,
      },
      () => worker(),
    ),
  );

  return results;
}

export async function processDailyRatingBatch(
  options: RatingWorkerOptions,
  dependencies: RatingWorkerDependencies,
): Promise<
  RatingWorkerRunResult
> {
  validateRatingWorkerOptions(
    options,
  );

  const startedAt = Date.now();

  const now = dependencies.now?.() ??
    new Date();

  if (
    Number.isNaN(
      now.getTime(),
    )
  ) {
    throw new HttpError(
      500,
      "WORKER_INVALID_CLOCK",
      "The worker clock returned an invalid date.",
    );
  }

  /*
   * Request one additional candidate so hasMore
   * can be determined without a second DB query.
   */
  const loadedCandidates = await dependencies
    .loadCandidates({
      limit: options.batchSize +
        1,

      nowIso: now.toISOString(),
    });

  const hasMore = loadedCandidates.length >
    options.batchSize;

  const candidates = loadedCandidates.slice(
    0,
    options.batchSize,
  );

  const results = candidates.length === 0 ? [] : await runWithConcurrency(
    candidates,
    options.concurrency,
    options.useAi,
    dependencies
      .finalizeRating,
  );

  const rated = results.filter(
    (result) =>
      result.status ===
        "rated",
  ).length;

  const skipped = results.filter(
    (result) =>
      result.status ===
        "skipped",
  ).length;

  const failed = results.filter(
    (result) =>
      result.status ===
        "failed",
  ).length;

  return {
    batch: {
      requested: options.batchSize,

      candidatesFound: candidates.length,

      attempted: results.length,

      rated,
      skipped,
      failed,

      hasMore,

      useAi: options.useAi,

      concurrency: options.concurrency,

      durationMs: Math.max(
        Date.now() -
          startedAt,
        0,
      ),
    },

    results,
  };
}
