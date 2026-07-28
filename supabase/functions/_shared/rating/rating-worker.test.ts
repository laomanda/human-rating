import {
  callRatingGenerator,
  MAX_RATING_WORKER_BATCH_SIZE,
  processDailyRatingBatch,
  validateRatingWorkerOptions,
} from "./rating-worker.ts";

import type {
  RatingWorkerCandidate,
  RatingWorkerDependencies,
  RatingWorkerItemResult,
} from "./rating-worker.ts";

function assert(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(
      message,
    );
  }
}

function assertEquals<T>(
  actual: T,
  expected: T,
  message: string,
): void {
  const actualJson = JSON.stringify(
    actual,
  );

  const expectedJson = JSON.stringify(
    expected,
  );

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
): RatingWorkerCandidate {
  return {
    dailyMatchId: `00000000-0000-4000-8000-${
      String(index).padStart(
        12,
        "0",
      )
    }`,

    ratingQueuesAt: "2026-07-28T08:00:00.000Z",
  };
}

function ratedResult(
  dailyMatchId: string,
): RatingWorkerItemResult {
  return {
    dailyMatchId,

    status: "rated",

    httpStatus: 200,

    code: null,
  };
}

function dependencies(
  candidates: RatingWorkerCandidate[],
  finalizeRating: RatingWorkerDependencies[
    "finalizeRating"
  ] = (
    {
      dailyMatchId,
    },
  ) =>
    Promise.resolve(
      ratedResult(
        dailyMatchId,
      ),
    ),
): RatingWorkerDependencies {
  return {
    now: () =>
      new Date(
        "2026-07-28T09:00:00.000Z",
      ),

    loadCandidates: () =>
      Promise.resolve(
        candidates,
      ),

    finalizeRating,
  };
}

Deno.test(
  "returns empty batch when no candidate exists",
  async () => {
    const result = await processDailyRatingBatch(
      {
        batchSize: 10,
        concurrency: 2,
        useAi: true,
      },
      dependencies([]),
    );

    assertEquals(
      {
        candidatesFound: result.batch
          .candidatesFound,

        attempted: result.batch
          .attempted,

        rated: result.batch.rated,

        skipped: result.batch.skipped,

        failed: result.batch.failed,

        hasMore: result.batch.hasMore,

        results: result.results,
      },
      {
        candidatesFound: 0,
        attempted: 0,

        rated: 0,
        skipped: 0,
        failed: 0,

        hasMore: false,

        results: [],
      },
      "Empty batch summary is incorrect.",
    );
  },
);

Deno.test(
  "requests batchSize plus one candidate",
  async () => {
    let requestedLimit = 0;

    const deps: RatingWorkerDependencies = {
      now: () =>
        new Date(
          "2026-07-28T09:00:00.000Z",
        ),

      loadCandidates: (
        {
          limit,
        },
      ) => {
        requestedLimit = limit;

        return Promise.resolve(
          Array.from(
            {
              length: 4,
            },
            (
              _value,
              index,
            ) =>
              candidate(
                index + 1,
              ),
          ),
        );
      },

      finalizeRating: (
        {
          dailyMatchId,
        },
      ) =>
        Promise.resolve(
          ratedResult(
            dailyMatchId,
          ),
        ),
    };

    const result = await processDailyRatingBatch(
      {
        batchSize: 3,
        concurrency: 2,
        useAi: true,
      },
      deps,
    );

    assert(
      requestedLimit === 4,
      "Worker must request batchSize + 1 candidates.",
    );

    assert(
      result.batch.hasMore,
      "hasMore must be true when an additional candidate exists.",
    );

    assert(
      result.results.length === 3,
      "Worker must not attempt more than batchSize.",
    );
  },
);

Deno.test(
  "preserves candidate result order",
  async () => {
    const items = [
      candidate(1),
      candidate(2),
      candidate(3),
    ];

    const result = await processDailyRatingBatch(
      {
        batchSize: 3,
        concurrency: 3,
        useAi: true,
      },
      dependencies(
        items,
        async (
          {
            dailyMatchId,
          },
        ) => {
          const suffix = Number(
            dailyMatchId.slice(
              -1,
            ),
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
                ) * 5,
              ),
          );

          return ratedResult(
            dailyMatchId,
          );
        },
      ),
    );

    assertEquals(
      result.results.map(
        (item) => item.dailyMatchId,
      ),
      items.map(
        (item) => item.dailyMatchId,
      ),
      "Result order must follow queue order.",
    );
  },
);

