export class HttpError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(
    status: number,
    code: string,
    message: string,
  ) {
    super(message);

    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }
}

export function clamp(
  value: number,
  minimum = 0,
  maximum = 10,
): number {
  return Math.min(
    maximum,
    Math.max(minimum, value),
  );
}

export function round1(
  value: number,
): number {
  return (
    Math.round(
      (value + Number.EPSILON) * 10,
    ) / 10
  );
}

export function toFiniteNumber(
  value: unknown,
  fallback = 0,
): number {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim() !== ""
  ) {
    const parsed = Number(value);

    return Number.isFinite(parsed)
      ? parsed
      : fallback;
  }

  return fallback;
}

export function toInteger(
  value: unknown,
  fallback = 0,
): number {
  return Math.trunc(
    toFiniteNumber(value, fallback),
  );
}

export function isUuid(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

export function sleep(
  milliseconds: number,
): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export function stableStringify(
  value: unknown,
): string {
  if (
    value === null ||
    typeof value !== "object"
  ) {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value
      .map(stableStringify)
      .join(",")}]`;
  }

  const record =
    value as Record<string, unknown>;

  const keys = Object.keys(record).sort();

  return `{${keys
    .map(
      (key) =>
        `${JSON.stringify(
          key,
        )}:${stableStringify(record[key])}`,
    )
    .join(",")}}`;
}

export function safeErrorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message.slice(0, 300);
  }

  return String(error).slice(0, 300);
}

export function timingSafeEqual(
  left: string,
  right: string,
): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let difference = 0;

  for (
    let index = 0;
    index < left.length;
    index += 1
  ) {
    difference |=
      left.charCodeAt(index) ^
      right.charCodeAt(index);
  }

  return difference === 0;
}

export function uniqueBySignature<
  T extends {
    normalized_signature: string;
  },
>(
  rows: T[],
): T[] {
  const unique = new Map<string, T>();

  for (const row of rows) {
    const key = row.normalized_signature
      .trim()
      .toLowerCase();

    if (!unique.has(key)) {
      unique.set(key, row);
    }
  }

  return [...unique.values()];
}