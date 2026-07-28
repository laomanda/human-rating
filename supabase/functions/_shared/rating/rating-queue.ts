import type { DatabaseClient } from "./types.ts";

import { HttpError, isUuid } from "./utils.ts";

export const DEFAULT_RATING_QUEUE_BATCH_SIZE = 20;

export const MAX_RATING_QUEUE_BATCH_SIZE = 100;

export const RATING_QUEUE_UPDATE_CONCURRENCY = 10;

export type RatingQueueCandidateStatus =
  | "open"
  | "locked";

export type RatingQueueTransitionStatus =
  | "locked"
  | "queued"
  | "skipped"
  | "failed";

export type RatingQueueCandidate = {
  dailyMatchId: string;

  status: RatingQueueCandidateStatus;

  inputClosesAt: string;
  ratingQueuesAt: string;

  lockedAt: string | null;
  queuedAt: string | null;
};

export type RatingQueueTransitionTarget =
  | "locked"
  | "queued"
  | null;

export type RatingQueueItemResult = {
  dailyMatchId: string;

  previousStatus: RatingQueueCandidateStatus;

  status: RatingQueueTransitionStatus;

  code: string | null;
};

export type RatingQueueOptions = {
  batchSize: number;
};

export type LoadRatingQueueCandidatesInput = {
  limit: number;
  nowIso: string;
};

export type TransitionRatingQueueCandidateInput = {
  candidate: RatingQueueCandidate;

  nowIso: string;
};

export type RatingQueueDependencies = {
  loadCandidates: (
    input: LoadRatingQueueCandidatesInput,
  ) => Promise<
    RatingQueueCandidate[]
  >;

  transitionCandidate: (
    input: TransitionRatingQueueCandidateInput,
  ) => Promise<
    RatingQueueItemResult
  >;

  now?: () => Date;
};

export type RatingQueueBatchSummary = {
  requested: number;
  candidatesFound: number;
  attempted: number;

  locked: number;
  queued: number;
  skipped: number;
  failed: number;

  hasMore: boolean;
  durationMs: number;
};

