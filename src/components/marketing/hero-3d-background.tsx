"use client";

export function Hero3DBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      {/* Background Video Layer */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover opacity-45 dark:opacity-55 scale-105"
      >
        <source src="/videos/hero.mp4" type="video/mp4" />
      </video>

      {/* Glass Mask & Gradient Overlay for Perfect Text Contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-background/90 backdrop-blur-[1px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_40%,transparent_30%,rgba(9,9,11,0.5)_100%)] dark:block hidden" />
    </div>
  );
}
