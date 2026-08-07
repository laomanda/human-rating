"use client";

import { Calculator, Cpu, LineChart, Trophy, CheckCircle2, Sparkles, Flame, Target, Zap } from "lucide-react";
import confetti from "canvas-confetti";

/**
 * HuMob Rating Score Color Blueprint (Solid Colors):
 * - 0.0 - 4.9: Merah Solid (Red/Rose)
 * - 5.0 - 6.9: Orange Solid (Amber)
 * - 7.0 - 7.9: Hijau Solid (Emerald)
 * - 8.0 - 10.0: Sky Blue Solid
 */
export const getScoreColorStyle = (score: number) => {
  if (score >= 8.0) {
    return "bg-sky-500 text-white border-sky-400 font-extrabold shadow-sm";
  }
  if (score >= 7.0) {
    return "bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-500 font-extrabold shadow-sm";
  }
  if (score >= 5.0) {
    return "bg-amber-500 text-white border-amber-400 font-extrabold shadow-sm";
  }
  return "bg-rose-600 dark:bg-rose-500 text-white border-rose-500 font-extrabold shadow-sm";
};

export function BentoFeatures() {
  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.7 },
      colors: ["#38bdf8", "#10b981", "#f59e0b"],
    });
  };

  return (
    <section id="features" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center space-y-3 mb-12">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Teknologi Performa Tanpa Bias
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground font-sans">
            Sistem evaluasi berbasis matematika murni dan kecerdasan buatan terukur.
          </p>
        </div>

        {/* Asymmetric Bento Grid */}
        <div className="grid gap-6 md:grid-cols-12">
          
          {/* Card A (7 cols): Algoritma Deterministik */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm hover:border-emerald-500/30 transition-all duration-300 md:col-span-7 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
                <Calculator className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-xl font-bold text-foreground">
                Algoritma Deterministik
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-sans">
                Kalkulasi skor otomatis berbasis formula transparan. Menganalisis data aktivitas fisik, jam tidur, dan durasi kerja secara objektif.
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-border bg-muted/40 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Formula Utama
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">100% Math</span>
              </div>
              <p className="font-mono text-xs text-muted-foreground">
                BaseScore = (Energy × 0.35) + (Focus × 0.35) + (Discipline × 0.30)
              </p>
            </div>
          </div>

          {/* Card B (5 cols): Groq AI Engine */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm hover:border-emerald-500/30 transition-all duration-300 md:col-span-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-500">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-xl font-bold text-foreground">
                Groq AI Engine
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-sans">
                Analisis AI super cepat yang memberikan wawasan evaluasi dan rekomendasi perbaikan performa harian.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3.5 text-xs font-mono">
              <span className="text-muted-foreground">Kecepatan Respon</span>
              <span className="font-bold text-cyan-600 dark:text-cyan-400">&lt; 250ms Latency</span>
            </div>
          </div>

          {/* Card C (5 cols): Analytics Harian */}
          <div id="analytics" className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm hover:border-emerald-500/30 transition-all duration-300 md:col-span-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/10 text-sky-500">
                <LineChart className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-xl font-bold text-foreground">
                Analytics Harian
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-sans">
                Pantau riwayat perkembangan skor dan grafik konsistensi performamu dari hari ke hari.
              </p>
            </div>

            {/* Rating Score History Boxes - Official SOLID Color Blueprint */}
            <div className="mt-6 space-y-1.5">
              <div className="text-[11px] font-mono text-muted-foreground flex justify-between px-0.5">
                <span>7-Day History</span>
                <span className="text-sky-500 font-semibold">Avg 8.6</span>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {[4.5, 6.2, 7.8, 8.8, 9.2, 9.5, 8.9].map((score, index) => (
                  <div
                    key={index}
                    className={`h-9 w-full rounded-lg border flex items-center justify-center font-mono text-xs tabular-nums transition-transform hover:scale-105 ${getScoreColorStyle(score)}`}
                  >
                    {score}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card D (7 cols): Streak & Achievements */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm hover:border-emerald-500/30 transition-all duration-300 md:col-span-7 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-500">
                  <Trophy className="h-5 w-5" />
                </div>
                <button
                  type="button"
                  onClick={triggerConfetti}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-mono font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 active:scale-95 transition-all"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Simulasi Perayaan</span>
                </button>
              </div>
              <h3 className="font-heading text-xl font-bold text-foreground">
                Streak & Achievements
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-sans">
                Raih pencapaian otomatis saat berhasil menjaga rekor konsistensi rating harian.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2.5 font-mono text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 font-medium text-amber-600 dark:text-amber-400">
                <Flame className="h-3.5 w-3.5 text-amber-500" />
                Unbeaten Week (7-Day)
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 font-medium text-sky-600 dark:text-sky-400">
                <Target className="h-3.5 w-3.5 text-sky-500" />
                Focused Streak
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                <Zap className="h-3.5 w-3.5 text-emerald-500" />
                Elite Performance
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
