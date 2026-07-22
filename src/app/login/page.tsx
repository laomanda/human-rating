import { Activity, BarChart3, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export const metadata = {
  title: "Login | HuMob",
  description: "Sign in to your HuMob personal performance account.",
};

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.035] blur-3xl" />

      <section className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/80 shadow-2xl shadow-black/50 backdrop-blur-xl md:grid-cols-[1.15fr_0.85fr]">
        <div className="hidden border-r border-white/10 p-10 md:flex md:flex-col md:justify-between">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-lg font-semibold text-white"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black">
                H
              </span>
              HuMob
            </Link>

            <div className="mt-20 max-w-md space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/5 px-3 py-1 text-sm text-emerald-300">
                <Sparkles className="h-4 w-4" />
                Personal Performance Platform
              </div>

              <h1 className="text-4xl font-semibold tracking-tight text-white">
                Understand your daily performance.
              </h1>

              <p className="leading-7 text-zinc-400">
                Record structured activities and transform them into
                measurable discipline, productivity, consistency, and focus
                ratings.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FeatureIcon
              icon={<Activity className="h-5 w-5" />}
              label="Daily"
            />
            <FeatureIcon
              icon={<BarChart3 className="h-5 w-5" />}
              label="Analytics"
            />
            <FeatureIcon
              icon={<ShieldCheck className="h-5 w-5" />}
              label="Secure"
            />
          </div>
        </div>

        <div className="flex min-h-[560px] flex-col justify-center p-7 sm:p-10">
          <div className="mx-auto w-full max-w-sm">
            <Link
              href="/"
              className="mb-12 inline-flex items-center gap-2 font-semibold text-white md:hidden"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black">
                H
              </span>
              HuMob
            </Link>

            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500">
                Welcome
              </p>

              <h2 className="text-3xl font-semibold tracking-tight text-white">
                Sign in to HuMob
              </h2>

              <p className="text-sm leading-6 text-zinc-400">
                Continue using the Google account connected to your personal
                HuMob profile.
              </p>
            </div>

            <div className="my-8 h-px bg-white/10" />

            <GoogleSignInButton />

            <p className="mt-6 text-center text-xs leading-5 text-zinc-600">
              Authentication is securely handled through Supabase Auth and
              Google OAuth.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureIcon({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.025] p-4">
      <div className="mb-3 text-zinc-500">{icon}</div>
      <p className="text-sm text-zinc-400">{label}</p>
    </div>
  );
}