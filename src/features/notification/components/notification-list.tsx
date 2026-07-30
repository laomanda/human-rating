"use client";

import { CheckCheck } from "lucide-react";
import { useState, useTransition } from "react";

import { markAllAsReadAction } from "@/features/notification/actions";
import { NotificationCard } from "@/features/notification/components/notification-card";
import { NotificationEmpty } from "@/features/notification/components/notification-empty";
import type { NotificationRow } from "@/features/notification/types";

type NotificationListProps = {
  initialNotifications: NotificationRow[];
};

export function NotificationList({
  initialNotifications,
}: NotificationListProps) {
  const [notifications, setNotifications] = useState<NotificationRow[]>(
    initialNotifications,
  );
  const [isPending, startTransition] = useTransition();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllAsRead = () => {
    if (unreadCount === 0 || isPending) return;

    setNotifications((current) =>
      current.map((item) => ({ ...item, is_read: true })),
    );

    startTransition(async () => {
      const res = await markAllAsReadAction();
      if (!res.success) {
        setNotifications(initialNotifications);
      }
    });
  };

  if (notifications.length === 0) {
    return <NotificationEmpty />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-sm text-zinc-400">
          {unreadCount > 0
            ? `${unreadCount} notifikasi belum dibaca`
            : "Semua notifikasi telah dibaca"}
        </p>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" aria-hidden="true" />
            <span>Tandai semua dibaca</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
          />
        ))}
      </div>
    </div>
  );
}
