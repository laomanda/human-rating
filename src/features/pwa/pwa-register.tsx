"use client";

import { useEffect } from "react";

/**
 * PwaRegister — registers the service worker silently in the background.
 * Renders nothing. Mount once at the app shell level.
 */
export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Defer registration until after page load to avoid impacting FCP/LCP.
    const registerSW = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
      } catch (err) {
        console.error("[HuMob SW] Registration failed:", err);
      }
    };

    if (document.readyState === "complete") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW);
      return () => window.removeEventListener("load", registerSW);
    }
  }, []);

  return null;
}
