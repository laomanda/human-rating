import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Focus,
  Gauge,
  Target,
} from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { createClient } from "@/lib/supabase/server";

type GoogleUserMetadata = {
  full_name?: string;
  name?: string;
  avatar_url?: string;
  picture?: string;
};

export const metadata = {
  title: "Dashboard | HuMob",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const userMetadata = user.user_metadata as GoogleUserMetadata;

  const displayName =
    userMetadata.full_name ??
    userMetadata.name ??
    user.email?.split("@")[0] ??
    "HuMob User";

  const avatarUrl =
    userMetadata.avatar_url ?? userMetadata.picture ?? null;

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <main className="min-h-screen bg-black">
      <header className="border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white font-semibold text-black">
              H
            </div>

            <div>
              <p className="font-semibold text-white">HuMob</p>
              <p className="text-xs text-zinc-500">
                Personal Performance
              </p>
            </div>
          </div>

          <SignOutButton />
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <section className="flex flex-col justify-between gap-6 rounded-3xl border border-white/10 bg-zinc-950 p-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={`${displayName} profile photo`}
                width={64}
                height={64}
                priority
                className="h-16 w-16 rounded-2xl border border-white/10 object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-lg font-semibold text-white">
                {initials || "H"}
              </div>
            )}

            <div>
              <p className="text-sm text-zinc-500">Welcome back</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
                {displayName}
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                {user.email}
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-sm text-emerald-300 sm:self-auto">
            <CheckCircle2 className="h-4 w-4" />
            Authentication active
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AttributeCard
            icon={<Gauge className="h-5 w-5" />}
            title="Overall Score"
            value="—"
            description="No finalized rating yet"
          />

          <AttributeCard
            icon={<Target className="h-5 w-5" />}
            title="Discipline"
            value="—"
            description="Calculated automatically"
          />

          <AttributeCard
            icon={<BarChart3 className="h-5 w-5" />}
            title="Productivity"
            value="—"
            description="Waiting for daily activity"
          />

          <AttributeCard
            icon={<Focus className="h-5 w-5" />}
            title="Focus"
            value="—"
            description="Waiting for daily activity"
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-3xl border border-white/10 bg-zinc-950 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-300">
                <Activity className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-medium text-white">Today Match</h2>
                <p className="text-sm text-zinc-500">
                  Daily activity system arrives in Phase 4
                </p>
              </div>
            </div>

            <div className="mt-8 flex min-h-52 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.015]">
              <div className="max-w-sm px-6 text-center">
                <p className="font-medium text-zinc-300">
                  No activities submitted today
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  Physical Activity and Productive Focus input will be
                  connected after the dashboard foundation is completed.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-950 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-300">
                <CalendarDays className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-medium text-white">
                  Performance History
                </h2>
                <p className="text-sm text-zinc-500">
                  Calendar preview
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-7 gap-2">
              {Array.from({ length: 28 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-full border border-white/5 bg-white/[0.025]"
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function AttributeCard({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
      <div className="flex items-center justify-between">
        <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-400">
          {icon}
        </div>

        <span className="text-xs uppercase tracking-wider text-zinc-700">
          0.0–10.0
        </span>
      </div>

      <p className="mt-6 text-sm text-zinc-500">{title}</p>
      <p className="mt-1 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-3 text-xs leading-5 text-zinc-600">
        {description}
      </p>
    </article>
  );
}