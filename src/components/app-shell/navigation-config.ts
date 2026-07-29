import type { LucideIcon } from "lucide-react";

import {
  CalendarDays,
  House,
  Search,
  SquarePen,
  UserRound,
} from "lucide-react";

export type AppNavigationItem = {
  label: string;
  shortLabel: string;
  href: string;
  icon: LucideIcon;
  exact: boolean;
  enabled: boolean;
};

export const APP_NAVIGATION: readonly AppNavigationItem[] = [
  {
    label: "Beranda",
    shortLabel: "Beranda",
    href: "/dashboard",
    icon: House,
    exact: true,
    enabled: true,
  },
  {
    label: "Input Hari Ini",
    shortLabel: "Input",
    href: "/dashboard/today",
    icon: SquarePen,
    exact: false,
    enabled: true,
  },
  {
    label: "Kalender",
    shortLabel: "Kalender",
    href: "/dashboard/calendar",
    icon: CalendarDays,
    exact: false,
    enabled: false,
  },
  {
    label: "Jelajah",
    shortLabel: "Jelajah",
    href: "/dashboard/explore",
    icon: Search,
    exact: false,
    enabled: true,
  },
  {
    label: "Profil",
    shortLabel: "Profil",
    href: "/dashboard/profile",
    icon: UserRound,
    exact: false,
    enabled: true,
  },
];

export function isNavigationItemActive(
  pathname: string,
  item: AppNavigationItem,
): boolean {
  if (item.exact) {
    return pathname === item.href;
  }

  return (
    pathname === item.href ||
    pathname.startsWith(`${item.href}/`)
  );
}

export function getCurrentNavigationItem(
  pathname: string,
): AppNavigationItem | null {
  return (
    APP_NAVIGATION.find((item) =>
      isNavigationItemActive(pathname, item),
    ) ?? null
  );
}
