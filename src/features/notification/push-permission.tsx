"use client";

import { AlertCircle, Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import {
  saveDeviceToken,
  removeDeviceToken,
  getPushPreference,
  updatePushPreference,
} from "@/features/notification/push-service";
import { requestFcmToken } from "@/lib/firebase/messaging";

type PushStatus =
  | "loading"
  | "unsupported"
  | "denied"
  | "enabled"
  | "disabled";

/**
 * PushPermission — renders a push notification enable/disable card.
 *
 * Does NOT auto-request permission. Requires explicit user action.
 */
export function PushPermission() {
  const [status, setStatus] = useState<PushStatus>("loading");
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let mounted = true;

    async function checkStatus() {
      // Check browser support
      if (
        !("Notification" in window) ||
        !("serviceWorker" in navigator)
      ) {
        if (mounted) setStatus("unsupported");
        return;
      }

      // Check if permission was denied previously
      if (Notification.permission === "denied") {
        if (mounted) setStatus("denied");
        return;
      }

      // Check server-side preference
      const pushEnabled = await getPushPreference();

      if (Notification.permission === "granted" && pushEnabled) {
        if (mounted) setStatus("enabled");
      } else {
        if (mounted) setStatus("disabled");
      }
    }

    checkStatus();
    return () => {
      mounted = false;
    };
  }, []);

  const handleEnable = () => {
    setErrorMessage(null);
    startTransition(async () => {
      try {
        // 1. Request browser permission
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setStatus(permission === "denied" ? "denied" : "disabled");
          return;
        }

        // 2. Get FCM token with VAPID check
        const { token, error } = await requestFcmToken();
        if (error || !token) {
          setErrorMessage(
            error || "Gagal mendapatkan token FCM. Periksa konfigurasi VAPID Key.",
          );
          return;
        }

        // 3. Save token to database
        const result = await saveDeviceToken(token, "web");
        if (!result.success) {
          setErrorMessage(
            result.error || "Gagal menyimpan token ke database.",
          );
          return;
        }

        // 4. Update preference
        const preferenceResult = await updatePushPreference(true);

        if (!preferenceResult.success) {
          setErrorMessage(
            preferenceResult.error ??
              "Gagal menyimpan preferensi notifikasi.",
          );
          return;
        }

        setCurrentToken(token);
        setStatus("enabled");
      } catch (err) {
        console.error("[PushPermission] Enable failed:", err);
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat mengaktifkan notifikasi.",
        );
      }
    });
  };

  const handleDisable = () => {
    setErrorMessage(null);
    startTransition(async () => {
      try {
        // 1. Deactivate token if we have it
        if (currentToken) {
          await removeDeviceToken(currentToken);
        }

        // 2. Update preference
        const preferenceResult = await updatePushPreference(false);

        if (!preferenceResult.success) {
          setErrorMessage(
            preferenceResult.error ??
              "Gagal menyimpan preferensi notifikasi.",
          );
          return;
        }

        setCurrentToken(null);
        setStatus("disabled");
      } catch (err) {
        console.error("[PushPermission] Disable failed:", err);
      }
    });
  };

  // Loading state
  if (status === "loading") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-app-border bg-app-surface p-4">
        <Loader2
          className="h-5 w-5 animate-spin text-zinc-500"
          aria-hidden="true"
        />
        <span className="text-sm text-zinc-500">
          Memeriksa status notifikasi...
        </span>
      </div>
    );
  }

  // Unsupported browser
  if (status === "unsupported") {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5">
          <BellOff className="h-5 w-5 text-amber-400" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-amber-300">
            Push notification tidak didukung
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Browser kamu tidak mendukung push notification. Gunakan Chrome, Firefox, atau Safari terbaru.
          </p>
        </div>
      </div>
    );
  }

  // Permission denied by browser
  if (status === "denied") {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-2.5">
          <BellOff className="h-5 w-5 text-red-400" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-red-300">
            Notifikasi diblokir
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Kamu telah memblokir notifikasi untuk HuMob. Untuk mengaktifkannya
            kembali, buka pengaturan browser dan izinkan notifikasi untuk situs
            ini.
          </p>
        </div>
      </div>
    );
  }

  // Enabled
  if (status === "enabled") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5">
              <BellRing
                className="h-5 w-5 text-emerald-400"
                aria-hidden="true"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-300">
                Push notification aktif
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                Kamu akan menerima notifikasi saat rating selesai dan achievement terbuka.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDisable}
            disabled={isPending}
            className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-50"
          >
            {isPending ? "Mematikan..." : "Matikan"}
          </button>
        </div>
      </div>
    );
  }

  // Disabled — show enable button
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-app-border bg-app-surface p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
            <Bell className="h-5 w-5 text-zinc-400" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              Aktifkan push notification
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              Terima notifikasi langsung di browser saat rating selesai diproses.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleEnable}
          disabled={isPending}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-sky-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Mengaktifkan...
            </>
          ) : (
            <>
              <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
              Aktifkan
            </>
          )}
        </button>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
