"use client";

import Link from "next/link";
import Image from "next/image";
import CurvedMenuHeader from "@/components/ui/curved-menu";

export function LandingHeader() {
  return (
    <header className="glass-header sticky top-0 z-50 w-full transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo.webp"
            alt="HuMob Logo"
            width={32}
            height={32}
            className="object-contain"
            priority
          />
          <span className="font-heading text-xl font-bold tracking-tight text-foreground">
            HuMob<span className="text-emerald-500">.</span>
          </span>
        </Link>

        {/* Right Action: Clean Curved Menu Trigger */}
        <div className="flex items-center">
          <CurvedMenuHeader />
        </div>
      </div>
    </header>
  );
}
