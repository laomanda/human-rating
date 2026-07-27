import {
  Bell,
  Settings,
} from "lucide-react";

import { getCurrentNavigationItem } from "@/components/app-shell/navigation-config";

type AppHeaderProps = {
  pathname: string;
};

export function AppHeader({
  pathname,
}: AppHeaderProps) {
  const currentItem =
    getCurrentNavigationItem(pathname);

  const pageTitle =
    currentItem?.label ?? "HuMob";

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
          <button
            type="button"
            disabled
            aria-label="Notifikasi segera tersedia"
            title="Notifikasi segera tersedia"
            className="relative inline-flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-xl border border-white/5 bg-white/[0.025] text-zinc-600"
          >
            <Bell
              aria-hidden="true"
              className="h-5 w-5"
            />
          </button>

          <button
            type="button"
            disabled
            aria-label="Pengaturan segera tersedia"
            title="Pengaturan segera tersedia"
            className="inline-flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-xl border border-white/5 bg-white/[0.025] text-zinc-600"
          >
            <Settings
              aria-hidden="true"
              className="h-5 w-5"
            />
          </button>
        </div>
      </div>
    </header>
  );
}