"use client";

import { useEffect } from "react";

import {
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard rendering failed:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6">
      <section className="w-full max-w-md rounded-2xl border border-red-400/20 bg-zinc-950 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-400/10 text-red-300">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <h1 className="mt-6 text-2xl font-semibold text-white">
          Dashboard failed to load
        </h1>

        <p className="mt-3 text-sm leading-6 text-zinc-500">
          The authenticated session is active, but one of
          the dashboard operations could not be completed.
        </p>

        <button
          type="button"
          onClick={reset}
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-medium text-black transition hover:bg-zinc-200"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </section>
    </main>
  );
}