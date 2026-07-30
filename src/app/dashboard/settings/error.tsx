"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Settings page failed to load:", error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-6">
      <section className="w-full max-w-md rounded-2xl border border-red-400/20 bg-zinc-950 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-400/10 text-red-300">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <h1 className="mt-6 text-xl font-semibold text-white">
          Pengaturan gagal dimuat
        </h1>

        <p className="mt-3 text-sm leading-6 text-zinc-500">
          Pengaturan gagal dimuat. Silakan coba lagi.
        </p>

        <button
          type="button"
          onClick={reset}
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-medium text-black transition hover:bg-zinc-200"
        >
          <RefreshCw className="h-4 w-4" />
          Coba Lagi
        </button>
      </section>
    </main>
  );
}
