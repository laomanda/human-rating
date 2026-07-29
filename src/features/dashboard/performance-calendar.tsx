"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";

import { useMemo, useState } from "react";

import { CalendarDayDetail } from "@/features/dashboard/calendar-day-detail";
import {
  formatDateOnly,
  formatScore,
} from "@/features/dashboard/formatters";
import type { PerformanceCalendarDay } from "@/features/dashboard/types";

type PerformanceCalendarProps = {
  days: PerformanceCalendarDay[];
  initialDate: string;
  isLoading?: boolean;
};

type CalendarCell = {
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  data: PerformanceCalendarDay | null;
};

const WEEKDAY_LABELS = [
  "Sen",
  "Sel",
  "Rab",
  "Kam",
  "Jum",
  "Sab",
  "Min",
] as const;

function parseDateKey(value: string): Date {
  const [year, month, day] = value
    .split("-")
    .map((part) => Number(part));

  if (!year || !month || !day) {
    return new Date();
  }

  return new Date(
    Date.UTC(year, month - 1, day, 12),
  );
}

function toDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(
    date.getUTCMonth() + 1,
  ).padStart(2, "0");
  const day = String(
    date.getUTCDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createMonthDate(
  year: number,
  monthIndex: number,
): Date {
  return new Date(
    Date.UTC(year, monthIndex, 1, 12),
  );
}

function addMonths(
  date: Date,
  delta: number,
): Date {
  return createMonthDate(
    date.getUTCFullYear(),
    date.getUTCMonth() + delta,
  );
}

function formatMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(date);
}

function buildCalendarCells(
  monthDate: Date,
  dayByDate: Map<string, PerformanceCalendarDay>,
): CalendarCell[] {
  const year = monthDate.getUTCFullYear();
  const month = monthDate.getUTCMonth();
  const firstDay = createMonthDate(year, month);
  const firstWeekday =
    (firstDay.getUTCDay() + 6) % 7;
  const startDate = new Date(
    Date.UTC(year, month, 1 - firstWeekday, 12),
  );

  return Array.from(
    {
      length: 42,
    },
    (_, index) => {
      const date = new Date(startDate);
      date.setUTCDate(
        startDate.getUTCDate() + index,
      );

      const dateKey = toDateKey(date);

      return {
        dateKey,
        dayNumber: date.getUTCDate(),
        isCurrentMonth:
          date.getUTCMonth() === month,
        data: dayByDate.get(dateKey) ?? null,
      };
    },
  );
}

function ratingTone(
  value: number | null,
): string {
  if (value === null || !Number.isFinite(value)) {
    return "border-zinc-700 bg-zinc-900 text-zinc-300";
  }

  if (value >= 8) {
    return "border-emerald-400/30 bg-emerald-400/15 text-emerald-200";
  }

  if (value >= 6) {
    return "border-sky-400/30 bg-sky-400/15 text-sky-200";
  }

  if (value >= 4) {
    return "border-amber-400/30 bg-amber-400/15 text-amber-200";
  }

  return "border-red-400/30 bg-red-400/15 text-red-200";
}

export function PerformanceCalendar({
  days,
  initialDate,
  isLoading = false,
}: PerformanceCalendarProps) {
  const initialMonth = useMemo(
    () => parseDateKey(initialDate),
    [initialDate],
  );

  const [
    visibleMonth,
    setVisibleMonth,
  ] = useState(initialMonth);

  const [
    selectedDay,
    setSelectedDay,
  ] = useState<PerformanceCalendarDay | null>(
    null,
  );

  const dayByDate = useMemo(
    () =>
      new Map(
        days.map((day) => [day.date, day]),
      ),
    [days],
  );

  const calendarCells = useMemo(
    () =>
      buildCalendarCells(
        visibleMonth,
        dayByDate,
      ),
    [visibleMonth, dayByDate],
  );

  const ratedDayCount = days.filter(
    (day) => day.rating !== null,
  ).length;

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-app-border bg-app-surface p-5 sm:p-6">
        <div className="h-96 animate-pulse rounded-xl bg-white/[0.03]" />
      </section>
    );
  }

  return (
    <section
      aria-labelledby="performance-calendar-title"
      className="rounded-2xl border border-app-border bg-app-surface p-5 sm:p-6"
    >
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-400">
            <CalendarDays className="h-5 w-5" />
          </div>

          <div>
            <h2
              id="performance-calendar-title"
              className="font-medium text-white"
            >
              Kalender Performa
            </h2>

            <p className="text-sm text-zinc-500">
              {ratedDayCount > 0
                ? `${ratedDayCount} tanggal memiliki rating final.`
                : "Belum ada rating final pada data kalender."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setVisibleMonth((current) =>
                addMonths(current, -1),
              );
              setSelectedDay(null);
            }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-sky-400"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setVisibleMonth(initialMonth);
              setSelectedDay(null);
            }}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            Hari ini
          </button>

          <button
            type="button"
            onClick={() => {
              setVisibleMonth((current) =>
                addMonths(current, 1),
              );
              setSelectedDay(null);
            }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-sky-400"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.7fr)]">
        <div className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold capitalize tracking-tight text-white">
              {formatMonthLabel(visibleMonth)}
            </h3>

            <p className="text-xs text-zinc-600">
              Klik tanggal bernilai untuk melihat detail.
            </p>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-zinc-600 sm:gap-2">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="py-2"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarCells.map((cell) => {
              const rating =
                cell.data?.rating ?? null;
              const ratingValue =
                rating?.overall_rating ?? null;
              const hasRating =
                ratingValue !== null;

              return (
                <button
                  key={cell.dateKey}
                  type="button"
                  onClick={() => {
                    if (cell.data?.rating) {
                      setSelectedDay(cell.data);
                    }
                  }}
                  className={`min-h-20 rounded-xl border p-2 text-left transition-colors focus-visible:ring-2 focus-visible:ring-sky-400 sm:min-h-24 ${
                    cell.isCurrentMonth
                      ? "border-white/10 bg-black/25 hover:bg-white/[0.04]"
                      : "border-white/5 bg-transparent text-zinc-700"
                  } ${
                    selectedDay?.date === cell.dateKey
                      ? "ring-2 ring-sky-400"
                      : ""
                  }`}
                  aria-label={`${formatDateOnly(
                    cell.dateKey,
                  )}${
                    hasRating
                      ? ` rating ${formatScore(
                          ratingValue,
                        )}`
                      : " belum ada rating"
                  }`}
                >
                  <span
                    className={`block text-xs font-medium ${
                      cell.isCurrentMonth
                        ? "text-zinc-400"
                        : "text-zinc-700"
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  <span className="mt-3 flex justify-center">
                    {hasRating ? (
                      <span
                        className={`inline-flex min-h-9 min-w-12 items-center justify-center rounded-full border px-2 text-xs font-semibold tabular-nums ${ratingTone(
                          ratingValue,
                        )}`}
                      >
                        {formatScore(
                          ratingValue,
                        )}
                      </span>
                    ) : (
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-600">
                        <Plus className="h-4 w-4" />
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <CalendarDayDetail
          day={selectedDay}
          onClose={() => setSelectedDay(null)}
        />
      </div>
    </section>
  );
}
