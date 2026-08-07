"use client";

import { useState } from "react";
import { Sparkles, Calculator, Zap, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
    label: "🔥 Super Productive Day",
    activity: "Tidur 8 jam, Olahraga gym 1 jam, Coding Next.js & Supabase 5 jam",
    energy: 9.0,
    focus: 9.5,
    discipline: 9.2,
    insight: "Performa luar biasa! Tidur optimal dan kerja fokus tinggi memberikan dorongan maksimal pada kriteria Focus & Discipline.",
  },
  {
    label: "🏃 Active Recovery",
    activity: "Tidur 7 jam, Lari pagi 6 km, Belajar Bahasa 2 jam, Rest & Meditasi",
    energy: 8.5,
    focus: 8.0,
    discipline: 8.8,
    insight: "Keseimbangan fisik yang sangat baik. Aktivitas pemulihan menjaga tingkat energi stabil sepanjang hari.",
  },
  {
    label: "😴 Heavy Work, Low Sleep",
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

      if (overall >= 9.0) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#10b981", "#38bdf8", "#f59e0b"],
        });
        insight = "🎉 Elite Performance! Kombinasi ideal antara pemulihan energi, fokus tinggi, dan kedisiplinan fisik.";
      } else if (overall < 6.0) {
        insight = "⚠️ Performa membutuhkan optimasi. Perhatikan durasi tidur dan prioritaskan kebiasaan fisik harian.";
      }

      setSimulated({
        label: "Simulasi Custom",
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
    <section id="simulator" className="py-20 bg-secondary/30 border-y border-app-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center space-y-4 mb-12">
          <Badge variant="focus" className="px-3.5 py-1 text-xs">
            Interaktif Simulator
          </Badge>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Simulasikan Rating Performamu
          </h2>
          <p className="text-base text-muted-foreground">
            Coba ketik rangkuman aktivitas harianmu di bawah ini dan lihat bagaimana HuMob AI Engine mengkalkulasi skor performamu.
          </p>
        </div>

        <div className="mx-auto max-w-4xl glass-card rounded-2xl border-t border-white/15 dark:border-white/15 border-black/10 p-6 sm:p-8 shadow-xl">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-xs font-medium text-muted-foreground mr-1">Preset Sampel:</span>
            {PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setInputActivity(preset.activity);
                  setSimulated(preset);
                }}
                className="rounded-xl border border-app-border bg-app-surface px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-white/5 active:scale-95"
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
              className="h-12 text-sm sm:text-base flex-1"
            />
            <Button
              type="submit"
              size="lg"
              disabled={isCalculating || !inputActivity.trim()}
              className="w-full sm:w-auto h-12 px-6 font-semibold"
            >
              <Calculator className="h-4 w-4" />
              <span>{isCalculating ? "Menghitung..." : "Kalkulasi Skor"}</span>
            </Button>
          </form>

          {/* Results Grid */}
          <div className="rounded-xl border border-app-border bg-app-surface p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-app-border pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-emerald-400" />
                  <h3 className="font-heading text-lg font-bold text-foreground">Hasil Simulasi Rating</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Formula: BaseMath (70%) + Groq AI Refinement (30%)
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground font-medium">Overall Rating:</span>
                <Badge
                  variant={overallScore >= 9.0 ? "overall" : overallScore >= 7.5 ? "default" : "destructive"}
                  className="font-mono text-lg px-4 py-1.5 tabular-nums"
                >
                  {overallScore.toFixed(1)} / 10.0
                </Badge>
              </div>
            </div>

            {/* Individual Dimension Bars */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-amber-400">Energy (35%)</span>
                  <span className="font-mono text-sm font-bold text-amber-400 tabular-nums">
                    {simulated.energy.toFixed(1)}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${simulated.energy * 10}%` }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-sky-400">Focus (35%)</span>
                  <span className="font-mono text-sm font-bold text-sky-400 tabular-nums">
                    {simulated.focus.toFixed(1)}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full transition-all duration-500"
                    style={{ width: `${simulated.focus * 10}%` }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-purple-400">Discipline (30%)</span>
                  <span className="font-mono text-sm font-bold text-purple-400 tabular-nums">
                    {simulated.discipline.toFixed(1)}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${simulated.discipline * 10}%` }}
                  />
                </div>
              </div>
            </div>

            {/* AI Insight Box */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs leading-relaxed text-emerald-300 dark:text-emerald-300">
              💡 <strong>AI Reflective Insight:</strong> &quot;{simulated.insight}&quot;
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
