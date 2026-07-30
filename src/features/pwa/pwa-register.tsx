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
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });

        // Check for SW updates in the background.
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // A new SW is installed. It will activate on next page load.
                console.info("[HuMob SW] Update available. Refresh to apply.");
              }
            });
          }
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
