import { Bell } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { NotificationList } from "@/features/notification/components/notification-list";
import { PushPermission } from "@/features/notification/push-permission";
import { getNotifications } from "@/features/notification/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Notifikasi | HuMob",
  description: "Kotak masuk notifikasi dan pengingat harian HuMob.",
};

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { notifications, error: queryError } = await getNotifications(
    supabase,
    user.id,
  );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-app-border bg-app-surface p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-400">
            <Bell aria-hidden="true" className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Notifikasi
            </h1>

            <p className="mt-1 text-sm leading-6 text-zinc-500">
              Kotak masuk pengingat harian, status rating selesai, dan pencapaian HuMob Anda.
            </p>
          </div>
        </div>
      </section>

      <PushPermission />

      <NotificationList
        initialNotifications={notifications}
        queryError={queryError}
      />
    </div>
  );
}
