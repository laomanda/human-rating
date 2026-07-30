import { getApps, initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type Messaging,
  type MessagePayload,
} from "firebase/messaging";

import {
  getFirebaseConfig,
  getFirebaseVapidKey,
  isValidVapidKey,
} from "@/lib/firebase/config";

let messagingInstance: Messaging | null = null;

/**
 * Returns the Firebase Messaging instance (singleton).
 * Returns `null` if the browser does not support FCM.
 */
export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (messagingInstance) return messagingInstance;

  const supported = await isSupported();
  if (!supported) return null;

  const config = getFirebaseConfig();

  // Initialize Firebase app only once
  const app =
    getApps().length > 0 ? getApps()[0] : initializeApp(config);

  messagingInstance = getMessaging(app);
  return messagingInstance;
}

export type FcmTokenResult = {
  token: string | null;
  error?: string | null;
};

/**
 * Requests notification permission and returns the FCM registration token.
 * Uses /sw.js service worker registration explicitly.
 * Validates VAPID key as a 65-byte uncompressed P-256 key before calling getToken.
 */
export async function requestFcmToken(): Promise<FcmTokenResult> {
  try {
    const vapidKey = getFirebaseVapidKey();

    if (!vapidKey) {
      console.warn("[HuMob FCM] VAPID key is missing.");
      return {
        token: null,
        error: "Konfigurasi NEXT_PUBLIC_FIREBASE_VAPID_KEY belum diisi.",
      };
    }

    if (!isValidVapidKey(vapidKey)) {
      console.warn("[HuMob FCM] VAPID key fails 65-byte P-256 validation.");
      return {
        token: null,
        error: "Konfigurasi VAPID Key tidak valid (bukan 65-byte uncompressed P-256 public key).",
      };
    }

    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      return {
        token: null,
        error: "Browser tidak mendukung Firebase Messaging.",
      };
    }

    // Ensure /sw.js service worker is registered and ready
    let registration = await navigator.serviceWorker.getRegistration("/sw.js");
    if (!registration) {
      registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
    }

    await navigator.serviceWorker.ready;

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      return {
        token: null,
        error: "Gagal mendapatkan token FCM dari Firebase.",
      };
    }

    return { token, error: null };
  } catch (err) {
    const rawMessage = err instanceof Error ? err.message : String(err);
    const errName = err instanceof Error ? err.name : "";

    const isVapidError =
      errName === "InvalidAccessError" ||
      rawMessage.includes("applicationServerKey") ||
      rawMessage.includes("subscribe") ||
      rawMessage.includes("InvalidAccessError");

    if (isVapidError) {
      console.warn("[HuMob FCM] Expected VAPID configuration failure:", rawMessage);
      return {
        token: null,
        error: "Konfigurasi VAPID Key tidak valid atau tidak cocok dengan Firebase Project.",
      };
    }

    console.warn("[HuMob FCM] Token request failed:", rawMessage);
    return {
      token: null,
      error: rawMessage || "Gagal mengaktifkan push notification.",
    };
  }
}

/**
 * Registers a callback for foreground messages.
 * Returns an unsubscribe function.
 */
export async function onForegroundMessage(
  callback: (payload: MessagePayload) => void,
): Promise<(() => void) | null> {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return null;

  return onMessage(messaging, callback);
}
