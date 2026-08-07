"use client";

import * as React from "react";
import { useTheme } from "next-themes";

export function Hero3DBackground() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Determine video source dynamically based on active resolved theme
  const isLight = mounted && resolvedTheme === "light";
  const videoSrc = isLight ? "/videos/hero-white.mp4" : "/videos/hero-dark.mp4";

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      <video
        key={videoSrc}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover opacity-65 dark:opacity-60 scale-105 transition-opacity duration-500"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {/* Glass Mask & Gradient Overlay for Perfect Text Contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/25 to-background/85 backdrop-blur-[0.5px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_40%,transparent_30%,rgba(9,9,11,0.4)_100%)] dark:block hidden" />
    </div>
  );
}
