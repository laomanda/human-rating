"use client";

import { AlertCircle, CheckCheck } from "lucide-react";
import { useState, useTransition } from "react";

import { markAllAsReadAction } from "@/features/notification/actions";
import { NotificationCard } from "@/features/notification/components/notification-card";
import { NotificationEmpty } from "@/features/notification/components/notification-empty";
import type { NotificationRow } from "@/features/notification/types";

type NotificationListProps = {
  initialNotifications: NotificationRow[];
  queryError?: string | null;
};

export function NotificationList({
  initialNotifications,
  queryError,
}: NotificationListProps) {
  const [notifications, setNotifications] = useState<NotificationRow[]>(
    initialNotifications,
  );
  const [isPending, startTransition] = useTransition();

  if (queryError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
        <AlertCircle className="h-8 w-8 text-red-400" aria-hidden="true" />
        <h3 className="mt-3 text-base font-semibold text-white">
          Layanan Notifikasi Tidak Tersedia
        </h3>
        <p className="mt-1 max-w-md text-xs text-zinc-400">{queryError}</p>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => n.read_at === null).length;

  const handleMarkAllAsRead = () => {
    if (unreadCount === 0 || isPending) return;

    const nowIso = new Date().toISOString();
    setNotifications((current) =>
      current.map((item) => ({ ...item, read_at: item.read_at ?? nowIso })),
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
