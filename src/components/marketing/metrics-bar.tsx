import { BatteryCharging, Target, Dumbbell } from "lucide-react";

export function MetricsBar() {
  return (
    <section className="relative z-20 -mt-6 mb-16 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-border/80 bg-background/90 dark:bg-zinc-950/80 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-black/5 dark:shadow-emerald-950/10 transition-all hover:border-emerald-500/30">
        <div className="grid gap-6 md:grid-cols-3 md:divide-x md:divide-border/60">
          
          {/* Energy */}
          <div className="flex items-start gap-4 md:pr-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500 dark:text-amber-400 shadow-sm">
              <BatteryCharging className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-foreground text-sm tracking-tight">Energy</h3>
                <span className="font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 tabular-nums">
                  35% Weight
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                Kualitas tidur, pemulihan tubuh, dan pemantauan kelelahan harian.
              </p>
            </div>
          </div>

          {/* Focus */}
          <div className="flex items-start gap-4 md:px-6 pt-4 md:pt-0 border-t md:border-t-0 border-border/50">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-500 dark:text-sky-400 shadow-sm">
              <Target className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-foreground text-sm tracking-tight">Focus</h3>
                <span className="font-mono text-[11px] font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20 tabular-nums">
                  35% Weight
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                Intensitas kerja produktif, sesi studi, dan eksekusi tugas utama.
              </p>
            </div>
          </div>

          {/* Discipline */}
          <div className="flex items-start gap-4 md:pl-6 pt-4 md:pt-0 border-t md:border-t-0 border-border/50">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-500 dark:text-purple-400 shadow-sm">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-foreground text-sm tracking-tight">Discipline</h3>
                <span className="font-mono text-[11px] font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20 tabular-nums">
                  30% Weight
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                Aktivitas fisik harian, latihan kebugaran, dan konsistensi kebiasaan.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
