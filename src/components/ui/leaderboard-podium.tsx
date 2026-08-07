"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Crown } from "lucide-react";

import { cn } from "@/lib/utils";

// Types (inlined)
export interface LeaderboardRanking {
  userId: string;
  userName: string | null;
  rank: number;
  value: number;
  avatarUrl?: string | null;
}

// Variants
const podiumVariants = cva("flex items-end justify-center gap-4", {
  variants: {
    size: {
      sm: "gap-2",
      default: "gap-4 sm:gap-6",
      lg: "gap-6 sm:gap-8",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

// Podium styles for each position
const PODIUM_CONFIG = {
  1: {
    icon: Crown,
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-500/25 dark:bg-amber-500/20 border border-amber-500/30",
    ringColor: "ring-amber-500/50",
    height: "h-32 sm:h-36",
    heightSm: "h-24",
    heightLg: "h-40 sm:h-44",
  },
  2: {
    icon: Crown,
    color: "text-sky-500 dark:text-sky-400",
    bg: "bg-sky-500/20 dark:bg-sky-500/15 border border-sky-500/30",
    ringColor: "ring-sky-500/50",
    height: "h-24 sm:h-28",
    heightSm: "h-20",
    heightLg: "h-32 sm:h-36",
  },
  3: {
    icon: Crown,
    color: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-500/20 dark:bg-emerald-500/15 border border-emerald-500/30",
    ringColor: "ring-emerald-500/50",
    height: "h-20 sm:h-24",
    heightSm: "h-16",
    heightLg: "h-28 sm:h-32",
  },
} as const;

// Props
export interface LeaderboardPodiumProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof podiumVariants> {
  /** Top 3 rankings (expects at least 1, ideally 3) */
  rankings: LeaderboardRanking[];
  /** Show value below name */
  showValue?: boolean;
  /** Show avatar */
  showAvatar?: boolean;
  /** Crown badge style variant */
  medalStyle?: "classic" | "modern" | "minimal";
}

const LeaderboardPodium = React.forwardRef<
  HTMLDivElement,
  LeaderboardPodiumProps
>(
  (
    {
      className,
      size,
      rankings,
      showValue = true,
      showAvatar = true,
      medalStyle = "classic",
      ...props
    },
    ref
  ) => {
    // Get top 3, reorder for podium display: 2nd, 1st, 3rd
    const top3 = rankings.slice(0, 3);
    const podiumOrder = [
      top3.find((r) => r.rank === 2),
      top3.find((r) => r.rank === 1),
      top3.find((r) => r.rank === 3),
    ].filter(Boolean) as LeaderboardRanking[];

    if (podiumOrder.length === 0) {
      return null;
    }

    const avatarSize = {
      sm: "h-10 w-10 text-sm",
      default: "h-14 w-14 text-lg",
      lg: "h-20 w-20 text-2xl",
    }[size ?? "default"];

    const iconSize = {
      sm: "h-4 w-4",
      default: "h-5 w-5",
      lg: "h-6 w-6",
    }[size ?? "default"];

    const textSize = {
      sm: "text-xs",
      default: "text-sm",
      lg: "text-base",
    }[size ?? "default"];

    return (
      <div
        ref={ref}
        className={cn(podiumVariants({ size }), className)}
        role="list"
        aria-label="Top 3 rankings"
        {...props}
      >
        {podiumOrder.map((ranking) => {
          const config = PODIUM_CONFIG[ranking.rank as 1 | 2 | 3];
          if (!config) return null;

          const displayName =
            ranking.userName || `User ${ranking.userId.slice(0, 6)}`;
          const avatarSrc =
            ranking.avatarUrl ??
            `https://i.pravatar.cc/96?u=${encodeURIComponent(ranking.userId)}`;
          const podiumHeight = {
            sm: config.heightSm,
            default: config.height,
            lg: config.heightLg,
          }[size ?? "default"];

          const itemLabel = `Rank ${ranking.rank}: ${displayName}${showValue ? `, ${ranking.value.toLocaleString()}` : ""}`;

          return (
            <div
              key={ranking.userId}
              role="listitem"
              aria-label={itemLabel}
              className="flex flex-col items-center"
            >
              {/* Avatar with crown */}
              <div className="relative mb-2" aria-hidden="true">
                {showAvatar ? (
                  <img
                    src={avatarSrc}
                    alt={`${displayName} avatar`}
                    className={cn("rounded-full object-cover border border-border/80 shadow-md", avatarSize)}
                  />
                ) : (
                  <div
                    className={cn(
                      "flex items-center justify-center rounded-full border border-border/80 shadow-md",
                      avatarSize,
                      config.bg
                    )}
                  >
                    <config.icon className={cn(iconSize, config.color)} />
                  </div>
                )}

                {/* Crown badge */}
                {medalStyle !== "minimal" && (
                  <div
                    className={cn(
                      "bg-background border border-border/60 absolute -right-1 -bottom-1 flex items-center justify-center rounded-full shadow-sm",
                      size === "sm"
                        ? "h-5 w-5"
                        : size === "lg"
                          ? "h-8 w-8"
                          : "h-6 w-6"
                    )}
                  >
                    <config.icon
                      className={cn(
                        config.color,
                        size === "sm"
                          ? "h-3 w-3"
                          : size === "lg"
                            ? "h-5 w-5"
                            : "h-4 w-4"
                      )}
                    />
                  </div>
                )}
              </div>

              {/* Name */}
              <span
                className={cn(
                  "max-w-24 truncate text-center font-heading font-bold text-foreground",
                  textSize
                )}
                title={displayName}
              >
                {displayName}
              </span>

              {/* Value */}
              {showValue && (
                <span
                  className={cn(
                    "text-muted-foreground font-mono font-semibold tabular-nums",
                    size === "sm" ? "text-xs" : "text-sm"
                  )}
                >
                  {ranking.value.toFixed(1)} / 10.0
                </span>
              )}

              {/* Podium block */}
              <div
                aria-hidden="true"
                className={cn(
                  "mt-2 w-24 sm:w-28 rounded-t-2xl backdrop-blur-md shadow-lg transition-all hover:scale-105 flex flex-col justify-between items-center py-2",
                  size === "sm" && "w-20",
                  size === "lg" && "w-32",
                  podiumHeight,
                  config.bg,
                  medalStyle === "modern" && "rounded-t-2xl"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 items-center justify-center font-mono font-extrabold text-xl",
                    config.color
                  )}
                >
                  #{ranking.rank}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);
LeaderboardPodium.displayName = "LeaderboardPodium";

export { LeaderboardPodium, podiumVariants };
