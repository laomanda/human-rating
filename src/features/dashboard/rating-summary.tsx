import type { ReactNode } from "react";

import {
  BatteryCharging,
  CheckCircle2,
  Focus,
  Gauge,
} from "lucide-react";

import {
  formatScore,
  formatStatus,
} from "@/features/dashboard/formatters";

type RatingSummaryProps = {
  overall_rating: number | null;
  energy_rating: number | null;
  focus_rating: number | null;
  discipline_rating: number | null;
  source: string | null;
  status: string | null;
};

type DimensionItem = {
  label: string;
  value: number | null;
  icon: ReactNode;
};

const SOURCE_LABELS: Readonly<Record<string, string>> = {
  ai_primary: "AI primary",
  ai_fallback: "AI fallback",
  logic_fallback: "Logic fallback",
  no_activity: "No activity",
};

function formatSource(
  source: string | null,
): string {
  if (!source) {
    return "Unknown source";
  }

  return (
    SOURCE_LABELS[source] ??
    formatStatus(source)
  );
}

export function RatingSummary({
  overall_rating,
  energy_rating,
  focus_rating,
  discipline_rating,
  source,
  status,
}: RatingSummaryProps) {
  const dimensions: DimensionItem[] = [
    {
      label: "Energy",
      value: energy_rating,
      icon: (
        <BatteryCharging className="h-5 w-5" />
      ),
    },
    {
      label: "Focus",
      value: focus_rating,
      icon: <Focus className="h-5 w-5" />,
    },
    {
      label: "Discipline",
      value: discipline_rating,
      icon: (
        <CheckCircle2 className="h-5 w-5" />
      ),
    },
  ];

  return (
    <section
      aria-labelledby="daily-rating-summary-title"
      className="rounded-2xl border border-app-border bg-app-surface p-5 sm:p-6"
    >
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-400">
              <Gauge className="h-5 w-5" />
            </div>

            <div>
              <h2
                id="daily-rating-summary-title"
                className="font-medium text-white"
              >
                Overall Rating
              </h2>

              <p className="text-sm text-zinc-500">
                Final daily performance score
              </p>
            </div>
          </div>

          <div className="mt-7">
            <p className="text-6xl font-semibold tracking-tight text-white sm:text-7xl">
              {formatScore(overall_rating)}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
                {formatStatus(status)}
              </span>

              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-300">
                {formatSource(source)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-3 lg:max-w-2xl">
          {dimensions.map((dimension) => (
            <DimensionCard
              key={dimension.label}
              label={dimension.label}
              value={dimension.value}
              icon={dimension.icon}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function DimensionCard({
  label,
  value,
  icon,
}: DimensionItem) {
  return (
    <article className="min-w-0 rounded-xl border border-white/10 bg-black/30 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-zinc-500">
          {icon}
        </div>

        <p className="text-3xl font-semibold tracking-tight text-white">
          {formatScore(value)}
        </p>
      </div>

      <p className="mt-4 text-sm font-medium text-zinc-300">
        {label}
      </p>
    </article>
  );
}
