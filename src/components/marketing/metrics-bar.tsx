import { BatteryCharging, Target, Dumbbell } from "lucide-react";

export function MetricsBar() {
  return (
    <section className="relative z-10 my-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="glass-card rounded-2xl border-t border-white/15 dark:border-white/15 border-black/10 p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          <div className="grid gap-6 sm:grid-cols-3 sm:divide-x sm:divide-app-border">
            {/* Energy */}
            <div className="flex items-center gap-4 sm:pr-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
                <BatteryCharging className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-semibold text-foreground">Energy</h3>
                  <span className="font-mono text-xs font-bold text-amber-400 tabular-nums">
                    35% Weight
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground leading-snug">
                  Kualitas tidur, pemulihan tubuh, dan tingkat kelelahan harian.
                </p>
              </div>
            </div>

            {/* Focus */}
            <div className="flex items-center gap-4 sm:px-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10 text-sky-400">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-semibold text-foreground">Focus</h3>
                  <span className="font-mono text-xs font-bold text-sky-400 tabular-nums">
                    35% Weight
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground leading-snug">
                  Intensitas kerja produktif, studi, dan penyelesaian tugas.
                </p>
              </div>
            </div>

            {/* Discipline */}
            <div className="flex items-center gap-4 sm:pl-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10 text-purple-400">
                <Dumbbell className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-semibold text-foreground">Discipline</h3>
                  <span className="font-mono text-xs font-bold text-purple-400 tabular-nums">
                    30% Weight
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground leading-snug">
                  Olahraga harian, latihan fisik, dan konsistensi kebiasaan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
