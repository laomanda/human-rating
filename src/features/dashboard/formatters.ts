export const DEFAULT_TIME_ZONE = "Asia/Jakarta";

export function toNullableNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function toInteger(value: unknown, fallback = 0): number {
  const parsed = toNullableNumber(value);

  if (parsed === null) {
    return fallback;
  }

  return Math.trunc(parsed);
}

export function formatScore(value: number | null): string {
  return value === null ? "—" : value.toFixed(1);
}

export function formatStatus(value: string | null | undefined): string {
  if (!value) {
    return "Unknown";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function normalizeTimeZone(
  value: string | null | undefined,
): string {
  if (!value) {
    return DEFAULT_TIME_ZONE;
  }

  try {
    Intl.DateTimeFormat("en-US", {
      timeZone: value,
    }).format();

    return value;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}

export function getDateKeyForTimeZone(
  date: Date,
  timeZone: string,
): string {
  const safeTimeZone = normalizeTimeZone(timeZone);

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: safeTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    return date.toISOString().slice(0, 10);
  }

  return `${year}-${month}-${day}`;
}

export function formatDateOnly(value: string | null): string {
  if (!value) {
    return "—";
  }

  const [year, month, day] = value
    .split("-")
    .map((part) => Number(part));

  if (!year || !month || !day) {
    return value;
  }

  const date = new Date(Date.UTC(year, month - 1, day, 12));

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(
  value: string | null,
  timeZone = DEFAULT_TIME_ZONE,
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: normalizeTimeZone(timeZone),
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatClock(value: string | null): string {
  if (!value) {
    return "—";
  }

  return value.slice(0, 5);
}

export function getInitials(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}