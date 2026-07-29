import {
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { formatScore } from "@/features/dashboard/formatters";

type RatingTrendState =
  | "Improving"
  | "Stable"
  | "Declining"
  | "Not enough data";

type RatingTrendProps = {
  overallRatings: Array<number | null>;
};

type TrendResult = {
  state: RatingTrendState;
  recentAverage: number | null;
  previousAverage: number | null;
  delta: number | null;
};

const MINIMUM_RATING_COUNT = 4;
const MAXIMUM_GROUP_SIZE = 3;
const STABLE_TOLERANCE = 0.2;

function average(values: number[]): number {
  return values.reduce(
    (total, value) => total + value,
    0,
  ) / values.length;
}

function calculateTrend(
  overallRatings: Array<number | null>,
): TrendResult {
  const validRatings = overallRatings.filter(
    (value): value is number =>
      value !== null &&
      Number.isFinite(value),
  );

  if (
    validRatings.length <
    MINIMUM_RATING_COUNT
  ) {
    return {
      state: "Not enough data",
      recentAverage: null,
      previousAverage: null,
      delta: null,
    };
  }

  /*
   * Compare the most recent available group against
   * the immediately preceding group. The group size is
   * capped so one old period does not dominate the signal.
   */
  const groupSize = Math.min(
    MAXIMUM_GROUP_SIZE,
    Math.floor(validRatings.length / 2),
  );

  const recentAverage = average(
    validRatings.slice(0, groupSize),
  );

  const previousAverage = average(
    validRatings.slice(
      groupSize,
      groupSize * 2,
    ),
  );

  const delta =
    recentAverage - previousAverage;

  if (delta > STABLE_TOLERANCE) {
    return {
      state: "Improving",
      recentAverage,
      previousAverage,
      delta,
    };
  }

  if (delta < -STABLE_TOLERANCE) {
    return {
      state: "Declining",
      recentAverage,
      previousAverage,
      delta,
    };
  }

  return {
    state: "Stable",
    recentAverage,
    previousAverage,
    delta,
  };
}

function trendIcon(state: RatingTrendState) {
  switch (state) {
    case "Improving":
      return <TrendingUp className="h-5 w-5" />;

    case "Declining":
      return (
        <TrendingDown className="h-5 w-5" />
      );

    case "Stable":
    case "Not enough data":
      return <Minus className="h-5 w-5" />;
  }
}

function formatDelta(
  delta: number | null,
): string {
  if (delta === null) {
    return "Need 4 ratings";
  }

  const sign = delta > 0 ? "+" : "";

  return `${sign}${formatScore(delta)}`;
}

export function RatingTrend({
  overallRatings,
}: RatingTrendProps) {
  const trend = calculateTrend(
    overallRatings,
  );

  return (
    <article className="rounded-2xl border border-app-border bg-app-surface p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="text-zinc-500">
          {trendIcon(trend.state)}
        </div>

        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-300">
          {trend.state}
        </span>
      </div>

      <p className="mt-5 text-sm text-zinc-500">
        Recent trend
      </p>

      <p className="mt-1 text-3xl font-semibold tracking-tight text-white">
        {formatDelta(trend.delta)}
      </p>

      <p className="mt-3 text-xs leading-5 text-zinc-600">
        {trend.recentAverage !== null &&
        trend.previousAverage !== null
          ? `Recent ${formatScore(
              trend.recentAverage,
            )} vs previous ${formatScore(
              trend.previousAverage,
            )}`
          : "Based on completed ratings only."}
      </p>
    </article>
  );
}
