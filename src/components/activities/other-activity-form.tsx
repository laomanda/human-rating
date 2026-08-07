"use client";

import { useActionState } from "react";
import { Heart, Plus } from "lucide-react";

import { createOtherActivityAction } from "@/features/activities/actions";
import { INITIAL_ACTIVITY_ACTION_STATE, OTHER_CATEGORIES } from "@/features/activities/types";
import type { OtherCategory } from "@/features/activities/types";

type OtherActivityFormProps = {
  dailyMatchId: string;
};

const OTHER_CATEGORY_LABELS: Record<OtherCategory, string> = {
  rest: "Istirahat / Santai ☕",
  social: "Sosialisasi / Keluarga 👥",
  hobby: "Hobi / Hiburan Sehat 🎨",
  meditation: "Meditasi / Mindfulness 🧘",
  planning: "Perencanaan / Refleksi Diri 📝",
  other: "Lainnya 📌",
};

export function OtherActivityForm({ dailyMatchId }: OtherActivityFormProps) {
  const [state, formAction, isPending] = useActionState(
    createOtherActivityAction,
    INITIAL_ACTIVITY_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="daily_match_id" value={dailyMatchId} />

      <div className="flex items-center gap-2">
        <div className="rounded-xl bg-purple-500/10 p-2 text-purple-400">
          <Heart className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Aktivitas Pendukung & Pemulihan</h3>
          <p className="text-xs text-zinc-500">
            Catat aktivitas pemulihan mental, meditasi, hobi, atau sosialisasi.
          </p>
        </div>
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
          <label htmlFor="other_category" className="block text-xs font-medium text-zinc-400">
            Kategori
          </label>
          <select
            id="other_category"
            name="category"
            defaultValue="rest"
            required
            className="mt-1.5 w-full rounded-xl border border-app-border bg-app-surface px-3 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            {OTHER_CATEGORIES.map((cat) => (
              <option key={cat} value={cat} className="bg-zinc-900 text-white">
                {OTHER_CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
          {state.fieldErrors.category && (
            <p className="mt-1 text-xs text-red-400">{state.fieldErrors.category[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="other_duration" className="block text-xs font-medium text-zinc-400">
            Durasi (Menit, opsional)
          </label>
          <input
            id="other_duration"
            name="duration_minutes"
            type="number"
            min="5"
            max="600"
            placeholder="30"
            className="mt-1.5 w-full rounded-xl border border-app-border bg-app-surface px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          {state.fieldErrors.duration_minutes && (
            <p className="mt-1 text-xs text-red-400">{state.fieldErrors.duration_minutes[0]}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="other_title" className="block text-xs font-medium text-zinc-400">
          Judul Aktivitas
        </label>
        <input
          id="other_title"
          name="title"
          type="text"
          placeholder="Misal: Meditasi pagi 20 menit"
          required
          className="mt-1.5 w-full rounded-xl border border-app-border bg-app-surface px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
        {state.fieldErrors.title && (
          <p className="mt-1 text-xs text-red-400">{state.fieldErrors.title[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="other_description" className="block text-xs font-medium text-zinc-400">
          Rincian Deskripsi
        </label>
        <textarea
          id="other_description"
          name="description"
          rows={2}
          placeholder="Jelaskan aktivitas pendukung yang dilakukan..."
          required
          className="mt-1.5 w-full rounded-xl border border-app-border bg-app-surface px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
        {state.fieldErrors.description && (
          <p className="mt-1 text-xs text-red-400">{state.fieldErrors.description[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 disabled:opacity-50"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        <span>{isPending ? "Menambahkan..." : "Tambah Aktivitas Pendukung"}</span>
      </button>
    </form>
  );
}
