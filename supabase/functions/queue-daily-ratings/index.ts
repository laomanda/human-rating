import {
  authenticateRequest,
  createAdminClient,
} from "../_shared/rating/database.ts";

import {
  DEFAULT_RATING_QUEUE_BATCH_SIZE,
  loadRatingQueueCandidates,
  MAX_RATING_QUEUE_BATCH_SIZE,
  processRatingQueueBatch,
  transitionRatingQueueCandidate,
} from "../_shared/rating/rating-queue.ts";

import type { RatingQueueOptions } from "../_shared/rating/rating-queue.ts";

import { HttpError, safeErrorMessage } from "../_shared/rating/utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",

  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-humob-job-secret",

  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(
  body: unknown,
  status = 200,
): Response {
  return new Response(
    JSON.stringify(body),
    {
      status,

      headers: {
        ...corsHeaders,

        "Content-Type": "application/json; charset=utf-8",

        "Cache-Control": "no-store",
      },
    },
  );
}

function isRecord(
  value: unknown,
): value is Record<
  string,
  unknown
> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function parseBatchSize(
  value: unknown,
): number {
  if (value === undefined) {
    return DEFAULT_RATING_QUEUE_BATCH_SIZE;
  }

  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 1 ||
    value >
      MAX_RATING_QUEUE_BATCH_SIZE
  ) {
    throw new HttpError(
      400,
      "INVALID_BATCH_SIZE",
      `batchSize must be an integer from 1 to ${MAX_RATING_QUEUE_BATCH_SIZE}.`,
    );
  }

  return value;
}

async function parseRequest(
  request: Request,
): Promise<
  RatingQueueOptions
> {
  const rawBody = await request.text();

  let parsed: unknown = {};

  if (
    rawBody.trim() !== ""
  ) {
    try {
      parsed = JSON.parse(
        rawBody,
      ) as unknown;
    } catch {
      throw new HttpError(
        400,
        "INVALID_JSON",
        "Request body must be valid JSON.",
      );
    }
  }

  if (!isRecord(parsed)) {
    throw new HttpError(
      400,
      "INVALID_BODY",
      "Request body must be a JSON object.",
    );
  }

  const allowedKeys = new Set<string>([
    "batchSize",
  ]);

  const extraKeys = Object.keys(parsed).filter(
    (key) => !allowedKeys.has(key),
  );

  if (
    extraKeys.length > 0
  ) {
    throw new HttpError(
      400,
      "UNKNOWN_BODY_FIELDS",
      `Unknown request field(s): ${extraKeys.join(", ")}.`,
    );
  }

  return {
    batchSize: parseBatchSize(
      parsed.batchSize,
    ),
  };
}

Deno.serve(
  async (
    request: Request,
  ): Promise<Response> => {
    if (
      request.method ===
        "OPTIONS"
    ) {
      return new Response(
        "ok",
        {
          headers: corsHeaders,
        },
      );
    }

    if (
      request.method !==
        "POST"
    ) {
      return jsonResponse(
        {
          success: false,

          error: {
            code: "METHOD_NOT_ALLOWED",

            message: "Use POST.",
          },
        },
        405,
      );
    }

    try {
      const options = await parseRequest(
        request,
      );

      const admin = createAdminClient();

      const auth = await authenticateRequest(
        request,
        admin,
      );

      /*
       * A normal HuMob user may authenticate, but only
       * the internal automation job may execute lifecycle
       * transitions.
       */
      if (
        auth.kind !== "job"
      ) {
        throw new HttpError(
          403,
          "QUEUE_JOB_ONLY",
          "Daily Match queue processing is restricted to the HuMob rating job.",
        );
      }

      const result = await processRatingQueueBatch(
        options,
        {
          loadCandidates: (
            input,
          ) =>
            loadRatingQueueCandidates(
              admin,
              input,
            ),

          transitionCandidate: (
            input,
          ) =>
            transitionRatingQueueCandidate(
              admin,
              input,
            ),
        },
      );

      return jsonResponse({
        success: true,
        ...result,
      });
    } catch (error) {
      const httpError = error instanceof
          HttpError
        ? error
        : new HttpError(
          500,
          "INTERNAL_ERROR",
          "The Daily Match queue worker failed unexpectedly.",
        );

      console.error(
        "queue-daily-ratings failed",
        {
          code: httpError.code,

          status: httpError.status,

          message: error instanceof
              HttpError
            ? httpError.message
            : safeErrorMessage(
              error,
            ),
        },
      );

      return jsonResponse(
        {
          success: false,

          error: {
            code: httpError.code,

            message: httpError.message,
          },
        },
        httpError.status,
      );
    }
  },
);
