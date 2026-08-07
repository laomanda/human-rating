"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getScoreColorStyle } from "@/components/marketing/bento-features";

type SamplePreset = {
  label: string;
  activity: string;
  energy: number;
  focus: number;
  discipline: number;
  insight: string;
};

const PRESETS: SamplePreset[] = [
  {
    label: "Hari Super Produktif",
    activity: "Tidur 8 jam, Olahraga gym 1 jam, Coding Next.js & Supabase 5 jam",
    energy: 9.0,
    focus: 9.5,
    discipline: 9.2,
    insight: "Performa luar biasa! Tidur optimal dan kerja fokus tinggi memberikan dorongan maksimal pada kriteria Focus & Discipline.",
  },
  {
    label: "Pemulihan Aktif",
    activity: "Tidur 7 jam, Lari pagi 6 km, Belajar Bahasa 2 jam, Rest & Meditasi",
    energy: 8.5,
    focus: 8.0,
    discipline: 8.8,
    insight: "Keseimbangan fisik yang sangat baik. Aktivitas pemulihan menjaga tingkat energi stabil sepanjang hari.",
  },
  {
    label: "Kerja Berat, Kurang Tidur",
    activity: "Tidur 4 jam, Lembur kantor 8 jam, Tanpa olahraga",
    energy: 5.2,
    focus: 7.0,
    discipline: 5.8,
    insight: "Perhatian: Kurang tidur 4 jam menurunkan skor Energy secara signifikan. Jadwalkan istirahat tambahan besok.",
  },
];

export function RatingSimulator() {
  const [inputActivity, setInputActivity] = useState(PRESETS[0].activity);
  const [simulated, setSimulated] = useState<SamplePreset>(PRESETS[0]);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateScores = (text: string) => {
    setIsCalculating(true);

    setTimeout(() => {
      let energy = 7.5;
      let focus = 7.5;
      let discipline = 7.5;
      let insight = "Simulasi evaluasi performa berdasarkan aktivitas input harian.";

      const lower = text.toLowerCase();

      // Sleep adjustments
      if (lower.includes("8 jam") || lower.includes("tidur nyenyak")) {
        energy += 1.3;
      } else if (lower.includes("4 jam") || lower.includes("begadang")) {
        energy -= 2.3;
      }

      // Physical activity adjustments
      if (lower.includes("gym") || lower.includes("lari") || lower.includes("olahraga")) {
        discipline += 1.5;
        energy += 0.5;
      }

      // Productive activity adjustments
      if (lower.includes("coding") || lower.includes("studi") || lower.includes("belajar") || lower.includes("lembur")) {
        focus += 1.8;
        discipline += 0.8;
      }

      // Clamp values between 1.0 and 10.0
      energy = Math.min(10, Math.max(1, Number(energy.toFixed(1))));
      focus = Math.min(10, Math.max(1, Number(focus.toFixed(1))));
      discipline = Math.min(10, Math.max(1, Number(discipline.toFixed(1))));

      const overall = Number(((energy * 0.35) + (focus * 0.35) + (discipline * 0.30)).toFixed(1));

      if (overall >= 8.0) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#38bdf8", "#10b981", "#f59e0b"],
        });
        insight = "Performa Luar Biasa! Kombinasi ideal antara pemulihan energi, fokus tinggi, dan kedisiplinan fisik.";
      } else if (overall < 5.0) {
        insight = "Performa membutuhkan optimasi. Perhatikan durasi tidur dan prioritaskan kebiasaan fisik harian.";
      }

      setSimulated({
        label: "Simulasi Khusus",
        activity: text,
        energy,
        focus,
        discipline,
        insight,
      });

      setIsCalculating(false);
    }, 250);
  };

  const overallScore = Number(
    ((simulated.energy * 0.35) + (simulated.focus * 0.35) + (simulated.discipline * 0.30)).toFixed(1)
  );

  return (
    <section id="how-it-works" className="py-16 md:py-24 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center space-y-3 mb-12">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Simulasikan Rating <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">Performamu</span>
          </h2>
        </div>

        {/* Main Card Container - 100% Consistent Glass Card */}
        <div className="mx-auto max-w-4xl rounded-2xl border border-border/80 bg-background/90 dark:bg-zinc-950/80 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-black/5 dark:shadow-emerald-950/10">
          
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-xs font-mono text-muted-foreground mr-1">Preset Sampel:</span>
            {PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setInputActivity(preset.activity);
                  setSimulated(preset);
                }}
                className={`rounded-lg border px-3 py-1.5 text-xs font-mono font-medium transition-all active:scale-95 ${
                  inputActivity === preset.activity
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                    : "border-border/60 bg-muted/40 hover:bg-muted text-foreground"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inputActivity.trim()) {
                calculateScores(inputActivity);
              }
            }}
            className="flex flex-col sm:flex-row items-center gap-3 mb-8"
          >
            <Input
              value={inputActivity}
              onChange={(e) => setInputActivity(e.target.value)}
              placeholder="Misal: Tidur 8 jam, Lari 5 km, Kerja Next.js 4 jam..."
              className="h-12 text-sm flex-1 font-sans bg-background border-border/80 focus:border-emerald-500"
            />
            <Button
              type="submit"
              size="lg"
              disabled={isCalculating || !inputActivity.trim()}
              className="w-full sm:w-auto h-12 px-6 font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Calculator className="h-4 w-4 mr-2" />
              <span>{isCalculating ? "Menghitung..." : "Kalkulasi Skor"}</span>
            </Button>
          </form>

          {/* Results Box */}
          <div className="rounded-xl border border-border/80 bg-card p-6 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
              <div>
                <h3 className="font-heading text-lg font-bold text-foreground">Hasil Simulasi Rating</h3>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground font-mono">Skor Keseluruhan:</span>
                <span className={`px-3.5 py-1.5 rounded-lg border text-base tabular-nums ${getScoreColorStyle(overallScore)}`}>
                  {overallScore.toFixed(1)} / 10.0
                </span>
              </div>
            </div>

            {/* Individual Dimension Bars */}
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Energy */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="font-semibold text-amber-600 dark:text-amber-400">Energy (35%)</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                    {simulated.energy.toFixed(1)}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-amber-500/20 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${simulated.energy * 10}%` }}
                  />
                </div>
              </div>

              {/* Focus */}
              <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="font-semibold text-sky-600 dark:text-sky-400">Focus (35%)</span>
                  <span className="font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                    {simulated.focus.toFixed(1)}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-sky-500/20 overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full transition-all duration-500"
                    style={{ width: `${simulated.focus * 10}%` }}
                  />
                </div>
              </div>

              {/* Discipline */}
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="font-semibold text-purple-600 dark:text-purple-400">Discipline (30%)</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400 tabular-nums">
                    {simulated.discipline.toFixed(1)}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-purple-500/20 overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${simulated.discipline * 10}%` }}
                  />
                </div>
              </div>
            </div>

            {/* AI Insight Box */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs leading-relaxed text-foreground font-sans">
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">Analisis Reflektif AI: </span>
              <span>&quot;{simulated.insight}&quot;</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
