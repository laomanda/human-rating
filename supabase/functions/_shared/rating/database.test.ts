import { authenticateRequest, createAdminClient } from "./database.ts";

import type { DatabaseClient } from "./types.ts";

import type { EnvironmentReader } from "./database.ts";

import { HttpError } from "./utils.ts";

const UNIT_SUPABASE_URL = "https://unit.supabase.co";

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

function readEnv(
  values: Record<
    string,
    string | undefined
  >,
): EnvironmentReader {
  return (name) => values[name];
}

function selectedAdminKey(
  values: Record<
    string,
    string | undefined
  >,
): string {
  const client = createAdminClient(
    readEnv(values),
  ) as DatabaseClient & {
    supabaseKey?: string;
  };

  assert(
    typeof client.supabaseKey ===
      "string",
    "Admin client did not retain the selected key for inspection.",
  );

  return client.supabaseKey;
}

async function expectHttpError(
  callback: () => void | Promise<void>,
  expectedStatus: number,
  expectedCode: string,
): Promise<void> {
  try {
    await callback();
  } catch (error) {
    assert(
      error instanceof HttpError,
      "Expected an HttpError.",
    );

    assertEquals(
      error.status,
      expectedStatus,
      "HttpError status mismatch.",
    );

    assertEquals(
      error.code,
      expectedCode,
      "HttpError code mismatch.",
    );

    return;
  }

  throw new Error(
    "Expected callback to throw.",
  );
}

type ConsoleMethod =
  | "error"
  | "info"
  | "log"
  | "warn";

async function captureConsole(
  callback: () => void | Promise<unknown>,
): Promise<string> {
  const methods: ConsoleMethod[] = [
    "error",
    "info",
    "log",
    "warn",
  ];

  const mutableConsole = console as unknown as Record<
    ConsoleMethod,
    (...data: unknown[]) => void
  >;

  const originals = new Map<
    ConsoleMethod,
    (...data: unknown[]) => void
  >();

  const entries: unknown[][] = [];

  for (const method of methods) {
    originals.set(
      method,
      mutableConsole[method],
    );

    mutableConsole[method] = (...data) => {
      entries.push([
        method,
        ...data,
      ]);
    };
  }

  try {
    await callback();
  } finally {
    for (const method of methods) {
      const original = originals.get(method);

      if (original) {
        mutableConsole[method] = original;
      }
    }
  }

  return JSON.stringify(entries);
}

function mockAdmin(
  getUser: (
    token: string,
  ) => Promise<unknown>,
): DatabaseClient {
  return {
    auth: {
      getUser,
    },
  } as unknown as DatabaseClient;
}

Deno.test(
  "createAdminClient prefers SUPABASE_SECRET_KEY over legacy service role",
  () => {
    const selected = selectedAdminKey({
      SUPABASE_URL: UNIT_SUPABASE_URL,
      SUPABASE_SECRET_KEY: "unit-direct-key",
      SUPABASE_SERVICE_ROLE_KEY: "unit-legacy-key",
    });

    assertEquals(
      selected,
      "unit-direct-key",
      "Direct Supabase secret key must win over legacy service role.",
    );
  },
);

Deno.test(
  "createAdminClient prefers SUPABASE_SECRET_KEYS default over legacy service role",
  () => {
    const selected = selectedAdminKey({
      SUPABASE_URL: UNIT_SUPABASE_URL,
      SUPABASE_SECRET_KEYS: JSON.stringify({
        default: "unit-dictionary-default-key",
        secondary: "unit-dictionary-secondary-key",
      }),
      SUPABASE_SERVICE_ROLE_KEY: "unit-legacy-key",
    });

    assertEquals(
      selected,
      "unit-dictionary-default-key",
      "Dictionary default key must win over legacy service role.",
    );
  },
);

Deno.test(
  "createAdminClient uses first non-empty SUPABASE_SECRET_KEYS string when default is absent",
  () => {
    const selected = selectedAdminKey({
      SUPABASE_URL: UNIT_SUPABASE_URL,
      SUPABASE_SECRET_KEYS: JSON.stringify({
        empty: " ",
        first: "unit-dictionary-first-key",
        ignored: 42,
      }),
      SUPABASE_SERVICE_ROLE_KEY: "unit-legacy-key",
    });

    assertEquals(
      selected,
      "unit-dictionary-first-key",
      "First non-empty dictionary string must be selected when default is absent.",
    );
  },
);

