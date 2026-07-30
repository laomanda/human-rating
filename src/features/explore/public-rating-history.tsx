import { ChartNoAxesCombined } from "lucide-react";

import { formatScore } from "@/features/dashboard/formatters";

import type { PublicRatingHistoryPoint } from "@/features/explore/explore-types";

type PublicRatingHistoryProps = {
  history: PublicRatingHistoryPoint[];
};

const CHART_WIDTH = 600;
const CHART_HEIGHT = 160;
const PADDING_X = 18;
const PADDING_Y = 16;
const MAXIMUM_SCORE = 10;
const HISTORY_POINT_LIMIT = 20;

function clampScore(value: number): number {
  return Math.min(
    MAXIMUM_SCORE,
    Math.max(0, value),
  );
}

function formatShortDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

export function PublicRatingHistory({
  history,
}: PublicRatingHistoryProps) {
  const points = history.slice(-HISTORY_POINT_LIMIT);

  if (points.length < 2) {
    return (
      <article className="rounded-2xl border border-app-border bg-app-surface p-5 sm:p-6">
        <HistoryHeader />

        <div className="mt-6 flex min-h-52 items-center justify-center rounded-xl border border-dashed border-white/10 px-6 text-center">
          <div className="max-w-sm">
            <p className="font-medium text-zinc-300">
              Riwayat rating belum cukup
            </p>

            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Minimal dua rating final diperlukan untuk menampilkan perjalanan rating.
            </p>
          </div>
        </div>
      </article>
    );
  }

  const chartInnerWidth =
    CHART_WIDTH - PADDING_X * 2;
  const chartInnerHeight =
    CHART_HEIGHT - PADDING_Y * 2;
  const pathPoints = points.map((point, index) => {
    const x =
      PADDING_X +
      (index / (points.length - 1)) * chartInnerWidth;
    const y =
      PADDING_Y +
      (1 -
        clampScore(point.overallRating) /
          MAXIMUM_SCORE) *
        chartInnerHeight;

    return {
      ...point,
      x,
      y,
    };
  });

  const polylinePoints = pathPoints
    .map((point) => `${point.x},${point.y}`)
    .join(" ");
  const firstPoint = points[0];
  const lastPoint = points.at(-1) ?? firstPoint;

  return (
    <article className="min-w-0 rounded-2xl border border-app-border bg-app-surface p-5 sm:p-6">
      <HistoryHeader />

      <div className="mt-6 rounded-xl border border-white/5 bg-black/20 p-3 sm:p-4">
        <svg
          role="img"
          aria-label="Perjalanan rating overall"
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="h-40 w-full overflow-visible"
          preserveAspectRatio="none"
        >
          <title>Perjalanan rating overall</title>

          {[0, 5, 10].map((score) => {
            const y =
              PADDING_Y +
              (1 - score / MAXIMUM_SCORE) *
                chartInnerHeight;

            return (
              <line
                key={score}
                x1={PADDING_X}
                x2={CHART_WIDTH - PADDING_X}
                y1={y}
                y2={y}
                stroke="currentColor"
                strokeOpacity="0.12"
                strokeDasharray="4 4"
                className="text-zinc-500"
              />
            );
          })}

          <polyline
            points={polylinePoints}
            fill="none"
            stroke="var(--rating-perfect)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {pathPoints.map((point) => (
            <circle
              key={point.createdAt}
              cx={point.x}
              cy={point.y}
              r="3.5"
              fill="var(--app-surface)"
              stroke="var(--rating-perfect)"
              strokeWidth="2"
            />
          ))}
        </svg>

        <div className="mt-3 flex items-center justify-between gap-4 text-xs text-zinc-600">
          <span>{formatShortDate(firstPoint.createdAt)}</span>

          <span className="text-zinc-400">
            Terakhir {formatScore(lastPoint.overallRating)}
          </span>

          <span>{formatShortDate(lastPoint.createdAt)}</span>
        </div>
      </div>
    </article>
  );
}

function HistoryHeader() {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-400">
        <ChartNoAxesCombined
          aria-hidden="true"
          className="h-5 w-5"
        />
      </div>

      <div className="min-w-0">
        <h2 className="font-medium text-white">
          Perjalanan Rating
        </h2>

        <p className="text-sm text-zinc-500">
          Urutan rating overall berdasarkan waktu rating final dibuat.
        </p>
      </div>
    </div>
  );
}
