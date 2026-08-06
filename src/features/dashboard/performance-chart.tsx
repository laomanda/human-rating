"use client";

import { LineChart as LineChartIcon } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatScore } from "@/features/dashboard/formatters";
import type { DashboardHistoryItem } from "@/features/dashboard/types";

type PerformanceChartProps = {
  history: DashboardHistoryItem[];
};

type ChartPoint = {
  date: string;
  label: string;
  overall: number;
};

function formatChartDate(value: string): string {
  const [year, month, day] = value
    .split("-")
    .map((part) => Number(part));

  if (!year || !month || !day) {
    return value;
  }

  const date = new Date(
    Date.UTC(year, month - 1, day, 12),
  );

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
  }).format(date);
}

function buildChartData(
  history: DashboardHistoryItem[],
): ChartPoint[] {
  return history
    .flatMap(({ match, rating }) => {
      const overall = rating?.overall_rating;

      if (
        overall === null ||
        overall === undefined ||
        !Number.isFinite(overall)
      ) {
        return [];
      }

      return [
        {
          date: match.match_date,
          label: formatChartDate(match.match_date),
          overall,
        },
      ];
    })
    .sort((first, second) =>
      first.date.localeCompare(second.date),
    );
}

export function PerformanceChart({
  history,
}: PerformanceChartProps) {
  const chartData = buildChartData(history);

  return (
    <article className="min-w-0 rounded-2xl border border-app-border bg-app-surface p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-400">
          <LineChartIcon className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <h3 className="font-medium text-white">
            Grafik Rating Keseluruhan
          </h3>

          <p className="text-sm text-zinc-500">
            Perjalanan rating final berdasarkan tanggal Daily Match.
          </p>
        </div>
      </div>

      {chartData.length >= 2 ? (
        <div
          className="mt-6 h-72 w-full"
          aria-label="Grafik perkembangan rating keseluruhan"
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={0}
          >
            <LineChart
              data={chartData}
              margin={{
                top: 8,
                right: 8,
                bottom: 0,
                left: -20,
              }}
              accessibilityLayer
            >
              <CartesianGrid
                stroke="var(--app-border)"
                strokeDasharray="4 4"
                vertical={false}
              />

              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                minTickGap={24}
                tick={{
                  fill: "var(--muted-foreground)",
                  fontSize: 12,
                }}
              />

              <YAxis
                domain={[0, 10]}
                ticks={[0, 2, 4, 6, 8, 10]}
                axisLine={false}
                tickLine={false}
                width={42}
                tickFormatter={(value: number) =>
                  formatScore(value)
                }
                tick={{
                  fill: "var(--muted-foreground)",
                  fontSize: 12,
                }}
              />

              <Tooltip
                cursor={{
                  stroke: "var(--app-border)",
                  strokeWidth: 1,
                }}
                contentStyle={{
                  background: "var(--app-surface-muted)",
                  border: "1px solid var(--app-border)",
                  borderRadius: "12px",
                  color: "var(--foreground)",
                }}
                labelStyle={{
                  color: "var(--muted)",
                  marginBottom: "4px",
                }}
                itemStyle={{
                  color: "var(--foreground)",
                }}
              />

              <Line
                type="monotone"
                dataKey="overall"
                name="Overall"
                stroke="var(--rating-perfect)"
                strokeWidth={2.5}
                dot={{
                  r: 3,
                  fill: "var(--app-surface)",
                  stroke: "var(--rating-perfect)",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 5,
                  fill: "var(--rating-perfect)",
                  stroke: "var(--app-surface)",
                  strokeWidth: 2,
                }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-6 flex min-h-72 items-center justify-center rounded-xl border border-dashed border-white/10">
          <div className="max-w-sm px-6 text-center">
            <p className="font-medium text-zinc-300">
              Data grafik belum cukup
            </p>

            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Minimal dua rating final diperlukan untuk menampilkan perjalanan performa.
            </p>
          </div>
        </div>
      )}
    </article>
  );
}