import { Info, ShieldCheck } from "lucide-react";

const SOURCE_LABELS: Readonly<Record<string, string>> = {
  ai_primary: "AI-assisted rating",
  ai_fallback: "AI fallback rating",
  logic_fallback: "Logic fallback rating",
  no_activity: "No activity rating",
};

const INTERNAL_FLAG_PREFIXES = [
  "humob-",
  "ai_confidence_",
] as const;

const INTERNAL_FLAG_TERMS = [
  "debug",
  "model",
  "provider",
  "secret",
  "token",
] as const;

type RatingMetadataProps = {
  source: string | null;
  validationFlags?: unknown;
};

function formatSource(
  source: string | null,
): string {
  if (!source) {
    return "Unknown rating source";
  }

  return (
    SOURCE_LABELS[source] ??
    source
      .replaceAll("_", " ")
      .replace(/\b\w/g, (character) =>
        character.toUpperCase(),
      )
  );
}

function isDisplayableFlag(
  value: string,
): boolean {
  const normalized = value
    .trim()
    .toLowerCase();

  if (!normalized) {
    return false;
  }

  if (
    INTERNAL_FLAG_PREFIXES.some((prefix) =>
      normalized.startsWith(prefix),
    )
  ) {
    return false;
  }

  return !INTERNAL_FLAG_TERMS.some((term) =>
    normalized.includes(term),
  );
}

function formatFlag(value: string): string {
  const normalized = value
    .trim()
    .replaceAll("_", " ");

  if (!normalized) {
    return "";
  }

  return normalized.charAt(0).toUpperCase() +
    normalized.slice(1);
}

function normalizeValidationFlags(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === "string",
    )
    .filter(isDisplayableFlag)
    .map(formatFlag)
    .filter(Boolean);
}

export function RatingMetadata({
  source,
  validationFlags,
}: RatingMetadataProps) {
  const flags = normalizeValidationFlags(
    validationFlags,
  );

  return (
    <section className="rounded-2xl border border-app-border bg-app-surface p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-400">
          <ShieldCheck className="h-5 w-5" />
        </div>

        <div>
          <h2 className="font-medium text-white">
            Rating Metadata
          </h2>

          <p className="text-sm text-zinc-500">
            {formatSource(source)}
          </p>
        </div>
      </div>

      {flags.length > 0 ? (
        <div className="mt-5">
          <div className="mb-3 flex items-center gap-2 text-sm text-zinc-400">
            <Info className="h-4 w-4" />
            Validation flags
          </div>

          <div className="flex flex-wrap gap-2">
            {flags.map((flag) => (
              <span
                key={flag}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-300"
              >
                {flag}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
