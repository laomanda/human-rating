import {
  AI_REQUEST_TIMEOUT_MS,
  BACKUP_AI_MAX_ATTEMPTS,
  PRIMARY_AI_ENDPOINT,
  PRIMARY_AI_MAX_ATTEMPTS,
  PRIMARY_AI_MODEL,
  PRIMARY_AI_PROVIDER,
  RETRYABLE_HTTP_STATUSES,
} from "./constants.ts";

import type {
  AiProviderResult,
  AiProviderRunResult,
  AiSuggestedRatings,
  CanonicalRatingInput,
  LogicScoreResult,
} from "./types.ts";

import {
  clamp,
  round1,
  safeErrorMessage,
  sleep,
} from "./utils.ts";

type ProviderConfig = {
  provider: string;
  endpoint: string;
  apiKey: string;
  model: string;

  source:
    | "ai_primary"
    | "ai_fallback";

  maxAttempts: number;

  supportsStrictSchema: boolean;
};

type ProviderResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;

  error?: {
    message?: string;
  };
};

class ProviderError extends Error {
  readonly retryable: boolean;
  readonly status: number | null;

  constructor(
    message: string,
    retryable: boolean,
    status: number | null = null,
  ) {
    super(message);

    this.name = "ProviderError";
    this.retryable = retryable;
    this.status = status;
  }
}

function sanitizeInputForAi(
  input: CanonicalRatingInput,
  logic: LogicScoreResult,
) {
  return {
    matchDate:
      input.dailyMatch.match_date,

    timezone:
      input.dailyMatch.timezone,

    logicScores:
      logic.logic,

    availability:
      logic.hasData,

    metrics:
      logic.metrics,

    sleep: input.sleepEntry
      ? {
          durationMinutes:
            input.sleepEntry
              .duration_minutes,

          quality:
            input.sleepEntry
              .quality,

          wokeDuringSleep:
            input.sleepEntry
              .woke_during_sleep,
        }
      : null,

    physicalActivities:
      input.physicalActivities.map(
        (activity) => ({
          type:
            activity.activity_type,

          customName:
            activity
              .custom_activity_name,

          intensity:
            activity.intensity,

          reason:
            activity.reason,
        }),
      ),

    productiveActivities:
      input.productiveActivities.map(
        (activity) => ({
          category:
            activity.category,

          title:
            activity.title,

          description:
            activity.description,
        }),
      ),

    responsibilities:
      input.responsibilities.map(
        (responsibility) => ({
          category:
            responsibility.category,

          description:
            responsibility.description,

          executionStatus:
            responsibility
              .execution_status,

          importance:
            responsibility.importance,
        }),
      ),

    otherActivities:
      input.otherActivities.map(
        (activity) => ({
          description:
            activity.description,

          classifiedAttribute:
            activity
              .classified_attribute,
        }),
      ),
  };
}

function buildPrompt(
  input: CanonicalRatingInput,
  logic: LogicScoreResult,
): string {
  return `
You are HuMob AI Rating Engine.

Your only task is to return numerical daily performance ratings.

Never provide:
- advice
- motivation
- explanation
- coaching
- recommendation
- summary
- labels
- additional fields

Rules:
- Return exactly five numeric properties.
- Every value must be from 0.0 to 10.0.
- Use one decimal place.
- A dimension whose availability is false must be 0.0.
- Treat the deterministic logic scores as the main anchor.
- Do not fabricate evidence that is absent.
- The application independently limits every adjustment.

Required object:
{
  "energy": number,
  "focus": number,
  "discipline": number,
  "responsibility": number,
  "overall": number
}

Canonical input:
${JSON.stringify(
  sanitizeInputForAi(
    input,
    logic,
  ),
)}
`.trim();
}

function createResponseFormat(
  strict: boolean,
) {
  if (!strict) {
    return {
      type: "json_object",
    };
  }

  return {
    type: "json_schema",

    json_schema: {
      name: "humob_daily_rating",
      strict: true,

      schema: {
        type: "object",
        additionalProperties: false,

        properties: {
          energy: {
            type: "number",
            minimum: 0,
            maximum: 10,
          },

          focus: {
            type: "number",
            minimum: 0,
            maximum: 10,
          },

          discipline: {
            type: "number",
            minimum: 0,
            maximum: 10,
          },

          responsibility: {
            type: "number",
            minimum: 0,
            maximum: 10,
          },

          overall: {
            type: "number",
            minimum: 0,
            maximum: 10,
          },
        },

        required: [
          "energy",
          "focus",
          "discipline",
          "responsibility",
          "overall",
        ],
      },
    },
  };
}

