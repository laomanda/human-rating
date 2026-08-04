"use client";

import Link from "next/link";
import { useEffect } from "react";

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
    <main className="flex min-h-[60vh] items-center justify-center px-6 py-10">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center shadow-lg shadow-black/20">
        <h1 className="text-2xl font-semibold text-white">
          Tidak bisa memuat dashboard
        </h1>

        <p className="mt-3 text-sm leading-6 text-zinc-400">
          Terjadi masalah saat membuka area dashboard. Anda bisa mencoba lagi atau kembali ke beranda.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
          >
            Coba lagi
          </button>

          <Link
            href="/"
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/10"
          >
            Kembali ke beranda
          </Link>
        </div>
      </section>
    </main>
  );
}