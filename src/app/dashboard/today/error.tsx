"use client";

import {
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

import Link from "next/link";
import { useEffect } from "react";

export default function TodayMatchError({
  error,
  reset,
}: {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(
      "Today Match page failed:",
      error,
    );
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <section className="w-full max-w-lg rounded-2xl border border-red-400/20 bg-zinc-950 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-400/10 text-red-300">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <h1 className="mt-6 text-2xl font-semibold">
          Today Match failed to load
        </h1>

        <p className="mt-3 text-sm leading-6 text-zinc-500">
          {error.message ||
            "The Daily Match data could not be loaded."}
        </p>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-medium text-black transition hover:bg-zinc-200"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}