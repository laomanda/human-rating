"use client";

import { RefreshCw } from "lucide-react";

export default function ExploreError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <main className="flex min-h-80 items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/5 px-6 text-center">
      <div>
        <h1 className="font-semibold text-red-200">
          Jelajah tidak dapat dimuat
        </h1>

        <p className="mt-2 text-sm leading-6 text-red-200/70">
          Terjadi masalah saat mengambil profil publik.
        </p>

        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          <RefreshCw
            aria-hidden="true"
            className="h-4 w-4"
          />
          Coba lagi
        </button>
      </div>
    </main>
  );
}
