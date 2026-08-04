"use client";

import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Brain,
  ShieldCheck,
  Zap,
} from "lucide-react";
import Link from "next/link";

import { FeatureCard } from "@/components/marketing/feature-card";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-1 flex-col items-center justify-center overflow-hidden p-6 md:p-24">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.025] blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 w-full max-w-4xl space-y-12"
      >
        <div className="space-y-6 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-zinc-400"
          >
            <Zap className="h-4 w-4 text-emerald-400" />
            <span>HuMob Web Foundation</span>
          </motion.div>

          <h1 className="text-5xl font-semibold tracking-tight text-white md:text-7xl">
            Measure actions.
            <br className="hidden md:block" />
            <span className="text-zinc-500">
              Understand performance.
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-zinc-400 md:text-xl">
            Track daily discipline, productivity, consistency, and focus
            through structured activities and secure AI-assisted numerical
            ratings.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="grid grid-cols-1 gap-4 pt-8 md:grid-cols-3"
        >
          <FeatureCard
            icon={<Activity className="h-8 w-8" />}
            title="Daily Scoring"
            description="Measure daily performance through structured physical and productive activities."
          />

          <FeatureCard
            icon={<Brain className="h-8 w-8" />}
            title="AI Rating"
            description="Generate objective numerical ratings through the secure HuMob AI engine."
          />

          <FeatureCard
            icon={<BarChart3 className="h-8 w-8" />}
            title="Analytics"
            description="Visualize long-term discipline, productivity, consistency, and focus."
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="flex flex-col items-center justify-center gap-4 pt-8"
        >
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-full bg-white px-6 py-3 font-medium text-black transition hover:scale-105 hover:bg-zinc-200"
          >
            Enter Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>

          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <ShieldCheck className="h-4 w-4" />
            Secured by Supabase Auth
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
}
