"use client";

import { useActionState, useEffect } from "react";
import { Moon, Sparkles } from "lucide-react";

import { upsertSleepEntryAction } from "@/features/activities/actions";
import { INITIAL_ACTIVITY_ACTION_STATE, SLEEP_QUALITIES } from "@/features/activities/types";
import type { SleepEntry, SleepQuality } from "@/features/activities/types";

type SleepEntryFormProps = {
  dailyMatchId: string;
  initialEntry?: SleepEntry | null;
};

const SLEEP_QUALITY_LABELS: Record<SleepQuality, string> = {
  very_low: "Sangat Buruk 😫",
  low: "Buruk 🙁",
  moderate: "Cukup 😐",
  good: "Baik 🙂",
  very_good: "Sangat Baik 😊",
};

export function SleepEntryForm({ dailyMatchId, initialEntry }: SleepEntryFormProps) {
  const [state, formAction, isPending] = useActionState(
    upsertSleepEntryAction,
    INITIAL_ACTIVITY_ACTION_STATE,
  );

  const initialHours = initialEntry ? (initialEntry.duration_minutes / 60).toString() : "8";
  const initialQuality = initialEntry ? initialEntry.quality : "good";
  const initialWoke = initialEntry ? initialEntry.woke_during_sleep : false;
  const initialNotes = initialEntry ? initialEntry.notes ?? "" : "";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="daily_match_id" value={dailyMatchId} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-400">
            <Moon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Istirahat & Tidur</h3>
            <p className="text-xs text-zinc-500">
              Evaluasi pemulihan energi harian untuk kriteria scoring Energy.
            </p>
          </div>
        </div>
        {initialEntry && (
          <span className="rounded-full bg-emerald-400/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
            Tersimpan
          </span>
        )}
      </div>

      {state.status === "error" && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
          {state.message}
        </div>
      )}

      {state.status === "success" && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
          {state.message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="sleep_hours" className="block text-xs font-medium text-zinc-400">
            Durasi Tidur (Jam)
          </label>
          <input
            id="sleep_hours"
            name="sleep_hours"
            type="number"
            step="0.5"
            min="1"
            max="24"
            defaultValue={initialHours}
            required
            className="mt-1.5 w-full rounded-xl border border-app-border bg-app-surface px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {state.fieldErrors.sleep_hours && (
            <p className="mt-1 text-xs text-red-400">{state.fieldErrors.sleep_hours[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="quality" className="block text-xs font-medium text-zinc-400">
            Kualitas Tidur
          </label>
          <select
            id="quality"
            name="quality"
            defaultValue={initialQuality}
            required
            className="mt-1.5 w-full rounded-xl border border-app-border bg-app-surface px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {SLEEP_QUALITIES.map((q) => (
              <option key={q} value={q} className="bg-zinc-900 text-white">
                {SLEEP_QUALITY_LABELS[q]}
              </option>
            ))}
          </select>
          {state.fieldErrors.quality && (
            <p className="mt-1 text-xs text-red-400">{state.fieldErrors.quality[0]}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-black/20 p-3">
        <input
          id="woke_during_sleep"
          name="woke_during_sleep"
          type="checkbox"
          defaultChecked={initialWoke}
          className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500"
        />
        <label htmlFor="woke_during_sleep" className="text-xs text-zinc-300">
          Sering terbangun di tengah tidur (gangguan tidur)
        </label>
      </div>

      <div>
        <label htmlFor="notes" className="block text-xs font-medium text-zinc-400">
          Catatan Tambahan (opsional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={initialNotes}
          placeholder="Misal: Terbangun segar jam 6 pagi, tidur nyenyak..."
          className="mt-1.5 w-full rounded-xl border border-app-border bg-app-surface px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        {state.fieldErrors.notes && (
          <p className="mt-1 text-xs text-red-400">{state.fieldErrors.notes[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:opacity-50"
      >
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        <span>{isPending ? "Menyimpan..." : initialEntry ? "Perbarui Catatan Tidur" : "Simpan Catatan Tidur"}</span>
      </button>
    </form>
  );
}
