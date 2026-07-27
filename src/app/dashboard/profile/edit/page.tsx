import {
  ArrowLeft,
  UserRound,
} from "lucide-react";

import Link from "next/link";
import { redirect } from "next/navigation";

import { EditProfileForm } from "@/features/profile/edit-profile-form";

import { getMyProfile } from "@/features/profile/queries";

import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Edit Profil | HuMob",
  description:
    "Perbarui nama, bio, dan foto profil HuMob.",
};

export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  const supabase =
    await createClient();

  const {
    data: { user },
    error: authError,
  } =
    await supabase.auth.getUser();

  if (authError || !user) {
    redirect(
      "/login?next=%2Fdashboard%2Fprofile%2Fedit",
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

  if (!profile.onboarding_completed) {
    redirect(
      "/onboarding?next=%2Fdashboard%2Fprofile%2Fedit",
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <Link
          href="/dashboard/profile"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-white"
        >
          <ArrowLeft
            aria-hidden="true"
            className="h-4 w-4"
          />

          Kembali ke Profil
        </Link>

        <div className="mt-5 flex items-center gap-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-400">
            <UserRound className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Edit Profil
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              Perbarui nama tampilan,
              bio, dan foto profil.
            </p>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-app-border bg-app-surface p-5 sm:p-6">
        <EditProfileForm
          userId={user.id}
          profile={profile}
        />
      </section>
    </div>
  );
}