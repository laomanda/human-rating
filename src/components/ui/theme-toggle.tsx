"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-9 w-9 rounded-xl border border-border bg-background/50 p-2 opacity-50 flex items-center justify-center">
        <Sun className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.88 }}
      whileHover={{ scale: 1.06 }}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background hover:bg-accent text-foreground transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 overflow-hidden"
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="dark-moon"
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{
              type: "spring",
              stiffness: 350,
              damping: 25,
            }}
            className="flex items-center justify-center text-emerald-400"
          >
            <Moon className="h-4 w-4 fill-emerald-400/20" />
          </motion.div>
        ) : (
          <motion.div
            key="light-sun"
            initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
            transition={{
              type: "spring",
              stiffness: 350,
              damping: 25,
            }}
            className="flex items-center justify-center text-amber-500"
          >
            <Sun className="h-4 w-4 fill-amber-500/20" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