function validateSuggestedRatings(
  value: unknown,
  logic: LogicScoreResult,
): AiSuggestedRatings {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new ProviderError(
      "AI output is not a JSON object.",
      true,
    );
  }

  const record =
    value as Record<string, unknown>;

  const expectedKeys = [
    "energy",
    "focus",
    "discipline",
    "responsibility",
    "overall",
  ] as const;

  const actualKeys =
    Object.keys(record).sort();

  const sortedExpectedKeys = [
    ...expectedKeys,
  ].sort();

  if (
    actualKeys.join(",") !==
    sortedExpectedKeys.join(",")
  ) {
    throw new ProviderError(
      "AI output contains missing or additional keys.",
      true,
    );
  }

  const result =
    {} as AiSuggestedRatings;

  for (const key of expectedKeys) {
    const raw = record[key];

    if (
      typeof raw !== "number" ||
      !Number.isFinite(raw)
    ) {
      throw new ProviderError(
        `AI output ${key} is not a finite number.`,
        true,
      );
    }

    if (raw < 0 || raw > 10) {
      throw new ProviderError(
        `AI output ${key} is outside 0.0-10.0.`,
        true,
      );
    }

    result[key] = round1(
      clamp(raw),
    );
  }

  for (
    const key of [
      "energy",
      "focus",
      "discipline",
      "responsibility",
    ] as const
  ) {
    if (
      !logic.hasData[key] &&
      result[key] !== 0
    ) {
      throw new ProviderError(
        `AI output ${key} must be 0.0 because the dimension has no data.`,
        true,
      );
    }
  }

  return result;
}

