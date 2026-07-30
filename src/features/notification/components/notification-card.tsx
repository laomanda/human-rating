"use client";

import { Check } from "lucide-react";
import { useState, useTransition } from "react";

import { formatDateTime } from "@/features/dashboard/formatters";
import { markAsReadAction } from "@/features/notification/actions";
import { NOTIFICATION_TYPE_META } from "@/features/notification/constants";
import type { NotificationRow } from "@/features/notification/types";

type NotificationCardProps = {
  notification: NotificationRow;
};

export function NotificationCard({ notification }: NotificationCardProps) {
  const [isPending, startTransition] = useTransition();
  const [isRead, setIsRead] = useState<boolean>(notification.is_read);
  const meta = NOTIFICATION_TYPE_META[notification.type] ?? NOTIFICATION_TYPE_META.system;
  const Icon = meta.icon;

  const handleMarkAsRead = () => {
    if (isRead || isPending) return;

    setIsRead(true);
    startTransition(async () => {
      const res = await markAsReadAction(notification.id);
      if (!res.success) {
        setIsRead(notification.is_read);
      }
    });
  };

  return (
    <article
      className={`group relative flex flex-col justify-between gap-4 rounded-2xl border p-4 transition-colors sm:flex-row sm:items-center sm:p-5 ${
        isRead
          ? "border-app-border bg-app-surface/60 opacity-80"
          : "border-sky-400/30 bg-sky-400/[0.03]"
      }`}
    >
      <div className="flex min-w-0 items-start gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${meta.badgeTone}`}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${meta.badgeTone}`}
            >
              {meta.label}
            </span>

            {!isRead && (
              <span className="inline-flex h-2 w-2 rounded-full bg-sky-400" aria-label="Belum dibaca" />
            )}

            <span className="text-xs text-zinc-500">
              {formatDateTime(notification.created_at)}
            </span>

            {notification.push_status && notification.push_status !== "sent" && notification.push_status !== "skipped" && (
              <span
                className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                  notification.push_status === "failed"
                    ? "border border-red-500/20 bg-red-500/10 text-red-400"
                    : "border border-amber-500/20 bg-amber-500/10 text-amber-400"
                }`}
              >
                {notification.push_status === "failed" ? "Gagal dikirim" : "Menunggu pengiriman"}
              </span>
            )}
          </div>

          <h3 className="mt-1.5 text-base font-semibold text-white">
            {notification.title}
          </h3>

          <p className="mt-1 text-sm leading-6 text-zinc-400">
            {notification.message}
          </p>
        </div>
      </div>

      {!isRead && (
        <div className="flex shrink-0 items-center justify-end sm:self-center">
          <button
            type="button"
            onClick={handleMarkAsRead}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-50"
            title="Tandai telah dibaca"
          >
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Tandai dibaca</span>
          </button>
        </div>
      )}
    </article>
  );
}
