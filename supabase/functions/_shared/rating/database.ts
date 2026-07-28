import { createClient } from "@supabase/supabase-js";

import {
  FINALIZABLE_MATCH_STATUSES,
  PROCESSING_STALE_AFTER_MS,
} from "./constants.ts";

import type {
  CanonicalRatingInput,
  DatabaseClient,
  ExistingRatingRow,
  FinalRatingResult,
  LogicScoreResult,
  RequestAuth,
} from "./types.ts";

import { HttpError, timingSafeEqual } from "./utils.ts";

type AdminCredentialKind =
  | "secret_key"
  | "secret_dictionary"
  | "legacy_service_role";

type AdminCredential = {
  kind: AdminCredentialKind;
  value: string;
};

export type EnvironmentReader = (
  name: string,
) => string | undefined;

function readNonEmptySecret(
  value: string | undefined,
): string | null {
  const normalized = value?.trim() ?? "";

  return normalized === "" ? null : normalized;
}

function readSecretDictionary(
  readEnv: EnvironmentReader,
):
  | AdminCredential
  | null {
  const secretDictionary = readNonEmptySecret(
    readEnv(
      "SUPABASE_SECRET_KEYS",
    ),
  );

  if (!secretDictionary) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      secretDictionary,
    ) as unknown;

    if (
      parsed === null ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return null;
    }

    const record = parsed as Record<
      string,
      unknown
    >;

    const defaultSecret = readNonEmptySecret(
      typeof record.default ===
          "string"
        ? record.default
        : undefined,
    );

    if (defaultSecret) {
      return {
        kind: "secret_dictionary",
        value: defaultSecret,
      };
    }

    const firstSecret = Object.values(record)
      .map((value) =>
        typeof value === "string"
          ? readNonEmptySecret(
            value,
          )
          : null
      )
      .find(
        (
          value,
        ): value is string => value !== null,
      );

    return firstSecret
      ? {
        kind: "secret_dictionary",
        value: firstSecret,
      }
      : null;
  } catch {
    console.error(
      "SUPABASE_SECRET_KEYS is not valid JSON.",
    );

    return null;
  }
}

function readAdminCredential(
  readEnv: EnvironmentReader,
):
  | AdminCredential
  | null {
  const directSecret = readNonEmptySecret(
    readEnv(
      "SUPABASE_SECRET_KEY",
    ),
  );

  if (directSecret) {
    return {
      kind: "secret_key",
      value: directSecret,
    };
  }

  const dictionarySecret = readSecretDictionary(
    readEnv,
  );

  if (dictionarySecret) {
    return dictionarySecret;
  }

  const serviceRoleKey = readNonEmptySecret(
    readEnv(
      "SUPABASE_SERVICE_ROLE_KEY",
    ),
  );

  if (serviceRoleKey) {
    return {
      kind: "legacy_service_role",
      value: serviceRoleKey,
    };
  }

  return null;
}