Deno.test(
  "passes useAi to every finalize request",
  async () => {
    const received: boolean[] = [];

    await processDailyRatingBatch(
      {
        batchSize: 2,
        concurrency: 1,
        useAi: false,
      },
      dependencies(
        [
          candidate(1),
          candidate(2),
        ],
        (
          {
            dailyMatchId,
            useAi,
          },
        ) => {
          received.push(
            useAi,
          );

          return Promise.resolve(
            ratedResult(
              dailyMatchId,
            ),
          );
        },
      ),
    );

    assertEquals(
      received,
      [
        false,
        false,
      ],
      "useAi must be forwarded unchanged.",
    );
  },
);

Deno.test(
  "does not exceed configured concurrency",
  async () => {
    let active = 0;
    let maximumActive = 0;

    await processDailyRatingBatch(
      {
        batchSize: 6,
        concurrency: 2,
        useAi: true,
      },
      dependencies(
        Array.from(
          {
            length: 6,
          },
          (
            _value,
            index,
          ) =>
            candidate(
              index + 1,
            ),
        ),
        async (
          {
            dailyMatchId,
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

          return ratedResult(
            dailyMatchId,
          );
        },
      ),
    );

    assert(
      maximumActive <= 2,
      `Expected maximum concurrency 2, received ${maximumActive}.`,
    );
  },
);

Deno.test(
  "continues processing after one item throws",
  async () => {
    const failedCandidate = candidate(2);

    const result = await processDailyRatingBatch(
      {
        batchSize: 3,
        concurrency: 2,
        useAi: true,
      },
      dependencies(
        [
          candidate(1),
          failedCandidate,
          candidate(3),
        ],
        (
          {
            dailyMatchId,
          },
        ) => {
          if (
            dailyMatchId ===
              failedCandidate
                .dailyMatchId
          ) {
            throw new Error(
              "private secret must not escape",
            );
          }

          return Promise.resolve(
            ratedResult(
              dailyMatchId,
            ),
          );
        },
      ),
    );

    assert(
      result.batch.rated ===
        2,
      "Two valid items must still be rated.",
    );

    assert(
      result.batch.failed ===
        1,
      "One thrown item must be counted as failed.",
    );

    assert(
      result.results[1]
        .code ===
        "WORKER_ITEM_FAILED",
      "Thrown item must use a safe generic code.",
    );

    assert(
      !JSON.stringify(
        result,
      ).includes(
        "private secret",
      ),
      "Thrown error message must not leak into output.",
    );
  },
);

Deno.test(
  "counts rated skipped and failed results",
  async () => {
    const items = [
      candidate(1),
      candidate(2),
      candidate(3),
    ];

    const result = await processDailyRatingBatch(
      {
        batchSize: 3,
        concurrency: 2,
        useAi: true,
      },
      dependencies(
        items,
        (
          {
            dailyMatchId,
          },
        ) => {
          if (
            dailyMatchId ===
              items[0]
                .dailyMatchId
          ) {
            return Promise.resolve(
              ratedResult(
                dailyMatchId,
              ),
            );
          }

          if (
            dailyMatchId ===
              items[1]
                .dailyMatchId
          ) {
            return Promise.resolve({
              dailyMatchId,

              status: "skipped",

              httpStatus: 409,

              code: "RATING_CLAIM_CONFLICT",
            });
          }

          return Promise.resolve({
            dailyMatchId,

            status: "failed",

            httpStatus: 500,

            code: "GENERATOR_HTTP_500",
          });
        },
      ),
    );

    assertEquals(
      {
        attempted: result.batch
          .attempted,

        rated: result.batch.rated,

        skipped: result.batch
          .skipped,

        failed: result.batch.failed,
      },
      {
        attempted: 3,
        rated: 1,
        skipped: 1,
        failed: 1,
      },
      "Batch counters are incorrect.",
    );
  },
);

Deno.test(
  "rejects invalid worker options",
  () => {
    let invalidBatchRejected = false;

    let invalidConcurrencyRejected = false;

    try {
      validateRatingWorkerOptions({
        batchSize: MAX_RATING_WORKER_BATCH_SIZE +
          1,

        concurrency: 1,
        useAi: true,
      });
    } catch {
      invalidBatchRejected = true;
    }

    try {
      validateRatingWorkerOptions({
        batchSize: 2,
        concurrency: 3,
        useAi: true,
      });
    } catch {
      invalidConcurrencyRejected = true;
    }

    assert(
      invalidBatchRejected,
      "Oversized batch must be rejected.",
    );

    assert(
      invalidConcurrencyRejected,
      "Concurrency greater than batchSize must be rejected.",
    );
  },
);

Deno.test(
  "classifies successful finalize response as rated",
  async () => {
    const dailyMatchId = candidate(1)
      .dailyMatchId;

    let capturedBody: unknown = null;

    let capturedSecret: string | null = null;

    const fetchImpl: typeof fetch = async (
      _input,
      init,
    ) => {
      capturedBody = JSON.parse(
        String(
          init?.body,
        ),
      ) as unknown;

      capturedSecret = new Headers(
        init?.headers,
      ).get(
        "x-humob-job-secret",
      );

      return new Response(
        JSON.stringify({
          success: true,

          action: "finalize",

          persisted: true,

          existing: false,

          rating: {
            daily_match_id: dailyMatchId,
          },
        }),
        {
          status: 200,

          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    };

    const result = await callRatingGenerator({
      generatorUrl: "https://example.test/functions/v1/generate-ai-rating",

      jobSecret: "internal-test-secret",

      dailyMatchId,
      useAi: true,
      fetchImpl,
    });

    assert(
      result.status ===
        "rated",
      "Valid finalize response must be rated.",
    );

    assertEquals(
      capturedBody,
      {
        dailyMatchId,

        action: "finalize",

        useAi: true,
      },
      "Generator request body is incorrect.",
    );

    assert(
      capturedSecret ===
        "internal-test-secret",
      "Job secret header was not forwarded.",
    );

    assert(
      !JSON.stringify(
        result,
      ).includes(
        "internal-test-secret",
      ),
      "Job secret must not appear in result.",
    );
  },
);

Deno.test(
  "classifies safe claim conflict as skipped",
  async () => {
    const dailyMatchId = candidate(1)
      .dailyMatchId;

    const result = await callRatingGenerator({
      generatorUrl: "https://example.test/functions/v1/generate-ai-rating",

      jobSecret: "secret",

      dailyMatchId,
      useAi: true,

      fetchImpl: () =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              success: false,

              error: {
                code: "RATING_CLAIM_CONFLICT",

                message: "Another worker claimed it.",
              },
            }),
            {
              status: 409,

              headers: {
                "Content-Type": "application/json",
              },
            },
          ),
        ),
    });

    assertEquals(
      result,
      {
        dailyMatchId,

        status: "skipped",

        httpStatus: 409,

        code: "RATING_CLAIM_CONFLICT",
      },
      "Safe claim conflict must be skipped.",
    );
  },
);

