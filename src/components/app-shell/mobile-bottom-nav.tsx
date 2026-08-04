import Link from "next/link";

import {
  APP_NAVIGATION,
  isNavigationItemActive,
} from "@/components/app-shell/navigation-config";
import { cn } from "@/shared";

type MobileBottomNavigationProps = {
  pathname: string;
};

export function MobileBottomNavigation({
  pathname,
}: MobileBottomNavigationProps) {
  return (
    <nav
      aria-label="Navigasi utama seluler"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-app-border bg-app-sidebar/95 backdrop-blur-xl lg:hidden"
      style={{
        paddingBottom:
          "max(env(safe-area-inset-bottom), 0.5rem)",
      }}
    >
      <div className="grid grid-cols-5 px-1 pt-2">
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
                className="flex min-w-0 cursor-not-allowed flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-zinc-700"
              >
                <Icon
                  aria-hidden="true"
                  className="h-5 w-5"
                />

                <span className="max-w-full truncate text-[10px] font-medium">
                  {item.shortLabel}
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
                "relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-400",
                isActive
                  ? "text-white"
                  : "text-zinc-500 hover:text-zinc-200",
              )}
            >
              {isActive ? (
                <span
                  aria-hidden="true"
                  className="absolute -top-2 h-0.5 w-8 rounded-full bg-white"
                />
              ) : null}

              <Icon
                aria-hidden="true"
                className="h-5 w-5"
              />

              <span className="max-w-full truncate text-[10px] font-medium">
                {item.shortLabel}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}