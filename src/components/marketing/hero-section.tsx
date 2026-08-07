"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Hero3DCard } from "@/components/marketing/hero-3d-card";
import { Hero3DBackground } from "@/components/marketing/hero-3d-background";

const DYNAMIC_KEYWORDS = [
  "Secara Objektif",
  "Tanpa Self-Bias",
  "100% Deterministik",
  "Secara Presisi",
];

export function HeroSection() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % DYNAMIC_KEYWORDS.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden min-h-[calc(100dvh-4rem)] flex items-center justify-center py-8">
      {/* 3D Animated Background Video */}
      <Hero3DBackground />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          
          {/* Left Column: Animated Dynamic Headline & Actions */}
          <div className="flex flex-col items-start space-y-6 lg:col-span-6">

            {/* Interactive Animated Headline */}
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.15]"
            >
              Ukur Performa Harianmu{" "}
              <span className="block h-[1.35em] overflow-hidden py-1">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={DYNAMIC_KEYWORDS[index]}
                    initial={{ y: 40, opacity: 0, filter: "blur(8px)" }}
                    animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                    exit={{ y: -40, opacity: 0, filter: "blur(8px)" }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                    }}
                    className="inline-block bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400 bg-clip-text text-transparent drop-shadow-sm font-extrabold"
                  >
                    {DYNAMIC_KEYWORDS[index]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </motion.h1>

            {/* Animated Action Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center gap-3 pt-2"
            >
              <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md shadow-emerald-600/20 active:scale-[0.985] transition-all hover:scale-105">
                <Link href="/dashboard">
                  <span>Mulai Ukur Gratis</span>
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg" className="border-border bg-background/80 hover:bg-accent text-foreground font-medium shadow-sm transition-all hover:scale-105 active:scale-95">
                <a href="#how-it-works">
                  <Play className="h-4 w-4 text-emerald-600 dark:text-emerald-400 fill-emerald-500/20 mr-1.5" />
                  <span className="text-foreground font-medium">Lihat Cara Kerja</span>
                </a>
              </Button>
            </motion.div>
          </div>

          {/* Right Column: Elegant Interactive 3D Perspective Showcase */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-6"
          >
            <Hero3DCard />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
