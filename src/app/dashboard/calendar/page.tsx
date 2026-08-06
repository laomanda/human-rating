import { CalendarDays } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PerformanceCalendar } from "@/features/dashboard/performance-calendar";
import { getDateKeyForTimeZone } from "@/features/dashboard/formatters";
import { getCalendarPageData } from "@/features/dashboard/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Kalender Performa | HuMob",
  description:
    "Kalender performa penuh dan riwayat rating harian HuMob.",
};

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const calendarData = await getCalendarPageData(
    supabase,
    user,
  );

  const todayDate = getDateKeyForTimeZone(
    new Date(),
    calendarData.timeZone,
  );

  const showDeveloperDiagnostics =
    process.env.NODE_ENV === "development";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-app-border bg-app-surface p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-400">
            <CalendarDays
              aria-hidden="true"
              className="h-5 w-5"
            />
          </div>

          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Kalender Performa
            </h1>

            <p className="mt-1 text-sm leading-6 text-zinc-500">
              Visualisasi penuh rating harian performa Anda. Navigasi bulan untuk melihat riwayat lengkap.
            </p>
          </div>
        </div>
      </section>

      {calendarData.calendarDays.length === 0 ? (
        <section className="flex min-h-52 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/10 px-6 text-center">
          <div className="max-w-md">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-500">
              <CalendarDays
                aria-hidden="true"
                className="h-5 w-5"
              />
            </div>

            <h2 className="mt-4 font-medium text-zinc-300">
              Belum Ada Data Kalender
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-600">
              HuMob belum menemukan Daily Match atau rating harian untuk akun Anda.
            </p>
          </div>
        </section>
      ) : (
        <PerformanceCalendar
          days={calendarData.calendarDays}
          initialDate={todayDate}
        />
      )}

      {showDeveloperDiagnostics && calendarData.warnings.length > 0 ? (
        <section className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
          <h2 className="font-medium text-amber-300">
            Peringatan data pengembangan
          </h2>

          <ul className="mt-3 space-y-2 text-sm text-amber-200/70">
            {calendarData.warnings.map((warning: string) => (
              <li key={warning}>• {warning}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
