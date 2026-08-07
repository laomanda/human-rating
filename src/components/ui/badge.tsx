import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-emerald-500/10 text-emerald-400 border-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-300",
        secondary:
          "border-transparent bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100",
        destructive:
          "border-transparent bg-red-500/10 text-red-400 border-red-500/20 dark:bg-red-900/30 dark:text-red-300",
        outline: "text-foreground border-app-border",
        energy:
          "border-amber-500/20 bg-amber-500/10 text-amber-400 dark:text-amber-300",
        focus:
          "border-sky-500/20 bg-sky-500/10 text-sky-400 dark:text-sky-300",
        discipline:
          "border-purple-500/20 bg-purple-500/10 text-purple-400 dark:text-purple-300",
        overall:
          "border-emerald-500/30 bg-emerald-500/15 text-emerald-300 font-bold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
