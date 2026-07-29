"use client";

import type { ReactNode } from "react";

import {
  BatteryCharging,
  CheckCircle2,
  ClipboardCheck,
  Focus,
  Gauge,
  X,
} from "lucide-react";

import {
  formatDateOnly,
  formatScore,
  formatStatus,
} from "@/features/dashboard/formatters";
import type { PerformanceCalendarDay } from "@/features/dashboard/types";

type CalendarDayDetailProps = {
  day: PerformanceCalendarDay | null;
  onClose: () => void;
};

type DetailScore = {
  label: string;
  value: number | null;
  icon: ReactNode;
};

export function CalendarDayDetail({
  day,
  onClose,
}: CalendarDayDetailProps) {
  if (!day?.rating) {
    return (
      <aside className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5">
        <p className="font-medium text-zinc-300">
          Pilih tanggal yang sudah dinilai
        </p>

        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Detail rating akan tampil setelah Anda memilih tanggal dengan skor final.
        </p>
      </aside>
    );
  }

  const scores: DetailScore[] = [
    {
      label: "Overall",
      value: day.rating.overall_rating,
      icon: <Gauge className="h-4 w-4" />,
    },
    {
      label: "Energy",
      value: day.rating.energy_rating,
      icon: (
        <BatteryCharging className="h-4 w-4" />
      ),
    },
    {
      label: "Focus",
      value: day.rating.focus_rating,
      icon: <Focus className="h-4 w-4" />,
    },
    {
      label: "Discipline",
      value: day.rating.discipline_rating,
      icon: (
        <CheckCircle2 className="h-4 w-4" />
      ),
    },
    {
      label: "Responsibility",
      value:
        day.rating.responsibility_rating,
      icon: (
        <ClipboardCheck className="h-4 w-4" />
      ),
    },
  ];

  return (
    <aside className="rounded-2xl border border-app-border bg-app-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500">
            Detail Rating
          </p>

          <h3 className="mt-1 font-medium text-white">
            {formatDateOnly(day.date)}
          </h3>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-sky-400"
          aria-label="Tutup detail rating"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        {scores.map((score) => (
          <div
            key={score.label}
            className="rounded-xl border border-white/10 bg-black/30 p-4"
          >
            <dt className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-600">
              {score.icon}
              {score.label}
            </dt>

            <dd className="mt-2 text-2xl font-semibold tracking-tight text-white">
              {formatScore(score.value)}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs uppercase tracking-wide text-zinc-600">
          Sumber rating
        </p>

        <p className="mt-2 text-sm font-medium text-zinc-300">
          {formatStatus(day.rating.source)}
        </p>
      </div>
    </aside>
  );
}
