"use client";

import type { ReactNode } from "react";

import { usePathname } from "next/navigation";

import { AppHeader } from "@/components/app-shell/app-header";
import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { MobileBottomNavigation } from "@/components/app-shell/mobile-bottom-nav";
import { PwaInstallPrompt } from "@/features/pwa/pwa-install-prompt";
import { PwaRegister } from "@/features/pwa/pwa-register";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({
  children,
}: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition-transform focus:translate-y-0 motion-reduce:transition-none"
      >
        Lewati ke konten utama
      </a>

      <AppSidebar pathname={pathname} />

      <div className="min-h-dvh lg:pl-72">
        <AppHeader pathname={pathname} />

        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1600px] px-4 py-6 pb-28 outline-none sm:px-6 sm:py-8 lg:px-8 lg:pb-10"
        >
          {children}
        </main>
      </div>

      <MobileBottomNavigation
        pathname={pathname}
      />

      <PwaRegister />
      <PwaInstallPrompt />
    </div>
  );
}