"use client";

import { Calculator, Cpu, LineChart, Trophy, CheckCircle2, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { Badge } from "@/components/ui/badge";

export function BentoFeatures() {
  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.7 },
      colors: ["#10b981", "#38bdf8", "#f59e0b"],
    });
  };

  return (
    <section id="features" className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center space-y-4 mb-16">
          <Badge variant="default" className="px-3.5 py-1 text-xs">
            Arsitektur & Fitur Utama
          </Badge>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Sistem Performa Harian Anti-Slop
          </h2>
          <p className="text-base text-muted-foreground">
            Kombinasi kalkulasi matematis objektif dan kecerdasan buatan untuk mengeliminasi penilaian subjektif.
          </p>
        </div>

        {/* Asymmetric Bento Grid */}
        <div className="grid gap-6 md:grid-cols-12">
          {/* Card A (Large - 7 cols): Deterministic Scoring Engine */}
          <div className="glass-card rounded-2xl border-t border-white/15 dark:border-white/15 border-black/10 p-8 shadow-sm hover:-translate-y-0.5 hover:border-emerald-500/30 transition-all duration-200 md:col-span-7 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                <Calculator className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-2xl font-bold text-foreground">
                Deterministic Logic Scoring Engine
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Algoritma HuMob menghitung skor secara transparan berdasarkan data matematis aktivitas fisik, 
                durasi tidur, dan volume kerja produktif. Tanpa prasangka, tanpa asumsi buatan.
              </p>
            </div>

            <div className="mt-8 rounded-xl border border-app-border bg-app-surface/60 p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Math Base Formula
                </span>
                <span className="font-mono text-emerald-400">100% Deterministic</span>
              </div>
              <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                BaseScore = (Energy × 0.35) + (Focus × 0.35) + (Discipline × 0.30)
              </p>
            </div>
          </div>

          {/* Card B (Medium - 5 cols): Groq AI Rating Engine */}
          <div className="glass-card rounded-2xl border-t border-white/15 dark:border-white/15 border-black/10 p-8 shadow-sm hover:-translate-y-0.5 hover:border-emerald-500/30 transition-all duration-200 md:col-span-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
                <Cpu className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-2xl font-bold text-foreground">
                Groq AI Rating Engine
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Didukung oleh model Llama 3 70B via Groq API. Memberikan saran reflektif mendalam dan fine-tuning skor yang presisi dalam hitungan milidetik.
              </p>
            </div>

            <div className="mt-8 flex items-center justify-between rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-xs">
              <span className="text-muted-foreground">Kecepatan Inference</span>
              <span className="font-mono font-bold text-cyan-400">&lt; 250ms Response</span>
            </div>
          </div>

          {/* Card C (Medium - 5 cols): Visual Performance Analytics */}
          <div id="analytics" className="glass-card rounded-2xl border-t border-white/15 dark:border-white/15 border-black/10 p-8 shadow-sm hover:-translate-y-0.5 hover:border-emerald-500/30 transition-all duration-200 md:col-span-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10 text-sky-400">
                <LineChart className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-2xl font-bold text-foreground">
                Performance Analytics & Calendar
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Pantau grafik konsistensi mingguan dan bulanan. Dilengkapi fitur kalender interaktif untuk memeriksa riwayat rating harian Anda.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-7 gap-1.5">
              {[8.8, 9.2, 7.8, 9.5, 8.9, 9.1, 9.6].map((score, index) => (
                <div key={index} className="flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-md bg-emerald-500/20 border border-emerald-500/30 transition-all hover:bg-emerald-500/40"
                    style={{ height: `${score * 4}px` }}
                  />
                  <span className="font-mono text-[10px] text-muted-foreground">{score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card D (7 cols): Streak Master & Achievement Unlocks */}
          <div className="glass-card rounded-2xl border-t border-white/15 dark:border-white/15 border-black/10 p-8 shadow-sm hover:-translate-y-0.5 hover:border-emerald-500/30 transition-all duration-200 md:col-span-7 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
                  <Trophy className="h-6 w-6" />
                </div>
                <button
                  type="button"
                  onClick={triggerConfetti}
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 transition-all hover:bg-amber-500/20 active:scale-95"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Test Unlock Confetti 🎉</span>
                </button>
              </div>
              <h3 className="font-heading text-2xl font-bold text-foreground">
                Streak Master & Achievement System
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Dapatkan penghargaan otomatis saat mencapai rekor konsistensi. Buka badge eksklusif seperti <i>Unbeaten Week</i>, <i>Good Form</i>, dan <i>Elite Performance</i>.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-medium text-amber-300">
                🏆 Unbeaten Week (7-Day Streak)
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3.5 py-2 text-xs font-medium text-sky-300">
                🎯 Focused (Focus ≥ 8.0)
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-medium text-emerald-300">
                ⚡ Elite Performance (Overall ≥ 9.0)
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
