"use client";

import { Bell, Settings } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { getCurrentNavigationItem } from "@/components/app-shell/navigation-config";
import { getUnreadNotificationCount } from "@/features/notification/queries";
import { createClient } from "@/lib/supabase/client";
import { APP_CONFIG } from "@/shared";

type AppHeaderProps = {
  pathname: string;
};

export function AppHeader({ pathname }: AppHeaderProps) {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const currentItem = getCurrentNavigationItem(pathname);

  const pageTitle = currentItem?.label ?? APP_CONFIG.name;

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    async function fetchUnreadCount() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && isMounted) {
        const count = await getUnreadNotificationCount(supabase, user.id);
        if (isMounted) {
          setUnreadCount(count);
        }
      }
    }

    fetchUnreadCount();

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 border-b border-app-border bg-background/85 backdrop-blur-xl">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:min-h-20 lg:px-8">
        <div className="min-w-0">
          <div className="flex items-center gap-2 lg:hidden">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-bold text-black">
              H
            </span>

            <span className="font-semibold tracking-tight text-white">
              HuMob
            </span>
          </div>

          <div className="hidden lg:block">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-600">
              HuMob
            </p>

            <h1 className="mt-1 truncate text-lg font-semibold tracking-tight text-white">
              {pageTitle}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/notifications"
            aria-label={
              unreadCount > 0
                ? `Notifikasi, ${unreadCount} belum dibaca`
                : "Notifikasi"
            }
            title="Notifikasi"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <Bell aria-hidden="true" className="h-5 w-5" />

            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-500 px-1 text-[11px] font-bold text-white shadow-sm">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>

          <Link
            href="/dashboard/settings"
            aria-label="Pengaturan"
            title="Pengaturan"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <Settings aria-hidden="true" className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}