import {
  decideRatingQueueTransition,
  MAX_RATING_QUEUE_BATCH_SIZE,
  processRatingQueueBatch,
  RATING_QUEUE_UPDATE_CONCURRENCY,
  validateRatingQueueOptions,
} from "./rating-queue.ts";

import type {
  RatingQueueCandidate,
  RatingQueueDependencies,
  RatingQueueItemResult,
} from "./rating-queue.ts";

function assert(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEquals<T>(
  actual: T,
  expected: T,
  message: string,
): void {
  const actualJson = JSON.stringify(actual);

  const expectedJson = JSON.stringify(expected);

  if (
    actualJson !==
      expectedJson
  ) {
    throw new Error(
      [
        message,

        `Expected: ${expectedJson}`,
        `Actual: ${actualJson}`,
      ].join("\n"),
    );
  }
}

function candidate(
  index: number,
  status: RatingQueueCandidate["status"] = "open",
  overrides: Partial<
    RatingQueueCandidate
  > = {},
): RatingQueueCandidate {
  return {
    dailyMatchId: `00000000-0000-4000-8000-${
      String(index).padStart(
        12,
        "0",
      )
    }`,

    status,

    inputClosesAt: "2026-07-28T16:45:00.000Z",

    ratingQueuesAt: "2026-07-28T16:55:00.000Z",

    lockedAt: status === "locked" ? "2026-07-28T16:45:00.000Z" : null,

    queuedAt: null,

    ...overrides,
  };
}

function resultFor(
  item: RatingQueueCandidate,
  status: RatingQueueItemResult["status"],
  code: string | null = null,
): RatingQueueItemResult {
  return {
    dailyMatchId: item.dailyMatchId,

    previousStatus: item.status,

    status,
    code,
  };
}

function dependencies(
  candidates: RatingQueueCandidate[],
  transitionCandidate: RatingQueueDependencies[
    "transitionCandidate"
  ] = (
    {
      candidate: queueCandidate,
      nowIso,
    },
  ) => {
    const target = decideRatingQueueTransition(
      queueCandidate,
      new Date(nowIso),
    );

    return Promise.resolve(
      resultFor(
        queueCandidate,
        target ??
          "skipped",
        target === null ? "QUEUE_NOT_DUE" : null,
      ),
    );
  },
): RatingQueueDependencies {
  return {
    now: () =>
      new Date(
        "2026-07-28T17:00:00.000Z",
      ),

    loadCandidates: () =>
      Promise.resolve(
        candidates,
      ),

    transitionCandidate,
  };
}

Deno.test(
  "open match remains unchanged before input deadline",
  () => {
    const target = decideRatingQueueTransition(
      candidate(1),
      new Date(
        "2026-07-28T16:44:00.000Z",
      ),
    );

    assertEquals(
      target,
      null,
      "Open match must remain open before input_closes_at.",
    );
  },
);

Deno.test(
  "open match becomes locked after input deadline",
  () => {
    const target = decideRatingQueueTransition(
      candidate(1),
      new Date(
        "2026-07-28T16:46:00.000Z",
      ),
    );

    assertEquals(
      target,
      "locked",
      "Open match must become locked after input_closes_at.",
    );
  },
);

Deno.test(
  "open match can move directly to queued when scheduler is late",
  () => {
    const target = decideRatingQueueTransition(
      candidate(1),
      new Date(
        "2026-07-28T16:56:00.000Z",
      ),
    );

    assertEquals(
      target,
      "queued",
      "Late scheduler must queue an eligible open match directly.",
    );
  },
);

Deno.test(
  "locked match remains locked before rating queue time",
  () => {
    const target = decideRatingQueueTransition(
      candidate(
        1,
        "locked",
      ),
      new Date(
        "2026-07-28T16:54:00.000Z",
      ),
    );

    assertEquals(
      target,
      null,
      "Locked match must wait for rating_queues_at.",
    );
  },
);

Deno.test(
  "locked match becomes queued after rating queue time",
  () => {
    const target = decideRatingQueueTransition(
      candidate(
        1,
        "locked",
      ),
      new Date(
        "2026-07-28T16:55:00.000Z",
      ),
    );

    assertEquals(
      target,
      "queued",
      "Locked match must become queued at rating_queues_at.",
    );
  },
);

Deno.test(
  "rejects batch size below minimum",
  () => {
    let rejected = false;

    try {
      validateRatingQueueOptions({
        batchSize: 0,
      });
    } catch {
      rejected = true;
    }

    assert(
      rejected,
      "batchSize 0 must be rejected.",
    );
  },
);

Deno.test(
  "rejects batch size above maximum",
  () => {
    let rejected = false;

    try {
      validateRatingQueueOptions({
        batchSize: MAX_RATING_QUEUE_BATCH_SIZE +
          1,
      });
    } catch {
      rejected = true;
    }

    assert(
      rejected,
      "Oversized batch must be rejected.",
    );
  },
);

Deno.test(
  "returns empty summary when no candidate exists",
  async () => {
    const output = await processRatingQueueBatch(
      {
        batchSize: 20,
      },
      dependencies([]),
    );

    assertEquals(
      {
        candidatesFound: output.batch
          .candidatesFound,

        attempted: output.batch
          .attempted,

        locked: output.batch.locked,

        queued: output.batch.queued,

        skipped: output.batch.skipped,

        failed: output.batch.failed,

        hasMore: output.batch.hasMore,

        results: output.results,
      },
      {
        candidatesFound: 0,
        attempted: 0,
        locked: 0,
        queued: 0,
        skipped: 0,
        failed: 0,
        hasMore: false,
        results: [],
      },
      "Empty queue summary is incorrect.",
    );
  },
);

Deno.test(
  "requests batch size plus one candidate",
  async () => {
    let requestedLimit = 0;

    const queueDependencies: RatingQueueDependencies = {
      now: () =>
        new Date(
          "2026-07-28T17:00:00.000Z",
        ),

      loadCandidates: (
        {
          limit,
        },
      ) => {
        requestedLimit = limit;

        return Promise.resolve(
          [
            candidate(1),
            candidate(2),
            candidate(3),
          ],
        );
      },

      transitionCandidate: (
        {
          candidate: queueCandidate,
        },
      ) =>
        Promise.resolve(
          resultFor(
            queueCandidate,
            "queued",
          ),
        ),
    };

    const output = await processRatingQueueBatch(
      {
        batchSize: 2,
      },
      queueDependencies,
    );

    assert(
      requestedLimit === 3,
      "Worker must request batchSize + 1.",
    );

    assert(
      output.batch.hasMore,
      "hasMore must be true.",
    );

    assert(
      output.results.length === 2,
      "Worker must respect batchSize.",
    );
  },
);

Deno.test(
  "preserves candidate processing order",
  async () => {
    const candidates = [
      candidate(1),
      candidate(2),
      candidate(3),
    ];

    const output = await processRatingQueueBatch(
      {
        batchSize: 3,
      },
      dependencies(
        candidates,
        async (
          {
            candidate: queueCandidate,
          },
        ) => {
          const suffix = Number(
            queueCandidate
              .dailyMatchId
              .slice(-1),
          );

          await new Promise<void>(
            (
              resolve,
            ) =>
              setTimeout(
                resolve,
                (
                  4 -
                  suffix
                ) * 3,
              ),
          );

          return resultFor(
            queueCandidate,
            "queued",
          );
        },
      ),
    );

    assertEquals(
      output.results.map(
        (item) => item.dailyMatchId,
      ),
      candidates.map(
        (item) => item.dailyMatchId,
      ),
      "Results must follow candidate order.",
    );
  },
);

Deno.test(
  "counts locked queued skipped and failed transitions",
  async () => {
    const candidates = [
      candidate(1),
      candidate(2),
      candidate(3),
      candidate(4),
    ];

    const output = await processRatingQueueBatch(
      {
        batchSize: 4,
      },
      dependencies(
        candidates,
        (
          {
            candidate: queueCandidate,
          },
        ) => {
          const index = Number(
            queueCandidate
              .dailyMatchId
              .slice(-1),
          );

          if (index === 1) {
            return Promise.resolve(
              resultFor(
                queueCandidate,
                "locked",
              ),
            );
          }

          if (index === 2) {
            return Promise.resolve(
              resultFor(
                queueCandidate,
                "queued",
              ),
            );
          }

          if (index === 3) {
            return Promise.resolve(
              resultFor(
                queueCandidate,
                "skipped",
                "QUEUE_TRANSITION_CONFLICT",
              ),
            );
          }

          return Promise.resolve(
            resultFor(
              queueCandidate,
              "failed",
              "QUEUE_UPDATE_FAILED",
            ),
          );
        },
      ),
    );

    assertEquals(
      {
        attempted: output.batch
          .attempted,

        locked: output.batch.locked,

        queued: output.batch.queued,

        skipped: output.batch.skipped,

        failed: output.batch.failed,
      },
      {
        attempted: 4,
        locked: 1,
        queued: 1,
        skipped: 1,
        failed: 1,
      },
      "Queue counters are incorrect.",
    );
  },
);

Deno.test(
  "one transition failure does not stop the batch",
  async () => {
    const failedCandidate = candidate(2);

    const output = await processRatingQueueBatch(
      {
        batchSize: 3,
      },
      dependencies(
        [
          candidate(1),
          failedCandidate,
          candidate(3),
        ],
        (
          {
            candidate: queueCandidate,
          },
        ) => {
          if (
            queueCandidate
              .dailyMatchId ===
              failedCandidate
                .dailyMatchId
          ) {
            throw new Error(
              "internal secret must not escape",
            );
          }

          return Promise.resolve(
            resultFor(
              queueCandidate,
              "queued",
            ),
          );
        },
      ),
    );

    assert(
      output.batch.queued === 2,
      "Two candidates must still be queued.",
    );

    assert(
      output.batch.failed === 1,
      "Thrown transition must be counted as failed.",
    );

    assert(
      output.results[1]
        ?.code ===
        "QUEUE_ITEM_FAILED",
      "Thrown transition must use a safe error code.",
    );

    assert(
      !JSON.stringify(
        output,
      ).includes(
        "internal secret",
      ),
      "Raw thrown messages must not leak.",
    );
  },
);

Deno.test(
  "does not exceed internal update concurrency",
  async () => {
    let active = 0;
    let maximumActive = 0;

    const candidates = Array.from(
      {
        length: 25,
      },
      (
        _value,
        index,
      ) =>
        candidate(
          index + 1,
        ),
    );

    await processRatingQueueBatch(
      {
        batchSize: 25,
      },
      dependencies(
        candidates,
        async (
          {
            candidate: queueCandidate,
          },
        ) => {
          active += 1;

          maximumActive = Math.max(
            maximumActive,
            active,
          );

          await new Promise<void>(
            (
              resolve,
            ) =>
              setTimeout(
                resolve,
                5,
              ),
          );

          active -= 1;

          return resultFor(
            queueCandidate,
            "queued",
          );
        },
      ),
    );

    assert(
      maximumActive <=
        RATING_QUEUE_UPDATE_CONCURRENCY,
      `Maximum concurrency exceeded: ${maximumActive}.`,
    );
  },
);

Deno.test(
  "passes a stable ISO timestamp to queue dependencies",
  async () => {
    let loadedNowIso: string | null = null;

    let transitionedNowIso: string | null = null;

    const queueCandidate = candidate(1);

    await processRatingQueueBatch(
      {
        batchSize: 1,
      },
      {
        now: () =>
          new Date(
            "2026-07-28T17:00:00.000Z",
          ),

        loadCandidates: (
          {
            nowIso,
          },
        ) => {
          loadedNowIso = nowIso;

          return Promise.resolve(
            [
              queueCandidate,
            ],
          );
        },

        transitionCandidate: (
          {
            nowIso,
          },
        ) => {
          transitionedNowIso = nowIso;

          return Promise.resolve(
            resultFor(
              queueCandidate,
              "queued",
            ),
          );
        },
      },
    );

    assert(
      loadedNowIso ===
        "2026-07-28T17:00:00.000Z",
      "Candidate query received the wrong timestamp.",
    );

    assert(
      transitionedNowIso ===
        loadedNowIso,
      "Queue transition must use the same batch timestamp.",
    );
  },
);

Deno.test(
  "batch result never exposes dependency error content",
  async () => {
    const output = await processRatingQueueBatch(
      {
        batchSize: 1,
      },
      dependencies(
        [
          candidate(1),
        ],
        () => {
          throw new Error(
            "HUMOB_RATING_JOB_SECRET=private-value",
          );
        },
      ),
    );

    const serialized = JSON.stringify(output);

    assert(
      !serialized.includes(
        "private-value",
      ),
      "Secret-like dependency content must not be returned.",
    );

    assert(
      serialized.includes(
        "QUEUE_ITEM_FAILED",
      ),
      "Safe generic error code is required.",
    );
  },
);