Deno.test(
  "createAdminClient ignores empty SUPABASE_SECRET_KEYS values",
  () => {
    const selected = selectedAdminKey({
      SUPABASE_URL: UNIT_SUPABASE_URL,
      SUPABASE_SECRET_KEYS: JSON.stringify({
        default: " ",
        secondary: "",
      }),
      SUPABASE_SERVICE_ROLE_KEY: "unit-legacy-key",
    });

    assertEquals(
      selected,
      "unit-legacy-key",
      "Empty dictionary values must fall through to legacy fallback.",
    );
  },
);

Deno.test(
  "malformed SUPABASE_SECRET_KEYS does not expose raw key material",
  async () => {
    const sentinel = "unit-key-never-log";

    const output = await captureConsole(() => {
      const selected = selectedAdminKey({
        SUPABASE_URL: UNIT_SUPABASE_URL,
        SUPABASE_SECRET_KEYS: `{"default":"${sentinel}",`,
        SUPABASE_SERVICE_ROLE_KEY: "unit-legacy-key",
      });

      assertEquals(
        selected,
        "unit-legacy-key",
        "Malformed dictionary must safely continue to fallback.",
      );
    });

    assert(
      output.includes(
        "SUPABASE_SECRET_KEYS is not valid JSON.",
      ),
      "Malformed dictionary must emit only a safe diagnostic.",
    );

    assert(
      !output.includes(sentinel),
      "Malformed dictionary log exposed raw key material.",
    );
  },
);

Deno.test(
  "createAdminClient keeps SUPABASE_SERVICE_ROLE_KEY as fallback",
  () => {
    const selected = selectedAdminKey({
      SUPABASE_URL: UNIT_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: "unit-legacy-key",
    });

    assertEquals(
      selected,
      "unit-legacy-key",
      "Legacy service role must remain the final fallback.",
    );
  },
);

Deno.test(
  "createAdminClient reports SUPABASE_ENV_MISSING when admin credentials are absent",
  async () => {
    await expectHttpError(
      () => {
        createAdminClient(
          readEnv({
            SUPABASE_URL: UNIT_SUPABASE_URL,
          }),
        );
      },
      500,
      "SUPABASE_ENV_MISSING",
    );
  },
);

Deno.test(
  "createAdminClient rejects empty SUPABASE_URL",
  async () => {
    await expectHttpError(
      () => {
        createAdminClient(
          readEnv({
            SUPABASE_URL: " ",
            SUPABASE_SECRET_KEY: "unit-direct-key",
          }),
        );
      },
      500,
      "SUPABASE_ENV_MISSING",
    );
  },
);

Deno.test(
  "authenticateRequest accepts matching job secret",
  async () => {
    let getUserCalled = false;

    const auth = await authenticateRequest(
      new Request(
        "https://unit.test",
        {
          headers: {
            "x-humob-job-secret": "unit-job-key",
          },
        },
      ),
      mockAdmin(async () => {
        getUserCalled = true;

        return {
          data: {
            user: null,
          },
          error: null,
        };
      }),
      readEnv({
        HUMOB_RATING_JOB_SECRET: "unit-job-key",
      }),
    );

    assertEquals(
      auth,
      {
        kind: "job",
      },
      "Matching job secret must authenticate as job.",
    );

    assert(
      !getUserCalled,
      "Matching job secret should not call user auth.",
    );
  },
);

Deno.test(
  "authenticateRequest accepts whitespace-normalized job secret",
  async () => {
    const auth = await authenticateRequest(
      new Request(
        "https://unit.test",
        {
          headers: {
            "x-humob-job-secret": "  unit-job-key  ",
          },
        },
      ),
      mockAdmin(async () => ({
        data: {
          user: null,
        },
        error: null,
      })),
      readEnv({
        HUMOB_RATING_JOB_SECRET: " unit-job-key ",
      }),
    );

    assertEquals(
      auth,
      {
        kind: "job",
      },
      "Whitespace around the job secret must be normalized.",
    );
  },
);

