import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HuMob",
    short_name: "HuMob",
    description: "Personal Human Performance Rating Application",
    start_url: "/",
    display: "standalone",
    background_color: "#08090c",
    theme_color: "#08090c",
    orientation: "portrait-primary",
    categories: ["health", "lifestyle", "productivity"],
    // @ts-expect-error - Required by older browsers/Chrome for FCM Web Push
    gcm_sender_id: "103953800507",
    icons: [
      {
        src: "/logo.webp",
        sizes: "192x192",
        type: "image/webp",
        purpose: "any",
      },
      {
        src: "/logo.webp",
        sizes: "512x512",
        type: "image/webp",
        purpose: "any",
      },
      {
        src: "/logo.webp",
        sizes: "512x512",
        type: "image/webp",
        purpose: "maskable",
      },
    ],
  };
}
