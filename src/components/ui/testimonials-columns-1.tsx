"use client";

import React from "react";
import { motion } from "framer-motion";

export interface TestimonialItem {
  text: string;
  image: string;
  name: string;
  role: string;
  score?: string;
}

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: TestimonialItem[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6 bg-transparent"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, image, name, role, score }, i) => (
                <div
                  className="p-6 rounded-2xl border border-border/80 bg-background/90 dark:bg-zinc-950/80 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-emerald-950/10 max-w-xs sm:max-w-sm w-full space-y-4 transition-all duration-300 hover:border-emerald-500/30"
                  key={i}
                >
                  <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-sans italic">
                    &quot;{text}&quot;
                  </p>

                  <div className="flex items-center justify-between border-t border-border/60 pt-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        width={40}
                        height={40}
                        src={image}
                        alt={name}
                        className="h-10 w-10 rounded-full object-cover border border-border/80 shrink-0"
                      />
                      <div className="flex flex-col min-w-0">
                        <div className="font-heading font-bold text-xs sm:text-sm text-foreground truncate">{name}</div>
                        <div className="text-[11px] text-muted-foreground font-sans truncate">{role}</div>
                      </div>
                    </div>
                    {score && (
                      <div className="px-2 py-0.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold tabular-nums shrink-0 ml-2">
                        {score}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};
