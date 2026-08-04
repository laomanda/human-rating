export const APP_CONFIG = {
  name: "HuMob",
  shortName: "HuMob",
  description: "Web application untuk melacak aktivitas harian dan kesejahteraan.",
  defaultRoute: "/dashboard",
  navigation: {
    dashboard: "/dashboard",
    today: "/dashboard/today",
    calendar: "/dashboard/calendar",
    explore: "/dashboard/explore",
    profile: "/dashboard/profile",
    notifications: "/dashboard/notifications",
    settings: "/dashboard/settings",
  },
} as const;
