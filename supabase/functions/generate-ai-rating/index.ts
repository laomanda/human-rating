import {
  runAiProviders,
} from "../_shared/rating/ai-provider.ts";

import {
  loadCanonicalRatingInput,
} from "../_shared/rating/canonical-input.ts";

import {
  assertActionPermission,
  authenticateRequest,
  claimDailyMatchForRating,
  createAdminClient,
  insertFinalRating,
  markDailyMatchFailed,
} from "../_shared/rating/database.ts";

import {
  createInputHash,
} from "../_shared/rating/input-hash.ts";

import {
  calculateLogicScores,
} from "../_shared/rating/logic-scoring.ts";

import type {
  AiProviderRunResult,
  CanonicalRatingInput,
  DimensionMap,
  FinalRatingResult,
  LogicScoreResult,
  RatingRequestBody,
  RequestAuth,
} from "../_shared/rating/types.ts";

import {
  clamp,
  HttpError,
  isUuid,
  round1,
  safeErrorMessage,
} from "../_shared/rating/utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",

  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-humob-job-secret",

  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
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

        "Content-Type":
          "application/json; charset=utf-8",

        "Cache-Control":
          "no-store",
      },
    },
  );
}

function zeroDimensions():
  DimensionMap {
  return {
    energy: 0,
    focus: 0,
    discipline: 0,
    responsibility: 0,
  };
}

function weightedOverall(
  input: CanonicalRatingInput,
  ratings: DimensionMap,
): number {
  const config =
    input.scoringConfig;

  return round1(
    clamp(
      ratings.energy *
        config.energy_weight +

        ratings.focus *
          config.focus_weight +

        ratings.discipline *
          config.discipline_weight +

        ratings.responsibility *
          config
            .responsibility_weight,
    ),
  );
}

function boundedAdjustment(
  difference: number,
  maximum: number,
): number {
  const limited =
    clamp(
      difference,
      -maximum,
      maximum,
    );

  const rounded =
    round1(limited);

  /*
   * Defensively prevent decimal rounding
   * from exceeding a non-standard limit.
   */
  if (
    Math.abs(rounded) <=
    maximum
  ) {
    return rounded;
  }

  const safeMagnitude =
    Math.floor(
      maximum * 10,
    ) / 10;

  return rounded < 0
    ? -safeMagnitude
    : safeMagnitude;
}

function calculateFinalRating(
  input: CanonicalRatingInput,
  logic: LogicScoreResult,
  aiResult: AiProviderRunResult,
): FinalRatingResult {
  if (
    logic.metrics.rawInputCount === 0
  ) {
    return {
      source: "no_activity",

      provider: null,
      model: null,

      adjustments:
        zeroDimensions(),

      ratings:
        zeroDimensions(),

      overall: 0,

      validationFlags: [
        ...logic.validationFlags,
        "ai_skipped_no_activity",
      ],
    };
  }

  const providerResult =
    aiResult.result;

  if (!providerResult) {
    const logicOverall =
      weightedOverall(
        input,
        logic.logic,
      );

    return {
      source:
        "logic_fallback",

      provider: null,
      model: null,

      adjustments:
        zeroDimensions(),

      ratings: {
        ...logic.logic,
      },

      overall:
        logicOverall,

      validationFlags: [
        ...logic.validationFlags,
        ...aiResult.validationFlags,
        "logic_fallback_finalized",
      ],
    };
  }

  const maximum =
    input.scoringConfig
      .max_ai_adjustment;

  const adjustmentFlags:
    string[] = [];

  const adjustments =
    zeroDimensions();

  const ratings =
    zeroDimensions();

  for (
    const key of [
      "energy",
      "focus",
      "discipline",
      "responsibility",
    ] as const
  ) {
    if (!logic.hasData[key]) {
      adjustments[key] = 0;
      ratings[key] = 0;

      continue;
    }

    const rawDifference =
      providerResult
        .suggestedRatings[key] -
      logic.logic[key];

    const limitedDifference =
      boundedAdjustment(
        rawDifference,
        maximum,
      );

    if (
      Math.abs(
        rawDifference -
          limitedDifference,
      ) > 0.0001
    ) {
      adjustmentFlags.push(
        `ai_${key}_difference_capped`,
      );
    }

    adjustments[key] =
      limitedDifference;

    ratings[key] = round1(
      clamp(
        logic.logic[key] +
          adjustments[key],
      ),
    );
  }

  /*
   * AI overall is audit-only.
   * Canonical overall is always recalculated
   * from final dimensions and DB config weights.
   */
  const overall =
    weightedOverall(
      input,
      ratings,
    );

  if (
    Math.abs(
      providerResult
        .suggestedRatings.overall -
        overall,
    ) > maximum
  ) {
    adjustmentFlags.push(
      "ai_overall_not_used_outside_weighted_result",
    );
  } else {
    adjustmentFlags.push(
      "ai_overall_audit_within_tolerance",
    );
  }

  return {
    source:
      providerResult.source,

    provider:
      providerResult.provider,

    model:
      providerResult.model,

    adjustments,
    ratings,
    overall,

    validationFlags: [
      ...logic.validationFlags,
      ...aiResult.validationFlags,
      ...providerResult
        .validationFlags,
      ...adjustmentFlags,
      "ai_rating_constrained_by_logic",
    ],
  };
}

