import { Bell, CheckCircle2, Info, Trophy } from "lucide-react";
import type { ElementType } from "react";
import type { NotificationType } from "@/features/notification/types";

export type NotificationTypeMeta = {
  label: string;
  icon: ElementType;
  badgeTone: string;
};

export const NOTIFICATION_TYPE_META: Record<
  NotificationType,
  NotificationTypeMeta
> = {
  daily_reminder: {
    label: "Pengingat Harian",
    icon: Bell,
    badgeTone: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  },
  rating_completed: {
    label: "Rating Selesai",
    icon: CheckCircle2,
    badgeTone: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  },
  rating_ready: {
    label: "Rating Selesai",
    icon: CheckCircle2,
    badgeTone: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  },
  achievement_unlocked: {
    label: "Pencapaian Terbuka",
    icon: Trophy,
    badgeTone: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  },
  achievement: {
    label: "Pencapaian Terbuka",
    icon: Trophy,
    badgeTone: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  },
  system: {
    label: "Sistem",
    icon: Info,
    badgeTone: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
  },
};
