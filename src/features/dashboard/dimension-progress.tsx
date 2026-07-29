import type { ReactNode } from "react";

import {
  BatteryCharging,
  CheckCircle2,
  ClipboardCheck,
  Focus,
  Layers3,
} from "lucide-react";

import { formatScore } from "@/features/dashboard/formatters";
import type { DashboardAggregate } from "@/features/dashboard/types";

type DimensionProgressProps = {
  aggregate: DashboardAggregate;
};

type DimensionItem = {
  label: string;
  value: number | null;
  icon: ReactNode;
};

const MAXIMUM_SCORE = 10;

function toProgressPercentage(
  value: number | null,
): number {
  if (value === null || !Number.isFinite(value)) {
    return 0;
  }

  const clamped = Math.min(
    MAXIMUM_SCORE,
    Math.max(0, value),
  );

  return (clamped / MAXIMUM_SCORE) * 100;
}

export function DimensionProgress({
  aggregate,
}: DimensionProgressProps) {
  const dimensions: DimensionItem[] = [
    {
      label: "Energy",
      value: aggregate.averageEnergy,
      icon: <BatteryCharging className="h-4 w-4" />,
    },
    {
      label: "Focus",
      value: aggregate.averageFocus,
      icon: <Focus className="h-4 w-4" />,
    },
    {
      label: "Discipline",
      value: aggregate.averageDiscipline,
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
    {
      label: "Responsibility",
      value: aggregate.averageResponsibility,
      icon: <ClipboardCheck className="h-4 w-4" />,
    },
  ];

  return (
    <article className="rounded-2xl border border-app-border bg-app-surface p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-400">
          <Layers3 className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <h3 className="font-medium text-white">
            Rata-rata Dimensi
          </h3>

          <p className="text-sm text-zinc-500">
            {aggregate.ratingCount > 0
              ? `${aggregate.ratingCount} rating final diperhitungkan.`
              : "Belum ada rating final."}
          </p>
        </div>
      </div>

      {aggregate.ratingCount > 0 ? (
        <div className="mt-6 space-y-5">
          {dimensions.map((dimension) => {
            const percentage =
              toProgressPercentage(dimension.value);
            const isMissingValue =
              dimension.value === null ||
              dimension.value === undefined ||
              !Number.isFinite(dimension.value);

            return (
              <div key={dimension.label}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-2 text-sm text-zinc-300">
                    <span className="shrink-0 text-zinc-500">
                      {dimension.icon}
                    </span>

                    <span className="truncate">
                      {dimension.label}
                    </span>
                  </div>

                  <span className="shrink-0 text-sm font-semibold text-white">
                    {isMissingValue ? "Belum dinilai" : formatScore(dimension.value)}
                  </span>
                </div>

                {isMissingValue ? (
                  <div className="mt-2 text-xs leading-5 text-zinc-600">
                    Belum dinilai
                  </div>
                ) : (
                  <div
                    className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/[0.06]"
                    role="progressbar"
                    aria-label={`Rata-rata ${dimension.label}`}
                    aria-valuemin={0}
                    aria-valuemax={MAXIMUM_SCORE}
                    aria-valuenow={dimension.value ?? undefined}
                    aria-valuetext={`${dimension.value?.toFixed(1) ?? "0.0"} / 10`}
                  >
                    <div
                      className="h-full rounded-full bg-rating-perfect transition-[width] duration-300"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}

          <p className="text-xs leading-5 text-zinc-600">
            Setiap bar memakai skala rating 0,0 sampai 10,0 dan hanya berasal dari rating final.
          </p>
        </div>
      ) : (
        <div className="mt-6 flex min-h-56 items-center justify-center rounded-xl border border-dashed border-white/10">
          <div className="max-w-sm px-6 text-center">
            <p className="font-medium text-zinc-300">
              Belum ada rata-rata dimensi
            </p>

            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Nilai rata-rata akan tersedia setelah Daily Match pertama selesai dinilai.
            </p>
          </div>
        </div>
      )}
    </article>
  );
}