async function parseRequest(
  request: Request,
): Promise<RatingRequestBody> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new HttpError(
      400,
      "INVALID_JSON",
      "Request body must be valid JSON.",
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body)
  ) {
    throw new HttpError(
      400,
      "INVALID_BODY",
      "Request body must be a JSON object.",
    );
  }

  const record =
    body as Record<
      string,
      unknown
    >;

  const allowedKeys =
    new Set([
      "dailyMatchId",
      "action",
      "useAi",
    ]);

  const extraKeys =
    Object.keys(record).filter(
      (key) =>
        !allowedKeys.has(key),
    );

  if (extraKeys.length > 0) {
    throw new HttpError(
      400,
      "UNKNOWN_BODY_FIELDS",
      `Unknown request field(s): ${extraKeys.join(
        ", ",
      )}.`,
    );
  }

  if (
    !isUuid(
      record.dailyMatchId,
    )
  ) {
    throw new HttpError(
      400,
      "INVALID_DAILY_MATCH_ID",
      "dailyMatchId must be a UUID.",
    );
  }

  const action =
    record.action ?? "preview";

  if (
    action !== "preview" &&
    action !== "finalize"
  ) {
    throw new HttpError(
      400,
      "INVALID_ACTION",
      "action must be preview or finalize.",
    );
  }

  if (
    record.useAi !== undefined &&
    typeof record.useAi !==
      "boolean"
  ) {
    throw new HttpError(
      400,
      "INVALID_USE_AI",
      "useAi must be a boolean.",
    );
  }

  return {
    dailyMatchId:
      record.dailyMatchId,

    action,

    useAi:
      record.useAi === true,
  };
}

function assertOwnership(
  auth: RequestAuth,
  input: CanonicalRatingInput,
): void {
  if (
    auth.kind === "user" &&
    auth.userId !==
      input.dailyMatch.user_id
  ) {
    throw new HttpError(
      403,
      "DAILY_MATCH_OWNER_MISMATCH",
      "This Daily Match does not belong to the authenticated user.",
    );
  }
}

Deno.serve(
  async (
    request: Request,
  ): Promise<Response> => {
    if (
      request.method === "OPTIONS"
    ) {
      return new Response(
        "ok",
        {
          headers: corsHeaders,
        },
      );
    }

    if (
      request.method !== "POST"
    ) {
      return jsonResponse(
        {
          success: false,

          error: {
            code:
              "METHOD_NOT_ALLOWED",

            message:
              "Use POST.",
          },
        },
        405,
      );
    }

    let claimedDailyMatchId:
      | string
      | null = null;

    let admin:
      | ReturnType<
          typeof createAdminClient
        >
      | null = null;

    try {
      const body =
        await parseRequest(
          request,
        );

      const authAdmin =
        createAdminClient();

      const auth =
        await authenticateRequest(
          request,
          authAdmin,
        );

      assertActionPermission(
        auth,
        body.action,
      );

      admin =
        createAdminClient();

      const input =
        await loadCanonicalRatingInput(
          admin,
          body.dailyMatchId,
        );

      assertOwnership(
        auth,
        input,
      );

      /*
       * Idempotent finalization.
       */
      if (
        body.action ===
          "finalize" &&
        input.existingRating
      ) {
        return jsonResponse({
          success: true,
          action: "finalize",
          persisted: true,
          existing: true,

          rating:
            input.existingRating,
        });
      }

      const logic =
        calculateLogicScores(
          input,
        );

      const inputHash =
        await createInputHash(
          input,
        );

      if (
        body.action ===
        "finalize"
      ) {
        await claimDailyMatchForRating(
          admin,
          input,
        );

        claimedDailyMatchId =
          input.dailyMatch.id;
      }

      /*
       * Only the internal rating job can
       * execute AI.
       *
       * User preview is logic-only.
       */
      const canUseAi =
        auth.kind === "job";

      const shouldUseAi =
        logic.metrics
          .rawInputCount > 0 &&
        canUseAi &&
        (
          body.action ===
            "finalize" ||
          body.useAi
        );

      const aiResult:
        AiProviderRunResult =
        shouldUseAi
          ? await runAiProviders(
              input,
              logic,
            )
          : {
              result: null,

              validationFlags: [
                auth.kind === "user"
                  ? "ai_skipped_user_preview"
                  : "ai_skipped_by_request",
              ],
            };

      const final =
        calculateFinalRating(
          input,
          logic,
          aiResult,
        );

      if (
        body.action ===
        "preview"
      ) {
        return jsonResponse({
          success: true,
          action: "preview",
          persisted: false,

          aiExecuted:
            shouldUseAi,

          scoringConfig: {
            id:
              input.scoringConfig.id,

            version:
              input.scoringConfig
                .version,
          },

          inputHash,
          logic,
          final,
        });
      }

      const storedRating =
        await insertFinalRating(
          admin,
          input,
          logic,
          final,
          inputHash,
        );

      /*
       * after_daily_rating_change()
       * changes the match to rated and
       * recomputes stats/baseline.
       */
      claimedDailyMatchId =
        null;

      return jsonResponse({
        success: true,
        action: "finalize",
        persisted: true,
        existing: false,

        rating:
          storedRating,
      });
    } catch (error) {
      if (
        admin &&
        claimedDailyMatchId
      ) {
        await markDailyMatchFailed(
          admin,
          claimedDailyMatchId,
        );
      }

      const httpError =
        error instanceof HttpError
          ? error
          : new HttpError(
              500,
              "INTERNAL_ERROR",
              safeErrorMessage(
                error,
              ),
            );

      console.error(
        "generate-ai-rating failed",
        {
          code:
            httpError.code,

          status:
            httpError.status,

          message:
            httpError.message,
        },
      );

      return jsonResponse(
        {
          success: false,

          error: {
            code:
              httpError.code,

            message:
              httpError.message,
          },
        },
        httpError.status,
      );
    }
  },
);
