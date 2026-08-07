"use client";

import React, { useRef } from "react";
import { Icon } from "@iconify/react";
import { motion, useScroll, useTransform } from "framer-motion";

const dimensions = [
  {
    id: "energy",
    name: "Energy",
    weight: "35% Weight",
    description: "Kapasitas fisik dan stamina Anda sepanjang hari. Diukur dari aktivitas harian, durasi & kualitas tidur, serta pemulihan tubuh.",
    iconName: "line-md:sun-rising-loop",
    colorClass: "border-amber-500/30 bg-amber-500/10 text-amber-500 dark:text-amber-400",
    badgeClass: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    glowClass: "from-amber-500/20 via-amber-500/5 to-transparent",
  },
  {
    id: "focus",
    name: "Focus",
    weight: "35% Weight",
    description: "Ketajaman mental dan konsentrasi. Dievaluasi melalui intensitas sesi deep work, pembelajaran, dan efisiensi penyelesaian tugas.",
    iconName: "line-md:compass-loop",
    colorClass: "border-sky-500/30 bg-sky-500/10 text-sky-500 dark:text-sky-400",
    badgeClass: "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400",
    glowClass: "from-sky-500/20 via-sky-500/5 to-transparent",
  },
  {
    id: "discipline",
    name: "Discipline",
    weight: "30% Weight",
    description: "Konsistensi eksekusi rutinitas. Dinilai dari latihan fisik, kepatuhan jadwal harian, dan pembentukan kebiasaan positif.",
    iconName: "line-md:speed-loop",
    colorClass: "border-purple-500/30 bg-purple-500/10 text-purple-500 dark:text-purple-400",
    badgeClass: "border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400",
    glowClass: "from-purple-500/20 via-purple-500/5 to-transparent",
  }
];

export function ValueProposition() {
  const targetRef = useRef<HTMLDivElement>(null);

  // Track vertical scroll progress of this section
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"],
  });

  // Transform vertical scroll progress to horizontal translation
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-60%"]);

  return (
    <section 
      ref={targetRef}
      id="scoring-engine" 
      className="relative h-[250vh] sm:h-[300vh]"
    >
      {/* Sticky Fullscreen Immersive Canvas */}
      <div className="sticky top-0 flex h-screen items-center overflow-hidden py-10">
        <div className="w-full">
          
          {/* Section Header */}
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-8 text-center space-y-2">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading tracking-tight text-foreground">
              3 Dimensi <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">Performa Superior</span>
            </h2>
          </div>

          {/* Immersive Scroll-Driven Horizontal Motion Track */}
          <motion.div style={{ x }} className="flex gap-8 pl-4 sm:pl-12 lg:pl-24 pr-12 w-max">
            {dimensions.map((dim, idx) => (
              <div
                key={dim.id}
                className="w-[340px] sm:w-[420px] lg:w-[460px] shrink-0 rounded-3xl border border-border/80 bg-background/95 dark:bg-zinc-950/90 backdrop-blur-2xl p-8 sm:p-10 shadow-2xl shadow-black/10 dark:shadow-emerald-950/20 transition-all duration-500 hover:border-emerald-500/40 relative overflow-hidden flex flex-col justify-between group"
              >
                {/* Subtle Ambient Radial Glow */}
                <div className={`absolute -inset-1 rounded-3xl bg-gradient-to-br ${dim.glowClass} opacity-40 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

                {/* Background Watermark Number */}
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-15 transition-opacity select-none pointer-events-none">
                  <div className="text-9xl font-black font-mono tracking-tighter -mt-6 -mr-4 text-foreground">
                    0{idx + 1}
                  </div>
                </div>
                
                <div className="space-y-6 relative z-10">
                  <div className="flex items-center justify-between">
                    
                    {/* Iconify Native Animated SVG Container */}
                    <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-md ${dim.colorClass}`}>
                      <Icon icon={dim.iconName} className="w-8 h-8" />
                    </div>

                    <span className={`font-mono text-xs font-bold px-3 py-1.5 rounded-full border tabular-nums shadow-sm ${dim.badgeClass}`}>
                      {dim.weight}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-3xl font-bold font-heading text-foreground tracking-tight flex items-center gap-2">
                      {dim.name}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed font-sans">
                      {dim.description}
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-5 border-t border-border/60 flex items-center justify-between text-xs font-mono text-muted-foreground relative z-10">
                  <span>Deterministik 100%</span>
                  <span className="text-emerald-500 font-semibold flex items-center gap-1.5">
                    <Icon icon="line-md:confirm-circle-twotone-to-confirm-circle-transition" className="w-4 h-4 text-emerald-500" />
                    Verified Metric
                  </span>
                </div>
              </div>
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  );
}
