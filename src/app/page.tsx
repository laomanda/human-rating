"use client";

import { motion } from "framer-motion";
import { Activity, ArrowRight, Brain, Zap } from "lucide-react";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-24 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-3xl w-full space-y-12 z-10"
      >
        <div className="space-y-6 text-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-zinc-400"
          >
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Phase 1 Development</span>
          </motion.div>
          
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-white">
            HuMob Web <br className="hidden md:block" />
            <span className="text-zinc-500">Performance</span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Personal Human Performance Rating Application. 
            Track discipline, analyze productivity, and elevate your daily output with AI-assisted insights.
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-8"
        >
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm group hover:bg-white/[0.04] transition-colors">
            <Activity className="w-8 h-8 text-white/40 mb-4 group-hover:text-white transition-colors" />
            <h3 className="text-lg font-medium text-white mb-2">Daily Scoring</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">Measure your daily output with precise, data-driven performance metrics.</p>
          </div>
          
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm group hover:bg-white/[0.04] transition-colors">
            <Brain className="w-8 h-8 text-white/40 mb-4 group-hover:text-white transition-colors" />
            <h3 className="text-lg font-medium text-white mb-2">AI Rating</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">Get objective evaluations and actionable feedback from Groq AI.</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="flex justify-center pt-8"
        >
          <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-medium hover:scale-105 transition-transform">
            Enter Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </motion.div>
    </main>
  );
}
