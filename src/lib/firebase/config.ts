const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const firebaseAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const firebaseStorageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const firebaseMessagingSenderId =
  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const firebaseAppId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

export function getFirebaseVapidKey(): string {
  return (process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? "").trim();
}

function urlBase64ToUint8Array(base64String: string): Uint8Array | null {
  try {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    if (typeof window === "undefined") {
      const buffer = Buffer.from(base64, "base64");
      return new Uint8Array(buffer);
    }

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  } catch {
    return null;
  }
}

/**
 * Validates that the VAPID key decodes to a 65-byte uncompressed P-256 public key (starts with 0x04).
 */
export function isValidVapidKey(key: string): boolean {
  const trimmed = key.trim();
  if (!trimmed) return false;

  const bytes = urlBase64ToUint8Array(trimmed);
  if (!bytes) return false;

  return bytes.length === 65 && bytes[0] === 0x04;
}

export function getFirebaseConfig() {
  if (!firebaseApiKey) {
    throw new Error(
      "NEXT_PUBLIC_FIREBASE_API_KEY belum tersedia di file .env.local.",
    );
  }

  if (!firebaseProjectId) {
    throw new Error(
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID belum tersedia di file .env.local.",
    );
  }

  if (!firebaseMessagingSenderId) {
    throw new Error(
      "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID belum tersedia di file .env.local.",
    );
  }

  return {
    apiKey: firebaseApiKey,
    authDomain: firebaseAuthDomain ?? "",
    projectId: firebaseProjectId,
    storageBucket: firebaseStorageBucket ?? "",
    messagingSenderId: firebaseMessagingSenderId,
    appId: firebaseAppId ?? "",
  };
}