export function createAdminClient(
  readEnv: EnvironmentReader = (
    name,
  ) => Deno.env.get(name),
): DatabaseClient {
  const supabaseUrl = readNonEmptySecret(
    readEnv(
      "SUPABASE_URL",
    ),
  );

  const credential = readAdminCredential(
    readEnv,
  );

  if (
    !supabaseUrl ||
    !credential
  ) {
    throw new HttpError(
      500,
      "SUPABASE_ENV_MISSING",
      "Supabase Edge Function environment is incomplete.",
    );
  }

  return createClient(
    supabaseUrl,
    credential.value,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}

function bearerToken(
  request: Request,
): string | null {
  const authorization = request.headers.get(
    "Authorization",
  );

  if (
    !authorization?.startsWith(
      "Bearer ",
    )
  ) {
    return null;
  }

  return (
    authorization
      .slice("Bearer ".length)
      .trim() || null
  );
}

export async function authenticateRequest(
  request: Request,
  admin: DatabaseClient,
  readEnv: EnvironmentReader = (
    name,
  ) => Deno.env.get(name),
): Promise<RequestAuth> {
  const expectedJobSecret = readNonEmptySecret(
    readEnv(
      "HUMOB_RATING_JOB_SECRET",
    ),
  );

  const receivedJobSecret = readNonEmptySecret(
    request.headers.get(
      "x-humob-job-secret",
    ) ?? undefined,
  );

  if (
    expectedJobSecret &&
    receivedJobSecret &&
    timingSafeEqual(
      expectedJobSecret,
      receivedJobSecret,
    )
  ) {
    return {
      kind: "job",
    };
  }

  const token = bearerToken(request);

  if (token) {
    const {
      data,
      error,
    } = await admin.auth.getUser(
      token,
    );

    if (
      !error &&
      data.user
    ) {
      return {
        kind: "user",
        userId: data.user.id,
      };
    }
  }

  throw new HttpError(
    401,
    "AUTH_REQUIRED",
    "A valid HuMob user session or rating job secret is required.",
  );
}

export function assertActionPermission(
  auth: RequestAuth,
  action:
    | "preview"
    | "finalize",
): void {
  if (
    action === "finalize" &&
    auth.kind !== "job"
  ) {
    throw new HttpError(
      403,
      "FINALIZE_JOB_ONLY",
      "Final rating creation is restricted to the HuMob rating job.",
    );
  }
}

export async function claimDailyMatchForRating(
  admin: DatabaseClient,
  input: CanonicalRatingInput,
): Promise<void> {
  if (input.existingRating) {
    return;
  }

  const now = new Date();

  const queueAt = new Date(
    input.dailyMatch
      .rating_queues_at,
  );

  if (
    Number.isNaN(
      queueAt.getTime(),
    ) ||
    now.getTime() <
      queueAt.getTime()
  ) {
    throw new HttpError(
      409,
      "RATING_NOT_ELIGIBLE",
      "The Daily Match has not reached its rating queue time.",
    );
  }

  const staleBefore = new Date(
    now.getTime() -
      PROCESSING_STALE_AFTER_MS,
  );

  const processingStartedAt = input.dailyMatch
      .processing_started_at
    ? new Date(
      input.dailyMatch
        .processing_started_at,
    )
    : null;

  const isStaleProcessing = input.dailyMatch.status ===
      "processing" &&
    processingStartedAt !== null &&
    !Number.isNaN(
      processingStartedAt.getTime(),
    ) &&
    processingStartedAt.getTime() <=
      staleBefore.getTime();

  if (
    !FINALIZABLE_MATCH_STATUSES.includes(
      input.dailyMatch.status as (
        typeof FINALIZABLE_MATCH_STATUSES
      )[number],
    ) &&
    !isStaleProcessing
  ) {
    throw new HttpError(
      409,
      "RATING_ALREADY_PROCESSING",
      "The Daily Match is already processing or rated.",
    );
  }

  const nowIso = now.toISOString();

  const lockedAt = input.dailyMatch.locked_at ??
    input.dailyMatch
      .input_closes_at ??
    nowIso;

  let query = admin
    .from("daily_matches")
    .update({
      status: "processing",

      locked_at: lockedAt,

      queued_at: input.dailyMatch
        .queued_at ?? nowIso,

      processing_started_at: nowIso,

      updated_at: nowIso,
    })
    .eq(
      "id",
      input.dailyMatch.id,
    )
    .eq(
      "user_id",
      input.dailyMatch.user_id,
    );

  if (isStaleProcessing) {
    query = query
      .eq(
        "status",
        "processing",
      )
      .eq(
        "processing_started_at",
        input.dailyMatch
          .processing_started_at!,
      );
  } else {
    query = query.in(
      "status",
      [
        ...FINALIZABLE_MATCH_STATUSES,
      ],
    );
  }

  const {
    data,
    error,
  } = await query
    .select("id")
    .maybeSingle();

  if (error) {
    console.error(
      "Daily Match claim failed",
      {
        code: error.code ?? null,

        message: error.message,
      },
    );

    throw new HttpError(
      500,
      "RATING_CLAIM_FAILED",
      "The Daily Match could not be claimed for rating.",
    );
  }

  if (!data) {
    throw new HttpError(
      409,
      "RATING_CLAIM_CONFLICT",
      "Another rating process claimed this Daily Match.",
    );
  }
}

export async function markDailyMatchFailed(
  admin: DatabaseClient,
  dailyMatchId: string,
): Promise<void> {
  const {
    error,
  } = await admin
    .from("daily_matches")
    .update({
      status: "failed",

      updated_at: new Date().toISOString(),
    })
    .eq("id", dailyMatchId)
    .eq("status", "processing");

  if (error) {
    console.error(
      "Failed to mark Daily Match as failed",
      {
        dailyMatchId,

        code: error.code ?? null,

        message: error.message,
      },
    );
  }
}

export async function insertFinalRating(
  admin: DatabaseClient,
  input: CanonicalRatingInput,
  logic: LogicScoreResult,
  final: FinalRatingResult,
  inputHash: string,
): Promise<ExistingRatingRow> {
  const payload = {
    daily_match_id: input.dailyMatch.id,

    user_id: input.dailyMatch.user_id,

    scoring_config_id: input.scoringConfig.id,

    energy_has_data: logic.hasData.energy,

    focus_has_data: logic.hasData.focus,

    discipline_has_data: logic.hasData.discipline,

    responsibility_has_data: logic.hasData.responsibility,

    logic_energy: logic.logic.energy,

    logic_focus: logic.logic.focus,

    logic_discipline: logic.logic.discipline,

    logic_responsibility: logic.logic.responsibility,

    ai_energy_adjustment: final.adjustments.energy,

    ai_focus_adjustment: final.adjustments.focus,

    ai_discipline_adjustment: final.adjustments.discipline,

    ai_responsibility_adjustment: final.adjustments
      .responsibility,

    energy_rating: final.ratings.energy,

    focus_rating: final.ratings.focus,

    discipline_rating: final.ratings.discipline,

    responsibility_rating: final.ratings
      .responsibility,

    overall_rating: final.overall,

    source: final.source,

    provider_used: final.provider,

    model_used: final.model,

    input_hash: inputHash,

    validation_flags: final.validationFlags,
  };

  const {
    data,
    error,
  } = await admin
    .from("daily_ratings")
    .insert(payload)
    .select("*")
    .single();

  if (
    !error &&
    data
  ) {
    return (
      data as ExistingRatingRow
    );
  }

  /*
   * daily_match_id has a unique index.
   * A concurrent request may have inserted
   * the same rating first.
   */
  if (error?.code === "23505") {
    const existing = await admin
      .from("daily_ratings")
      .select("*")
      .eq(
        "daily_match_id",
        input.dailyMatch.id,
      )
      .maybeSingle();

    if (
      !existing.error &&
      existing.data
    ) {
      return (
        existing.data as ExistingRatingRow
      );
    }
  }

  console.error(
    "Final rating insert failed",
    {
      code: error?.code ?? null,

      message: error?.message ??
        "Unknown insert error",
    },
  );

  throw new HttpError(
    500,
    "RATING_INSERT_FAILED",
    "The final Daily Rating could not be stored.",
  );
}
