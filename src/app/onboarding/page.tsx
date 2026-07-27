import type { ReactNode } from "react";

import {
  Activity,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import Link from "next/link";
import { redirect } from "next/navigation";

import { OnboardingForm } from "@/components/profile/onboarding-form";

import { getMyProfile } from "@/features/profile/queries";

import { getSafeInternalPath } from "@/lib/navigation/safe-redirect";

import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Selesaikan Profil | HuMob",
  description:
    "Selesaikan identitas dan pengaturan awal akun HuMob.",
};

export const dynamic =
  "force-dynamic";

type OnboardingPageProps = {
  searchParams: Promise<
    Record<
      string,
      string | string[] | undefined
    >
  >;
};

export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const supabase =
    await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(
      "/login?next=%2Fonboarding",
    );
  }

  const profile =
    await getMyProfile(
      supabase,
      user.id,
    );

  if (!profile) {
    redirect(
      "/auth/auth-code-error",
    );
  }

  if (
    profile.account_status !==
    "active"
  ) {
    redirect(
      "/auth/auth-code-error",
    );
  }

  const resolvedSearchParams =
    await searchParams;

  const rawNext =
    Array.isArray(
      resolvedSearchParams.next,
    )
      ? resolvedSearchParams.next[0]
      : resolvedSearchParams.next;

  const nextPath =
    getSafeInternalPath(
      rawNext,
      "/dashboard",
    );

  const safeNextPath =
    nextPath.startsWith(
      "/onboarding",
    )
      ? "/dashboard"
      : nextPath;

  if (
    profile.onboarding_completed
  ) {
    redirect(safeNextPath);
  }

  const initialFullName =
    profile.full_name?.trim() ||
    "Pengguna HuMob";

  const initialTimeZone =
    profile.timezone?.trim() ||
    "Asia/Jakarta";

  return (
    <main className="relative min-h-dvh overflow-hidden bg-background px-4 py-8 text-foreground sm:px-6 lg:py-12">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[760px] -translate-x-1/2 rounded-full bg-emerald-500/[0.04] blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-app-surface/90 shadow-2xl shadow-black/40 backdrop-blur-xl lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="border-b border-white/10 p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-10">
          <Link
            href="/"
            className="inline-flex items-center gap-3 rounded-xl focus-visible:outline-none"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white font-bold text-black">
              H
            </span>

            <span className="font-semibold tracking-tight text-white">
              HuMob
            </span>
          </Link>

          <div className="mt-12 max-w-md lg:mt-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/5 px-3 py-1.5 text-sm text-emerald-300">
              <Sparkles
                aria-hidden="true"
                className="h-4 w-4"
              />

              Langkah terakhir
            </div>

            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Bentuk identitas HuMob
              Anda.
            </h1>

            <p className="mt-4 text-sm leading-7 text-zinc-400">
              Lengkapi profil sebelum
              mulai mencatat aktivitas
              dan membangun riwayat
              performa harian.
            </p>
          </div>

          <div className="mt-10 space-y-4 lg:mt-16">
            <OnboardingBenefit
              icon={
                <Activity className="h-5 w-5" />
              }
              title="Daily Match personal"
              description="Tanggal dan batas input mengikuti zona waktu akun Anda."
            />

            <OnboardingBenefit
              icon={
                <CheckCircle2 className="h-5 w-5" />
              }
              title="Username unik"
              description="Username menjadi identitas tetap Anda di HuMob."
            />

            <OnboardingBenefit
              icon={
                <ShieldCheck className="h-5 w-5" />
              }
              title="Data akun terlindungi"
              description="Email autentikasi tidak ditampilkan pada profil pengguna."
            />
          </div>
        </aside>

        <section className="p-6 sm:p-8 lg:p-10">
          <div className="mx-auto max-w-2xl">
            <div className="mb-8">
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-zinc-600">
                Onboarding
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                Lengkapi profil Anda
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Data ini akan menjadi
                sumber identitas utama
                di seluruh aplikasi
                HuMob.
              </p>
            </div>

            <OnboardingForm
              userId={user.id}
              initialFullName={
                initialFullName
              }
              initialAvatarUrl={
                profile.avatar_url
              }
              initialBio={
                profile.bio ?? ""
              }
              initialTimeZone={
                initialTimeZone
              }
              nextPath={
                safeNextPath
              }
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function OnboardingBenefit({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-zinc-400">
        {icon}
      </div>

      <div>
        <p className="text-sm font-medium text-zinc-200">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-zinc-600">
          {description}
        </p>
      </div>
    </div>
  );
}