Deno.test(
  "authenticateRequest rejects empty job secret values",
  async () => {
    await expectHttpError(
      async () => {
        await authenticateRequest(
          new Request(
            "https://unit.test",
            {
              headers: {
                "x-humob-job-secret": "   ",
              },
            },
          ),
          mockAdmin(async () => ({
            data: {
              user: null,
            },
            error: null,
          })),
          readEnv({
            HUMOB_RATING_JOB_SECRET: "   ",
          }),
        );
      },
      401,
      "AUTH_REQUIRED",
    );
  },
);

Deno.test(
  "authenticateRequest rejects missing environment secret",
  async () => {
    await expectHttpError(
      async () => {
        await authenticateRequest(
          new Request(
            "https://unit.test",
            {
              headers: {
                "x-humob-job-secret": "unit-job-key",
              },
            },
          ),
          mockAdmin(async () => ({
            data: {
              user: null,
            },
            error: null,
          })),
          readEnv({}),
        );
      },
      401,
      "AUTH_REQUIRED",
    );
  },
);

Deno.test(
  "authenticateRequest rejects incorrect job secret",
  async () => {
    await expectHttpError(
      async () => {
        await authenticateRequest(
          new Request(
            "https://unit.test",
            {
              headers: {
                "x-humob-job-secret": "wrong-unit-job-key",
              },
            },
          ),
          mockAdmin(async () => {
            throw new Error(
              "User auth should not run without a bearer token.",
            );
          }),
          readEnv({
            HUMOB_RATING_JOB_SECRET: "unit-job-key",
          }),
        );
      },
      401,
      "AUTH_REQUIRED",
    );
  },
);

Deno.test(
  "authenticateRequest does not log secret values",
  async () => {
    const sentinel = "unit-job-secret-never-log";

    const output = await captureConsole(() =>
      authenticateRequest(
        new Request(
          "https://unit.test",
          {
            headers: {
              "x-humob-job-secret": ` ${sentinel} `,
            },
          },
        ),
        mockAdmin(async () => ({
          data: {
            user: null,
          },
          error: null,
        })),
        readEnv({
          HUMOB_RATING_JOB_SECRET: ` ${sentinel} `,
        }),
      )
    );

    assert(
      !output.includes(sentinel),
      "Secret value leaked into auth diagnostics.",
    );
  },
);

Deno.test(
  "authenticateRequest preserves user bearer authentication",
  async () => {
    let receivedToken:
      | string
      | null = null;

    const auth = await authenticateRequest(
      new Request(
        "https://unit.test",
        {
          headers: {
            Authorization: "Bearer unit-user-token",
            "x-humob-job-secret": "wrong-unit-job-key",
          },
        },
      ),
      mockAdmin(async (token) => {
        receivedToken = token;

        return {
          data: {
            user: {
              id: "unit-user-id",
            },
          },
          error: null,
        };
      }),
      readEnv({
        HUMOB_RATING_JOB_SECRET: "unit-job-key",
      }),
    );

    assertEquals(
      receivedToken,
      "unit-user-token",
      "Bearer token must be passed to admin.auth.getUser.",
    );

    assertEquals(
      auth,
      {
        kind: "user",
        userId: "unit-user-id",
      },
      "Bearer auth must still authenticate a valid user.",
    );
  },
);

Deno.test(
  "admin credential resolution does not log selected key material",
  async () => {
    const sentinel = "unit-key-never-output";

    const output = await captureConsole(() => {
      const selected = selectedAdminKey({
        SUPABASE_URL: UNIT_SUPABASE_URL,
        SUPABASE_SECRET_KEY: sentinel,
        SUPABASE_SERVICE_ROLE_KEY: "unit-legacy-key",
      });

      assertEquals(
        selected,
        sentinel,
        "Direct key should still be selected.",
      );
    });

    assertEquals(
      output,
      "[]",
      "Credential resolution should not write selected key material to console.",
    );
  },
);
