"use client";

import {
  RefreshCw,
  TriangleAlert,
} from "lucide-react";

import Link from "next/link";

import { useEffect } from "react";

type OnboardingErrorProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function OnboardingError({
  error,
  reset,
}: OnboardingErrorProps) {
  useEffect(() => {
    console.error(
      "Onboarding page error:",
      error,
    );
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6 text-foreground">
      <section className="w-full max-w-lg rounded-3xl border border-red-400/20 bg-app-surface p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-400/10 text-red-300">
          <TriangleAlert
            aria-hidden="true"
            className="h-7 w-7"
          />
        </div>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-white">
          Onboarding gagal dimuat
        </h1>

        <p className="mt-3 text-sm leading-6 text-zinc-500">
          Terjadi masalah saat memuat
          data profil. Coba ulangi
          prosesnya.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-medium text-black transition-colors hover:bg-zinc-200"
          >
            <RefreshCw
              aria-hidden="true"
              className="h-4 w-4"
            />

            Coba lagi
          </button>

          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 font-medium text-zinc-300 transition-colors hover:bg-white/[0.07] hover:text-white"
          >
            Kembali ke login
          </Link>
        </div>
      </section>
    </main>
  );
}