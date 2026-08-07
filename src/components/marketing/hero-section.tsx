"use client";

import Link from "next/link";
import { ArrowRight, Play, Shield, Zap, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SplineScene } from "@/components/marketing/spline-scene";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-28">
      {/* Subtle Background Glows (Anti-Slop, Ambient Diffused) */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-emerald-500/[0.04] blur-[120px] dark:bg-emerald-500/[0.06]" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-[400px] w-[400px] rounded-full bg-cyan-500/[0.03] blur-[100px]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-8">
          {/* Left Column: Copy & Actions */}
          <div className="flex flex-col items-start space-y-6 lg:col-span-7">
            {/* Version Badge Pill */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-medium text-emerald-400 dark:border-emerald-500/30 dark:bg-emerald-500/15">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>🚀 HuMob 2.0 • Deterministic Math + Groq AI Engine</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-[1.1]">
              Ukur Performa Harianmu{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Secara Objektif
              </span>{" "}
              Tanpa Self-Bias.
            </h1>

            {/* Subheadline */}
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              HuMob membantu Anda mencatat aktivitas fisik, tidur, dan produktivitas harian. 
              Dievaluasi secara ilmiah menggunakan kombinasi kalkulasi matematika deterministik dan Groq AI Engine.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button asChild size="lg" className="shadow-lg shadow-emerald-500/20">
                <Link href="/dashboard/today">
                  <span>Mulai Rating Harian</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg">
                <a href="#simulator">
                  <Play className="h-4 w-4 text-emerald-500 fill-emerald-500/20" />
                  <span>Lihat Demo Scoring</span>
                </a>
              </Button>
            </div>

            {/* Quick Proof Pills */}
            <div className="flex flex-wrap items-center gap-6 pt-4 text-xs font-medium text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-500" />
                <span>100% Data Private</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <span>Real-time Scoring</span>
              </div>
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-rose-500" />
                <span>Streak & Achievements</span>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Scene / Interactive Card */}
          <div className="lg:col-span-5">
            <div className="relative">
              {/* 3D Spline Component Wrapper (Desktop) */}
              <div className="hidden lg:block h-[420px] w-full rounded-2xl glass-card border-t border-white/15 dark:border-white/15 border-black/10 p-2 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                <SplineScene sceneUrl="https://prod.spline.design/6Wnt13KfeW-Fm2yC/scene.splinecode" />
              </div>

              {/* Mobile & Fallback Rating Card */}
              <div className="glass-card rounded-2xl border-t border-white/15 dark:border-white/15 border-black/10 p-6 shadow-xl space-y-5 lg:mt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Zap className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-foreground text-sm">Preview Daily Match</h3>
                      <p className="text-xs text-muted-foreground">Hari Ini • Verified AI Result</p>
                    </div>
                  </div>
                  <Badge variant="overall" className="font-mono text-sm px-3 py-1">
                    9.1 / 10.0
                  </Badge>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Energy (Tidur & Pemulihan)</span>
                      <span className="font-mono font-medium text-amber-400">8.8 / 10</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div className="h-full bg-amber-500 rounded-full w-[88%]" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Focus (Kerja & Pembelajaran)</span>
                      <span className="font-mono font-medium text-sky-400">9.4 / 10</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div className="h-full bg-sky-500 rounded-full w-[94%]" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Discipline (Aktivitas Fisik)</span>
                      <span className="font-mono font-medium text-purple-400">9.2 / 10</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div className="h-full bg-purple-500 rounded-full w-[92%]" />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-app-border bg-app-surface/60 p-3 text-xs leading-relaxed text-muted-foreground">
                  💬 <strong className="text-foreground">AI Insight:</strong> &quot;Konsistensi latihan fisik dan durasi tidur 7.5 jam memperkuat fokus kerja produktif Anda hari ini.&quot;
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
