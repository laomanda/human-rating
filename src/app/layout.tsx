import type { Metadata, Viewport } from "next";

import { Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "HuMob | Personal Performance",
  description:
    "Aplikasi web untuk mencatat dan menilai performa harian.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HuMob",
  },
};

export const viewport: Viewport = {
  themeColor: "#08090c",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} h-full`}
    >
      <body className="min-h-full bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}