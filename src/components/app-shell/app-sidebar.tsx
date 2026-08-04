import Link from "next/link";

import { Sparkles } from "lucide-react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import {
    APP_NAVIGATION,
    isNavigationItemActive,
} from "@/components/app-shell/navigation-config";
import { cn } from "@/shared";

type AppSidebarProps = {
    pathname: string;
};

export function AppSidebar({
    pathname,
}: AppSidebarProps) {
    return (
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-app-border bg-app-sidebar lg:flex">
            <div className="flex h-20 items-center border-b border-app-border px-6">
                <Link
                    href="/dashboard"
                    className="group flex items-center gap-3 rounded-xl focus-visible:outline-none"
                    aria-label="Buka Beranda HuMob"
                >
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white font-bold text-black transition-transform group-hover:scale-[1.03] motion-reduce:transform-none">
                        H
                    </span>

                    <span>
                        <span className="block font-semibold tracking-tight text-white">
                            HuMob
                        </span>

                        <span className="block text-xs text-zinc-500">
                            Web Application
                        </span>
                    </span>
                </Link>
            </div>

            <nav
                aria-label="Navigasi utama"
                className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6"
            >
                <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                    Menu Utama
                </p>

                {APP_NAVIGATION.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                        item.enabled &&
                        isNavigationItemActive(pathname, item);

                    if (!item.enabled) {
                        return (
                            <div
                                key={item.href}
                                aria-disabled="true"
                                className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-3 text-zinc-600"
                            >
                                <Icon
                                    aria-hidden="true"
                                    className="h-5 w-5 shrink-0"
                                />

                                <span className="min-w-0 flex-1 text-sm font-medium">
                                    {item.label}
                                </span>

                                <span className="rounded-full border border-white/5 bg-white/[0.025] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-600">
                                    Segera
                                </span>
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-current={isActive ? "page" : undefined}
                            className={cn(
                                "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
                                isActive
                                    ? "bg-white text-black"
                                    : "text-zinc-400 hover:bg-white/[0.055] hover:text-white",
                            )}
                        >
                            <Icon
                                aria-hidden="true"
                                className="h-5 w-5 shrink-0"
                            />

                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-app-border p-4">
                <div className="mb-4 rounded-2xl border border-white/5 bg-white/[0.025] p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                        <Sparkles
                            aria-hidden="true"
                            className="h-4 w-4 text-emerald-400"
                        />
                        HuMob V1
                    </div>

                    <p className="mt-2 text-xs leading-5 text-zinc-600">
                        Beranda, Input, Profil, dan Jelajah
                        sudah aktif.
                    </p>
                </div>

                <SignOutButton />
            </div>
        </aside>
    );
}
