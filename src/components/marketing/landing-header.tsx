"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";

export function LandingHeader() {
  return (
    <header className="glass-header sticky top-0 z-50 w-full transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 transition-all group-hover:scale-105 group-hover:bg-emerald-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-heading text-xl font-bold tracking-tight text-foreground">
            HuMob<span className="text-emerald-500 inline-block animate-pulse">.</span>
          </span>
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a
            href="#features"
            className="transition-colors hover:text-foreground focus-visible:text-foreground"
          >
            Fitur
          </a>
          <a
            href="#scoring-engine"
            className="transition-colors hover:text-foreground focus-visible:text-foreground"
          >
            Rating Engine
          </a>
          <a
            href="#simulator"
            className="transition-colors hover:text-foreground focus-visible:text-foreground"
          >
            Simulator
          </a>
          <Link
            href="/dashboard/explore"
            className="transition-colors hover:text-foreground focus-visible:text-foreground"
          >
            Explore
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button asChild size="sm" className="font-medium shadow-sm">
            <Link href="/dashboard">
              <span>Ke Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
