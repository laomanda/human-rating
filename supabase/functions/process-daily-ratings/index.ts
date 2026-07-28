import {
  authenticateRequest,
  createAdminClient,
} from "../_shared/rating/database.ts";

import {
  callRatingGenerator,
  DEFAULT_RATING_WORKER_BATCH_SIZE,
  DEFAULT_RATING_WORKER_CONCURRENCY,
  loadQueuedRatingCandidates,
  MAX_RATING_WORKER_BATCH_SIZE,
  MAX_RATING_WORKER_CONCURRENCY,
  processDailyRatingBatch,
} from "../_shared/rating/rating-worker.ts";

import type { RatingWorkerOptions } from "../_shared/rating/rating-worker.ts";

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
    JSON.stringify(
      body,
    ),
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
    typeof value ===
      "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function toErrorFieldName(
  fieldName: string,
): string {
  return fieldName
    .replace(
      /[A-Z]/g,
      (
        character,
      ) => `_${character}`,
    )
    .toUpperCase();
}

function parseIntegerField(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
  fieldName: string,
): number {
  if (
    value === undefined
  ) {
    return fallback;
  }

  if (
    typeof value !==
      "number" ||
    !Number.isInteger(value) ||
    value < minimum ||
    value > maximum
  ) {
    throw new HttpError(
      400,
      `INVALID_${
        toErrorFieldName(
          fieldName,
        )
      }`,
      `${fieldName} must be an integer from ${minimum} to ${maximum}.`,
    );
  }

  return value;
}

async function parseRequest(
  request: Request,
): Promise<
  RatingWorkerOptions
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
    "concurrency",
    "useAi",
  ]);

  const extraKeys = Object.keys(
    parsed,
  ).filter(
    (key) =>
      !allowedKeys.has(
        key,
      ),
  );

  if (
    extraKeys.length > 0
  ) {
    throw new HttpError(
      400,
      "UNKNOWN_BODY_FIELDS",
      `Unknown request field(s): ${
        extraKeys.join(
          ", ",
        )
      }.`,
    );
  }

  const batchSize = parseIntegerField(
    parsed.batchSize,
    DEFAULT_RATING_WORKER_BATCH_SIZE,
    1,
    MAX_RATING_WORKER_BATCH_SIZE,
    "batchSize",
  );

  const concurrency = parseIntegerField(
    parsed.concurrency,
    DEFAULT_RATING_WORKER_CONCURRENCY,
    1,
    MAX_RATING_WORKER_CONCURRENCY,
    "concurrency",
  );

  if (
    concurrency >
      batchSize
  ) {
    throw new HttpError(
      400,
      "CONCURRENCY_EXCEEDS_BATCH",
      "concurrency cannot exceed batchSize.",
    );
  }

  if (
    parsed.useAi !==
      undefined &&
    typeof parsed.useAi !==
      "boolean"
  ) {
    throw new HttpError(
      400,
      "INVALID_USE_AI",
      "useAi must be a boolean.",
    );
  }

  return {
    batchSize,
    concurrency,

    /*
     * AI is enabled by default.
     * Supplying false is mainly useful for controlled tests.
     */
    useAi: parsed.useAi !==
      false,
  };
}

function readRequiredEnvironment(
  name: string,
): string {
  const value = Deno.env
    .get(name)
    ?.trim();

  if (!value) {
    throw new HttpError(
      500,
      "WORKER_ENV_MISSING",
      `Required Edge Function environment variable is missing: ${name}.`,
    );
  }

  return value;
}

function buildGeneratorUrl(
  supabaseUrl: string,
): string {
  const normalizedUrl = supabaseUrl.replace(
    /\/+$/u,
    "",
  );

  return (
    `${normalizedUrl}` +
    "/functions/v1/" +
    "generate-ai-rating"
  );
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
       * User sessions may authenticate successfully,
       * but only the internal rating job may execute
       * this worker.
       */
      if (
        auth.kind !== "job"
      ) {
        throw new HttpError(
          403,
          "WORKER_JOB_ONLY",
          "Daily rating processing is restricted to the HuMob rating job.",
        );
      }

      const supabaseUrl = readRequiredEnvironment(
        "SUPABASE_URL",
      );

      const jobSecret = readRequiredEnvironment(
        "HUMOB_RATING_JOB_SECRET",
      );

      const generatorUrl = buildGeneratorUrl(
        supabaseUrl,
      );

      const result = await processDailyRatingBatch(
        options,
        {
          loadCandidates: (
            input,
          ) =>
            loadQueuedRatingCandidates(
              admin,
              input,
            ),

          finalizeRating: (
            {
              dailyMatchId,
              useAi,
            },
          ) =>
            callRatingGenerator({
              generatorUrl,
              jobSecret,

              dailyMatchId,
              useAi,
            }),
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
          "The Daily Rating worker failed unexpectedly.",
        );

      /*
       * The unknown internal error may be logged,
       * but the response remains generic.
       */
      console.error(
        "process-daily-ratings failed",
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