export type RatingQueueRunResult = {
  batch: RatingQueueBatchSummary;

  results: RatingQueueItemResult[];
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

function isCandidateStatus(
  value: unknown,
): value is RatingQueueCandidateStatus {
  return (
    value === "open" ||
    value === "locked"
  );
}

function parseTimestamp(
  value: string,
): number | null {
  const timestamp = Date.parse(value);

  return Number.isFinite(timestamp) ? timestamp : null;
}

function readNullableString(
  value: unknown,
): string | null {
  return typeof value === "string" ? value : null;
}

function normalizeCandidate(
  row: unknown,
): RatingQueueCandidate {
  if (!isRecord(row)) {
    throw new HttpError(
      500,
      "QUEUE_INVALID_CANDIDATE",
      "The rating queue returned an invalid database row.",
    );
  }

  const id = row.id;

  const status = row.status;

  const inputClosesAt = row.input_closes_at;

  const ratingQueuesAt = row.rating_queues_at;

  if (
    !isUuid(id) ||
    !isCandidateStatus(status) ||
    typeof inputClosesAt !== "string" ||
    typeof ratingQueuesAt !== "string" ||
    parseTimestamp(inputClosesAt) === null ||
    parseTimestamp(ratingQueuesAt) === null
  ) {
    throw new HttpError(
      500,
      "QUEUE_INVALID_CANDIDATE",
      "The rating queue returned invalid Daily Match fields.",
    );
  }

  return {
    dailyMatchId: id,
    status,

    inputClosesAt,
    ratingQueuesAt,

    lockedAt: readNullableString(
      row.locked_at,
    ),

    queuedAt: readNullableString(
      row.queued_at,
    ),
  };
}

function actionDueAt(
  candidate: RatingQueueCandidate,
  nowTimestamp: number,
): number {
  const inputClosesAt = parseTimestamp(
    candidate.inputClosesAt,
  ) ?? Number.MAX_SAFE_INTEGER;

  const ratingQueuesAt = parseTimestamp(
    candidate.ratingQueuesAt,
  ) ?? Number.MAX_SAFE_INTEGER;

  if (
    candidate.status === "locked" ||
    nowTimestamp >= ratingQueuesAt
  ) {
    return ratingQueuesAt;
  }

  return inputClosesAt;
}

export function validateRatingQueueOptions(
  options: RatingQueueOptions,
): void {
  if (
    !Number.isInteger(
      options.batchSize,
    ) ||
    options.batchSize < 1 ||
    options.batchSize >
      MAX_RATING_QUEUE_BATCH_SIZE
  ) {
    throw new HttpError(
      400,
      "INVALID_BATCH_SIZE",
      `batchSize must be an integer from 1 to ${MAX_RATING_QUEUE_BATCH_SIZE}.`,
    );
  }
}

export function decideRatingQueueTransition(
  candidate: RatingQueueCandidate,
  now: Date,
): RatingQueueTransitionTarget {
  const nowTimestamp = now.getTime();

  const inputClosesAt = parseTimestamp(
    candidate.inputClosesAt,
  );

  const ratingQueuesAt = parseTimestamp(
    candidate.ratingQueuesAt,
  );

  if (
    Number.isNaN(nowTimestamp) ||
    inputClosesAt === null ||
    ratingQueuesAt === null
  ) {
    return null;
  }

  /*
   * A scheduler may run late. In that case an open
   * Daily Match can move directly to queued.
   */
  if (
    nowTimestamp >=
      ratingQueuesAt
  ) {
    return "queued";
  }

  if (
    candidate.status === "open" &&
    nowTimestamp >=
      inputClosesAt
  ) {
    return "locked";
  }

  return null;
}

function rowsOrEmpty(
  value: unknown,
): unknown[] {
  return Array.isArray(value) ? value : [];
}

/**
 * Loads:
 *
 * 1. open matches whose input deadline has passed;
 * 2. locked matches whose rating queue time has passed.
 *
 * Two explicit queries are used instead of one complex
 * PostgREST OR filter so timestamp filtering remains
 * clear and predictable.
 */
export async function loadRatingQueueCandidates(
  admin: DatabaseClient,
  input: LoadRatingQueueCandidatesInput,
): Promise<
  RatingQueueCandidate[]
> {
  const candidateSelect = `
    id,
    status,
    input_closes_at,
    rating_queues_at,
    locked_at,
    queued_at
  `;

  const [
    openResult,
    lockedResult,
  ] = await Promise.all([
    admin
      .from("daily_matches")
      .select(candidateSelect)
      .eq("status", "open")
      .lte(
        "input_closes_at",
        input.nowIso,
      )
      .is("rated_at", null)
      .order(
        "input_closes_at",
        {
          ascending: true,
        },
      )
      .limit(input.limit),

    admin
      .from("daily_matches")
      .select(candidateSelect)
      .eq("status", "locked")
      .lte(
        "rating_queues_at",
        input.nowIso,
      )
      .is("rated_at", null)
      .order(
        "rating_queues_at",
        {
          ascending: true,
        },
      )
      .limit(input.limit),
  ]);

  if (openResult.error) {
    console.error(
      "Open Daily Match queue query failed",
      {
        code: openResult.error.code ??
          null,

        message: openResult.error.message,
      },
    );

    throw new HttpError(
      500,
      "QUEUE_QUERY_FAILED",
      "Daily Matches ready for locking could not be loaded.",
    );
  }

  if (lockedResult.error) {
    console.error(
      "Locked Daily Match queue query failed",
      {
        code: lockedResult.error.code ??
          null,

        message: lockedResult.error.message,
      },
    );

    throw new HttpError(
      500,
      "QUEUE_QUERY_FAILED",
      "Daily Matches ready for rating could not be loaded.",
    );
  }

  const candidates = [
    ...rowsOrEmpty(
      openResult.data,
    ),

    ...rowsOrEmpty(
      lockedResult.data,
    ),
  ].map(normalizeCandidate);

  const nowTimestamp = Date.parse(input.nowIso);

  candidates.sort(
    (
      left,
      right,
    ) =>
      actionDueAt(
        left,
        nowTimestamp,
      ) -
      actionDueAt(
        right,
        nowTimestamp,
      ),
  );

  return candidates.slice(
    0,
    input.limit,
  );
}

/**
 * Uses an optimistic status condition.
 *
 * When two queue workers observe the same row, only
 * one update can succeed because the previous status
 * must still match.
 */
export async function transitionRatingQueueCandidate(
  admin: DatabaseClient,
  input: TransitionRatingQueueCandidateInput,
): Promise<
  RatingQueueItemResult
> {
  const {
    candidate,
    nowIso,
  } = input;

  const now = new Date(nowIso);

  const target = decideRatingQueueTransition(
    candidate,
    now,
  );

  if (target === null) {
    return {
      dailyMatchId: candidate.dailyMatchId,

      previousStatus: candidate.status,

      status: "skipped",

      code: "QUEUE_NOT_DUE",
    };
  }

  const lockedAt = candidate.lockedAt ??
    candidate.inputClosesAt;

  const updatePayload = target === "queued"
    ? {
      status: "queued",

      locked_at: lockedAt,

      queued_at: candidate.queuedAt ??
        nowIso,

      updated_at: nowIso,
    }
    : {
      status: "locked",

      locked_at: lockedAt,

      updated_at: nowIso,
    };

  const baseQuery = admin
    .from("daily_matches")
    .update(updatePayload)
    .eq(
      "id",
      candidate.dailyMatchId,
    )
    .eq(
      "status",
      candidate.status,
    )
    .is("rated_at", null);

  const {
    data,
    error,
  } = target === "queued"
    ? await baseQuery
      .lte(
        "rating_queues_at",
        nowIso,
      )
      .select("id, status")
      .maybeSingle()
    : await baseQuery
      .lte(
        "input_closes_at",
        nowIso,
      )
      .select("id, status")
      .maybeSingle();

  if (error) {
    console.error(
      "Daily Match queue transition failed",
      {
        dailyMatchId: candidate.dailyMatchId,

        previousStatus: candidate.status,

        target,

        code: error.code ?? null,

        message: error.message,
      },
    );

    return {
      dailyMatchId: candidate.dailyMatchId,

      previousStatus: candidate.status,

      status: "failed",

      code: "QUEUE_UPDATE_FAILED",
    };
  }

  /*
   * No row means another process changed the status
   * after this worker loaded the candidate.
   */
  if (!data) {
    return {
      dailyMatchId: candidate.dailyMatchId,

      previousStatus: candidate.status,

      status: "skipped",

      code: "QUEUE_TRANSITION_CONFLICT",
    };
  }

  if (
    !isRecord(data) ||
    data.id !==
      candidate.dailyMatchId ||
    data.status !== target
  ) {
    return {
      dailyMatchId: candidate.dailyMatchId,

      previousStatus: candidate.status,

      status: "failed",

      code: "QUEUE_INVALID_UPDATE_RESPONSE",
    };
  }

  return {
    dailyMatchId: candidate.dailyMatchId,

    previousStatus: candidate.status,

    status: target,

    code: null,
  };
}

async function runWithConcurrency(
  candidates: RatingQueueCandidate[],
  nowIso: string,
  transitionCandidate: RatingQueueDependencies[
    "transitionCandidate"
  ],
): Promise<
  RatingQueueItemResult[]
> {
  const results = new Array<
    RatingQueueItemResult
  >(candidates.length);

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

      if (!candidate) {
        return;
      }

      try {
        const result = await transitionCandidate({
          candidate,
          nowIso,
        });

        results[
          currentIndex
        ] = {
          dailyMatchId: candidate.dailyMatchId,

          previousStatus: candidate.status,

          status: result.status,

          code: result.code,
        };
      } catch {
        /*
         * Raw dependency errors must not be exposed
         * through the worker response.
         */
        results[
          currentIndex
        ] = {
          dailyMatchId: candidate.dailyMatchId,

          previousStatus: candidate.status,

          status: "failed",

          code: "QUEUE_ITEM_FAILED",
        };
      }
    }
  }

  const workerCount = Math.min(
    RATING_QUEUE_UPDATE_CONCURRENCY,
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

export async function processRatingQueueBatch(
  options: RatingQueueOptions,
  dependencies: RatingQueueDependencies,
): Promise<
  RatingQueueRunResult
> {
  validateRatingQueueOptions(
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
      "QUEUE_INVALID_CLOCK",
      "The rating queue clock returned an invalid date.",
    );
  }

  const nowIso = now.toISOString();

  /*
   * Load one extra candidate to determine hasMore
   * without running a separate count query.
   */
  const loadedCandidates = await dependencies
    .loadCandidates({
      limit: options.batchSize +
        1,

      nowIso,
    });

  const hasMore = loadedCandidates.length >
    options.batchSize;

  const candidates = loadedCandidates.slice(
    0,
    options.batchSize,
  );

  const results = candidates.length === 0 ? [] : await runWithConcurrency(
    candidates,
    nowIso,
    dependencies
      .transitionCandidate,
  );

  const locked = results.filter(
    (result) =>
      result.status ===
        "locked",
  ).length;

  const queued = results.filter(
    (result) =>
      result.status ===
        "queued",
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

      locked,
      queued,
      skipped,
      failed,

      hasMore,

      durationMs: Math.max(
        Date.now() -
          startedAt,
        0,
      ),
    },

    results,
  };
}