Deno.test(
  "rejects malformed successful generator response",
  async () => {
    const dailyMatchId = candidate(1)
      .dailyMatchId;

    const result = await callRatingGenerator({
      generatorUrl: "https://example.test/functions/v1/generate-ai-rating",

      jobSecret: "secret",

      dailyMatchId,
      useAi: true,

      fetchImpl: () =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,

              action: "preview",

              persisted: false,
            }),
            {
              status: 200,

              headers: {
                "Content-Type": "application/json",
              },
            },
          ),
        ),
    });

    assert(
      result.status ===
          "failed" &&
        result.code ===
          "INVALID_GENERATOR_RESPONSE",
      "Malformed 2xx response must fail safely.",
    );
  },
);

Deno.test(
  "classifies aborted generator request as timeout",
  async () => {
    const dailyMatchId = candidate(1)
      .dailyMatchId;

    const fetchImpl: typeof fetch = () =>
      Promise.reject(
        new DOMException(
          "Aborted",
          "AbortError",
        ),
      );

    const result = await callRatingGenerator({
      generatorUrl: "https://example.test/functions/v1/generate-ai-rating",

      jobSecret: "secret",

      dailyMatchId,
      useAi: true,

      timeoutMs: 5,

      fetchImpl,
    });

    assert(
      result.status ===
          "failed" &&
        result.code ===
          "GENERATOR_TIMEOUT",
      "Aborted request must be classified as timeout.",
    );
  },
);
