"use client";

import { useState } from "react";
import { Sparkles, Zap, ShieldCheck, Activity, Cpu } from "lucide-react";

export function SplineScene({ sceneUrl }: { sceneUrl?: string }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
      className="relative flex h-full w-full flex-col items-center justify-between overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/10 via-app-surface to-background p-6 text-center shadow-2xl transition-transform duration-200 ease-out"
      style={{
        transform: `perspective(1000px) rotateY(${mousePos.x * 12}deg) rotateX(${-mousePos.y * 12}deg)`,
      }}
    >
      {/* Background Ambient Glows */}
      <div className="pointer-events-none absolute -top-12 -left-12 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -bottom-12 -right-12 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl" />

      {/* Header Badge inside Orb Container */}
      <div className="z-10 flex w-full items-center justify-between border-b border-white/10 pb-3 text-xs">
        <div className="flex items-center gap-2 text-emerald-400 font-mono">
          <Cpu className="h-4 w-4 animate-spin text-emerald-400" style={{ animationDuration: "8s" }} />
          <span>GROQ AI ENGINE</span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
          <Zap className="h-3 w-3" /> REALTIME
        </span>
      </div>

      {/* Central Interactive 3D Sphere & Orbit Rings */}
      <div className="relative my-auto flex items-center justify-center py-6">
        {/* Outer Orbit Ring */}
        <div className="absolute h-56 w-56 rounded-full border border-dashed border-emerald-500/30 animate-spin" style={{ animationDuration: "25s" }} />
        {/* Inner Orbit Ring */}
        <div className="absolute h-40 w-40 rounded-full border border-cyan-500/20 animate-spin" style={{ animationDuration: "15s", animationDirection: "reverse" }} />
        
        {/* Central Glowing Core */}
        <div className="absolute h-36 w-36 rounded-full bg-emerald-500/20 blur-2xl animate-pulse" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-emerald-500/40 bg-emerald-500/20 text-emerald-400 shadow-2xl shadow-emerald-500/30 backdrop-blur-md transition-all duration-300 hover:scale-110">
          <Sparkles className="h-12 w-12 text-emerald-300 animate-bounce" />
        </div>
      </div>

      {/* Title & Dimension Weighting Footer */}
      <div className="z-10 space-y-3 w-full">
        <div>
          <h4 className="font-heading font-bold text-foreground text-base tracking-tight">
            HuMob 3D Performance Matrix
          </h4>
          <p className="text-xs text-muted-foreground">
            Calculated via Deterministic Math & Refined by Llama 3 70B
          </p>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-2 text-[11px] font-mono">
          <span className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-400 font-semibold">
            Energy 35%
          </span>
          <span className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-400 font-semibold">
            Focus 35%
          </span>
          <span className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-purple-400 font-semibold">
            Discipline 30%
          </span>
        </div>
      </div>
    </div>
  );
}