async function callProvider(
  config: ProviderConfig,
  input: CanonicalRatingInput,
  logic: LogicScoreResult,
): Promise<AiSuggestedRatings> {
  const controller =
    new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, AI_REQUEST_TIMEOUT_MS);

  try {
    const requestBody:
      Record<string, unknown> = {
      model: config.model,

      temperature: 0,

      max_completion_tokens: 250,

      response_format:
        createResponseFormat(
          config.supportsStrictSchema,
        ),

      messages: [
        {
          role: "system",

          content:
            "You are HuMob AI Rating Engine. Return only the requested JSON object.",
        },
        {
          role: "user",

          content: buildPrompt(
            input,
            logic,
          ),
        },
      ],
    };

    /*
     * Groq GPT-OSS supports explicit
     * reasoning effort.
     */
    if (
      config.provider === "groq" &&
      config.model.startsWith(
        "openai/gpt-oss-",
      )
    ) {
      requestBody.reasoning_effort =
        "low";

      requestBody.include_reasoning =
        false;
    }

    const response = await fetch(
      config.endpoint,
      {
        method: "POST",

        signal:
          controller.signal,

        headers: {
          Authorization:
            `Bearer ${config.apiKey}`,

          "Content-Type":
            "application/json",
        },

        body: JSON.stringify(
          requestBody,
        ),
      },
    );

    const payload =
      (
        await response
          .json()
          .catch(() => null)
      ) as ProviderResponse | null;

    if (!response.ok) {
      const providerMessage =
        payload?.error?.message ??
        `Provider returned HTTP ${response.status}.`;

      console.error(
        "AI provider request failed",
        {
          provider:
            config.provider,

          status:
            response.status,

          message:
            providerMessage.slice(
              0,
              300,
            ),
        },
      );

      throw new ProviderError(
        providerMessage,

        RETRYABLE_HTTP_STATUSES.has(
          response.status,
        ),

        response.status,
      );
    }

    const content =
      payload?.choices?.[0]
        ?.message?.content;

    if (!content) {
      throw new ProviderError(
        "Provider returned an empty completion.",
        true,
      );
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(content);
    } catch {
      throw new ProviderError(
        "Provider returned invalid JSON.",
        true,
      );
    }

    return validateSuggestedRatings(
      parsed,
      logic,
    );
  } catch (error) {
    if (
      error instanceof ProviderError
    ) {
      throw error;
    }

    if (
      error instanceof DOMException &&
      error.name === "AbortError"
    ) {
      throw new ProviderError(
        "Provider request timed out.",
        true,
      );
    }

    throw new ProviderError(
      safeErrorMessage(error),
      true,
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function tryProvider(
  config: ProviderConfig,
  input: CanonicalRatingInput,
  logic: LogicScoreResult,
): Promise<{
  result: AiProviderResult | null;
  flags: string[];
}> {
  const flags: string[] = [];

  for (
    let attempt = 1;
    attempt <= config.maxAttempts;
    attempt += 1
  ) {
    try {
      const suggestedRatings =
        await callProvider(
          config,
          input,
          logic,
        );

      return {
        result: {
          source:
            config.source,

          provider:
            config.provider,

          model:
            config.model,

          suggestedRatings,

          validationFlags: [
            `${config.provider}_attempt_${attempt}_success`,
          ],
        },

        flags,
      };
    } catch (error) {
      const providerError =
        error instanceof ProviderError
          ? error
          : new ProviderError(
              safeErrorMessage(error),
              true,
            );

      flags.push(
        `${config.provider}_attempt_${attempt}_failed:${
          providerError.status ??
          "network_or_validation"
        }`,
      );

      if (
        !providerError.retryable ||
        attempt === config.maxAttempts
      ) {
        break;
      }

      await sleep(
        250 *
          2 ** (attempt - 1),
      );
    }
  }

  return {
    result: null,
    flags,
  };
}

export async function runAiProviders(
  input: CanonicalRatingInput,
  logic: LogicScoreResult,
): Promise<AiProviderRunResult> {
  const validationFlags: string[] =
    [];

  const groqApiKey =
    Deno.env.get("GROQ_API_KEY");

  if (groqApiKey) {
    const primary =
      await tryProvider(
        {
          provider:
            PRIMARY_AI_PROVIDER,

          endpoint:
            PRIMARY_AI_ENDPOINT,

          apiKey:
            groqApiKey,

          model:
            PRIMARY_AI_MODEL,

          source:
            "ai_primary",

          maxAttempts:
            PRIMARY_AI_MAX_ATTEMPTS,

          supportsStrictSchema:
            true,
        },
        input,
        logic,
      );

    validationFlags.push(
      ...primary.flags,
    );

    if (primary.result) {
      return {
        result:
          primary.result,

        validationFlags,
      };
    }
  } else {
    validationFlags.push(
      "groq_secret_missing",
    );
  }

  /*
   * Optional OpenAI-compatible backup.
   *
   * Required secrets:
   * BACKUP_AI_API_KEY
   * BACKUP_AI_ENDPOINT
   * BACKUP_AI_MODEL
   *
   * Optional:
   * BACKUP_AI_PROVIDER
   * BACKUP_AI_STRICT_SCHEMA=true
   */
  const backupApiKey =
    Deno.env.get(
      "BACKUP_AI_API_KEY",
    );

  const backupEndpoint =
    Deno.env.get(
      "BACKUP_AI_ENDPOINT",
    );

  const backupModel =
    Deno.env.get(
      "BACKUP_AI_MODEL",
    );

  const backupProvider =
    Deno.env.get(
      "BACKUP_AI_PROVIDER",
    ) ?? "backup";

  const backupStrictSchema =
    Deno.env.get(
      "BACKUP_AI_STRICT_SCHEMA",
    ) === "true";

  if (
    backupApiKey &&
    backupEndpoint &&
    backupModel
  ) {
    const backup =
      await tryProvider(
        {
          provider:
            backupProvider,

          endpoint:
            backupEndpoint,

          apiKey:
            backupApiKey,

          model:
            backupModel,

          source:
            "ai_fallback",

          maxAttempts:
            BACKUP_AI_MAX_ATTEMPTS,

          supportsStrictSchema:
            backupStrictSchema,
        },
        input,
        logic,
      );

    validationFlags.push(
      ...backup.flags,
    );

    if (backup.result) {
      return {
        result:
          backup.result,

        validationFlags,
      };
    }
  } else {
    validationFlags.push(
      "backup_provider_not_configured",
    );
  }

  return {
    result: null,
    validationFlags,
  };
}
