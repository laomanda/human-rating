"use client";

import { Download, X, Share } from "lucide-react";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * PwaInstallPrompt — shows a non-intrusive install banner.
 *
 * Behaviors:
 * - On Android/Chrome: intercepts the `beforeinstallprompt` event and shows
 *   a custom install button.
 * - On iOS Safari: shows a manual "Add to Home Screen" instruction.
 * - Already installed (standalone mode): renders nothing.
 * - Dismissed: does not re-appear in the same session.
 */
export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS] = useState(() => {
    if (typeof window === "undefined") return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
  });
  const [isStandalone] = useState(() => {
    if (typeof window === "undefined") return true;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        (navigator as Navigator & { standalone?: boolean }).standalone === true)
    );
  });
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (isStandalone) return;

    // Intercept Chrome/Android install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [isStandalone]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsDismissed(true);
    }
  };

  const handleDismiss = () => setIsDismissed(true);

  // Nothing to show
  if (isStandalone || isDismissed) return null;

  // iOS: show manual instruction card
  if (isIOS) {
    return (
      <div
        role="banner"
        aria-label="Pasang HuMob di Home Screen"
        className="fixed bottom-24 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300 lg:bottom-6 lg:left-auto lg:right-6 lg:max-w-sm"
      >
        <div className="relative rounded-2xl border border-white/10 bg-app-surface p-4 shadow-2xl shadow-black/60">
          <button
            onClick={handleDismiss}
            aria-label="Tutup"
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3 pr-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-bold text-black">
              H
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Pasang HuMob</p>
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">
                Tap{" "}
                <Share
                  className="inline h-3.5 w-3.5 text-sky-400"
                  aria-label="ikon share"
                />{" "}
                lalu pilih{" "}
                <span className="font-medium text-zinc-300">
                  &quot;Add to Home Screen&quot;
                </span>{" "}
                untuk menggunakan HuMob seperti aplikasi native.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Chrome/Android: show native install trigger button
  if (!deferredPrompt) return null;

  return (
    <div
      role="banner"
      aria-label="Pasang HuMob"
      className="fixed bottom-24 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300 lg:bottom-6 lg:left-auto lg:right-6 lg:max-w-sm"
    >
      <div className="relative rounded-2xl border border-white/10 bg-app-surface p-4 shadow-2xl shadow-black/60">
        <button
          onClick={handleDismiss}
          aria-label="Tutup"
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 pr-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-bold text-black">
            H
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">Pasang HuMob</p>
            <p className="mt-0.5 truncate text-xs text-zinc-400">
              Install sebagai aplikasi di perangkatmu
            </p>
          </div>
          <button
            onClick={handleInstall}
            aria-label="Install HuMob"
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-sky-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <Download className="h-3.5 w-3.5" />
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
