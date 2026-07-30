import type { ReactNode } from "react";

type SettingsSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function SettingsSection({
  title,
  description,
  children,
}: SettingsSectionProps) {
  return (
    <section
      aria-labelledby={`settings-section-${title.replace(/\s+/g, "-").toLowerCase()}`}
      className="rounded-2xl border border-white/8 bg-zinc-950 p-5 sm:p-6"
    >
      <div className="mb-5 border-b border-white/8 pb-4">
        <h2
          id={`settings-section-${title.replace(/\s+/g, "-").toLowerCase()}`}
          className="text-base font-semibold text-white"
        >
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm leading-5 text-zinc-500">{description}</p>
        )}
      </div>

      <div className="space-y-4">{children}</div>
    </section>
  );
}
