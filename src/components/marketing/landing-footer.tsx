import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-border/60 bg-background transition-colors py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-12 md:items-start">
          
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-5">
            <Link href="/" className="flex items-center gap-3 group">
              <img
                src="/logo.webp"
                alt="HuMob Logo"
                className="h-9 w-9"
              />
              <span className="font-heading text-xl font-bold tracking-tight text-foreground">
                HuMob<span className="text-emerald-500">.</span>
              </span>
            </Link>

            <p className="max-w-sm text-xs sm:text-sm leading-relaxed text-muted-foreground font-sans">
              Platform evaluasi harian yang membantu kamu mengukur dan menjaga konsistensi performa fisik, fokus, dan kedisiplinan secara jelas dan objektif.
            </p>

            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              <span>Privasi & Data Aman Terproteksi</span>
            </div>
          </div>

          {/* Navigasi Utama */}
          <div className="space-y-3 md:col-span-3">
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-foreground">
              Navigasi Utama
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-muted-foreground font-sans">
              <li>
                <a href="#features" className="hover:text-emerald-500 transition-colors">
                  Fitur Utama
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-emerald-500 transition-colors">
                  Simulasi Rating
                </a>
              </li>
              <li>
                <a href="#community" className="hover:text-emerald-500 transition-colors">
                  Peringkat Komunitas
                </a>
              </li>
              <li>
                <Link href="/login" className="hover:text-emerald-500 transition-colors font-medium text-foreground">
                  Login →
                </Link>
              </li>
            </ul>
          </div>

          {/* Solusi & Komitmen */}
          <div className="space-y-3 md:col-span-4">
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-foreground">
              Solusi Performa
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-sans">
              Memberikan gambaran jujur tentang kualitas istirahat, produktivitas, dan kebiasaan harianmu agar kamu bisa berkembang lebih baik setiap hari.
            </p>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-8 text-center sm:flex-row sm:text-left text-xs text-muted-foreground font-sans">
          <p>© 2026 HuMob Platform. Seluruh hak cipta dilindungi.</p>
          <div className="flex items-center gap-1.5">
            <span>Dibuat untuk membantu perkembangan dirimu.</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
