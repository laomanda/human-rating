"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export function Hero3DCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine showcase image dynamically based on active resolved theme
  const isLight = mounted && resolvedTheme === "light";
  const imageSrc = isLight ? "/images/preview-white.webp" : "/images/preview-dark.webp";

  // Raw mouse coordinates relative to center (-0.5 to 0.5)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth 60fps spring physics
  const mouseX = useSpring(x, { stiffness: 200, damping: 30 });
  const mouseY = useSpring(y, { stiffness: 200, damping: 30 });

  // 3D Rotations (Gentle & Elegant, max 8-10 degrees)
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-8, 8]);

  // Dynamic Specular Glare Position (%)
  const glareX = useTransform(mouseX, [-0.5, 0.5], [20, 80]);
  const glareY = useTransform(mouseY, [-0.5, 0.5], [20, 80]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Calculate normalized position relative to center (-0.5 to 0.5)
    const normalizedX = (e.clientX - rect.left) / width - 0.5;
    const normalizedY = (e.clientY - rect.top) / height - 0.5;

    x.set(normalizedX);
    y.set(normalizedY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div className="w-full [perspective:1200px] flex items-center justify-center">
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="relative w-full rounded-2xl border border-white/15 dark:border-white/10 bg-background/80 dark:bg-zinc-950/80 p-2 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_rgba(16,185,129,0.08)] transition-all duration-300 border-t border-t-white/30 dark:border-t-white/20 group cursor-pointer"
      >
        {/* Dynamic Specular Glare Layer */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-20 rounded-2xl transition-opacity duration-500 opacity-0 group-hover:opacity-100"
          style={{
            background: useTransform(
              [glareX, glareY],
              ([gx, gy]) =>
                `radial-gradient(600px circle at ${gx}% ${gy}%, rgba(255, 255, 255, 0.12), transparent 40%)`
            ),
          }}
        />

        {/* Ambient Subtle Outer Glow */}
        <div className="absolute -inset-1 -z-10 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-cyan-500/10 blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Card Image Wrapper with 3D Depth */}
        <div 
          className="relative overflow-hidden rounded-xl bg-card"
          style={{ transform: "translateZ(30px)" }}
        >
          <Image
            key={imageSrc}
            src={imageSrc}
            alt="HuMob Performance Rating Showcase"
            width={1200}
            height={800}
            priority
            className="w-full h-auto object-cover rounded-xl transition-all duration-500 ease-out group-hover:scale-[1.02]"
          />
        </div>
      </motion.div>
    </div>
  );
}
