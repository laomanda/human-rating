import Link from "next/link";
import { Sparkles, ShieldCheck, Heart } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-app-border bg-background transition-colors py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-12 md:items-start">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-5">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="font-heading text-lg font-bold tracking-tight text-foreground">
                HuMob<span className="text-emerald-500">.</span>
              </span>
            </Link>
            <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
              HuMob adalah platform personal performance harian yang membantu pengguna mengukur aktivitas fisik, tidur, dan produktivitas secara objektif tanpa bias.
            </p>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              <span>Privasi Terjamin & Security Barrier Active</span>
            </div>
          </div>

          {/* Nav Column 1 */}
          <div className="space-y-3 md:col-span-3">
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-foreground">
              Navigasi Platform
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <a href="#features" className="hover:text-foreground transition-colors">
                  Fitur Utama
                </a>
              </li>
              <li>
                <a href="#scoring-engine" className="hover:text-foreground transition-colors">
                  Rating Engine
                </a>
              </li>
              <li>
                <a href="#simulator" className="hover:text-foreground transition-colors">
                  Simulator Scoring
                </a>
              </li>
              <li>
                <Link href="/dashboard/explore" className="hover:text-foreground transition-colors">
                  Explore Publik
                </Link>
              </li>
            </ul>
          </div>

          {/* Nav Column 2 */}
          <div className="space-y-3 md:col-span-4">
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-foreground">
              Teknologi Core
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Dikembangkan mengaplikasikan Next.js 16 App Router, Supabase PostgreSQL with Security Barrier, Groq AI Llama-3 Engine, dan Tailwind CSS.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-app-border pt-8 text-center sm:flex-row sm:text-left text-xs text-muted-foreground">
          <p>© 2026 HuMob Platform. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Built with precision for personal growth.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
