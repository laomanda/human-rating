import { Settings } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AccountManagement } from "@/features/settings/components/account-management";
import { AccountSettings } from "@/features/settings/components/account-settings";
import { AboutSettings } from "@/features/settings/components/about-settings";
import { NotificationSettings } from "@/features/settings/components/notification-settings";
import { PrivacySettings } from "@/features/settings/components/privacy-settings";
import { getSettingsData } from "@/features/settings/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Pengaturan | HuMob",
  description: "Kelola akun, preferensi notifikasi, dan privasi profil HuMob Anda.",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { profile, notificationPreferences } = await getSettingsData();

  if (!profile) {
    throw new Error("Pengaturan gagal dimuat. Silakan coba lagi.");
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <section className="rounded-2xl border border-app-border bg-app-surface p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-400">
            <Settings aria-hidden="true" className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Pengaturan
            </h1>
            <p className="mt-1 text-sm leading-6 text-zinc-500">
              Kelola preferensi akun dan privasi HuMob Anda.
            </p>
          </div>
        </div>
      </section>

      {/* Account Settings */}
      <AccountSettings profile={profile} />

      {/* Notification Settings */}
      <NotificationSettings preferences={notificationPreferences} />

      {/* Privacy Settings */}
      <PrivacySettings profile={profile} />

      {/* Account Management */}
      <AccountManagement />

      {/* About */}
      <AboutSettings />
    </div>
  );
}
