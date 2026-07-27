import {
  CalendarDays,
  Gauge,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";

import { redirect } from "next/navigation";

import { ProfileHeader } from "@/features/profile/profile-header";
import { ProfileStatCard } from "@/features/profile/profile-stat-card";

import { formatScore } from "@/features/dashboard/formatters";

import { getMyProfilePageData } from "@/features/profile/queries";

import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Profil | HuMob",
  description:
    "Profil dan ringkasan performa pengguna HuMob.",
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase =
    await createClient();

  const {
    data: { user },
    error: authError,
  } =
    await supabase.auth.getUser();

  if (authError || !user) {
    redirect(
      "/login?next=%2Fdashboard%2Fprofile",
    );
  }

  const data =
    await getMyProfilePageData(
      supabase,
      user.id,
    );

  if (!data) {
    redirect(
      "/auth/auth-code-error",
    );
  }

  const { profile, stats } = data;

  if (!profile.onboarding_completed) {
    redirect(
      "/onboarding?next=%2Fdashboard%2Fprofile",
    );
  }

  return (
    <div className="space-y-6">
      <ProfileHeader
        profile={profile}
      />

      <section
        aria-labelledby="profile-performance-title"
        className="space-y-4"
      >
        <div>
          <h2
            id="profile-performance-title"
            className="font-semibold tracking-tight text-white"
          >
            Ringkasan Performa
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Statistik berdasarkan rating
            performa yang sudah diselesaikan.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ProfileStatCard
            icon={
              <Gauge className="h-5 w-5" />
            }
            label="Rata-rata overall"
            value={formatScore(
              stats.averageOverall,
            )}
            description="Maksimal 60 rating terbaru"
          />

          <ProfileStatCard
            icon={
              <Trophy className="h-5 w-5" />
            }
            label="Rating terbaik"
            value={formatScore(
              stats.bestOverall,
            )}
            description="Nilai overall tertinggi"
          />

          <ProfileStatCard
            icon={
              <CalendarDays className="h-5 w-5" />
            }
            label="Hari dinilai"
            value={String(
              stats.ratedDays,
            )}
            description="Total rating final"
          />

          <ProfileStatCard
            icon={
              <Sparkles className="h-5 w-5" />
            }
            label="Atribut terkuat"
            value={
              stats.strongestAttribute
                ? formatScore(
                    stats
                      .strongestAttribute
                      .value,
                  )
                : "—"
            }
            description={
              stats.strongestAttribute
                ? stats
                    .strongestAttribute
                    .label
                : "Belum ada data atribut"
            }
          />
        </div>
      </section>

      <section className="rounded-2xl border border-app-border bg-app-surface p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-400">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-medium text-white">
              Informasi Akun
            </h2>

            <p className="text-sm text-zinc-500">
              Informasi dasar profil HuMob.
            </p>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <AccountItem
            label="Username"
            value={
              profile.username
                ? `@${profile.username}`
                : "—"
            }
          />

          <AccountItem
            label="Zona waktu"
            value={profile.timezone}
          />

          <AccountItem
            label="Bergabung sejak"
            value={formatMemberSince(
              profile.created_at,
              profile.timezone,
            )}
          />

          <AccountItem
            label="Privasi akun"
            value={
              profile.is_private
                ? "Privat"
                : "Publik"
            }
          />

          <AccountItem
            label="Status akun"
            value={formatAccountStatus(
              profile.account_status,
            )}
          />

          <AccountItem
            label="Terakhir diperbarui"
            value={formatMemberSince(
              profile.updated_at,
              profile.timezone,
            )}
          />
        </dl>
      </section>
    </div>
  );
}

function formatMemberSince(
  value: string,
  timeZone: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      timeZone,
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  ).format(date);
}

function formatAccountStatus(
  value: string,
): string {
  switch (value) {
    case "active":
      return "Aktif";

    case "suspended":
      return "Ditangguhkan";

    case "pending_deletion":
      return "Menunggu penghapusan";

    case "deactivated":
      return "Dinonaktifkan";

    default:
      return value
        .replaceAll("_", " ")
        .replace(/\b\w/g, (character) =>
          character.toUpperCase(),
        );
  }
}

function AccountItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.025] p-4">
      <dt className="text-xs uppercase tracking-wide text-zinc-600">
        {label}
      </dt>

      <dd className="mt-2 break-words text-sm text-zinc-300">
        {value}
      </dd>
    </div>
  );
}