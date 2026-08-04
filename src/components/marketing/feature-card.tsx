import type { ReactNode } from "react";

type FeatureCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
};

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-sm transition-colors hover:bg-white/[0.04]">
      <div className="mb-4 text-white/40 transition-colors group-hover:text-white">
        {icon}
      </div>

      <h2 className="mb-2 text-lg font-medium text-white">{title}</h2>

      <p className="text-sm leading-relaxed text-zinc-400">{description}</p>
    </div>
  );
}
