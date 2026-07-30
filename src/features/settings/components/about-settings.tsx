import { ExternalLink, Info } from "lucide-react";
import Link from "next/link";

import { SettingsSection } from "@/features/settings/components/settings-section";

const APP_VERSION = "0.1.0";

export function AboutSettings() {
  return (
    <SettingsSection title="Tentang HuMob">
      <div className="space-y-3">
        {/* Version */}
        <div className="flex items-center justify-between rounded-xl border border-white/5 bg-zinc-900/50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Info className="h-4 w-4 text-zinc-600" />
            Versi
          </div>
          <span className="rounded-md border border-zinc-700 px-2 py-0.5 text-xs font-mono text-zinc-400">
            v{APP_VERSION}
          </span>
        </div>

        {/* Privacy Policy */}
        <Link
          href="/privacy"
          className="flex items-center justify-between rounded-xl border border-white/5 bg-zinc-900/50 px-4 py-3 transition hover:border-white/10 hover:bg-zinc-900"
        >
          <span className="text-sm text-zinc-400">Kebijakan Privasi</span>
          <ExternalLink className="h-3.5 w-3.5 text-zinc-600" />
        </Link>

        {/* Terms */}
        <Link
          href="/terms"
          className="flex items-center justify-between rounded-xl border border-white/5 bg-zinc-900/50 px-4 py-3 transition hover:border-white/10 hover:bg-zinc-900"
        >
          <span className="text-sm text-zinc-400">Syarat &amp; Ketentuan</span>
          <ExternalLink className="h-3.5 w-3.5 text-zinc-600" />
        </Link>
      </div>
    </SettingsSection>
  );
}
