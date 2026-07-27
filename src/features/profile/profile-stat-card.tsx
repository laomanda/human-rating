import type { ReactNode } from "react";

type ProfileStatCardProps = {
  icon: ReactNode;
  label: string;
  value: string;
  description: string;
};

export function ProfileStatCard({
  icon,
  label,
  value,
  description,
}: ProfileStatCardProps) {
  return (
    <article className="rounded-2xl border border-app-border bg-app-surface p-5">
      <div className="text-zinc-500">
        {icon}
      </div>

      <p className="mt-5 text-sm text-zinc-500">
        {label}
      </p>

      <p className="mt-1 text-3xl font-semibold tracking-tight text-white">
        {value}
      </p>

      <p className="mt-3 text-xs leading-5 text-zinc-600">
        {description}
      </p>
    </article>
  );
}