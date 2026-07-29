import {
  AlertTriangle,
  Search,
  UsersRound,
} from "lucide-react";

import type { ReactNode } from "react";

import type { Metadata } from "next";

import { PublicProfileCard } from "@/features/explore/public-profile-card";
import { searchPublicProfiles } from "@/features/explore/queries";

import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Jelajah | HuMob",
  description:
    "Temukan profil publik pengguna HuMob.",
};

export const dynamic = "force-dynamic";

type ExplorePageProps = {
  searchParams: Promise<{
    q?: string | string[];
  }>;
};

function getSearchQuery(
  value: string | string[] | undefined,
): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function ExplorePage({
  searchParams,
}: ExplorePageProps) {
  const params = await searchParams;
  const query = getSearchQuery(params.q).trim();
  const supabase = await createClient();
  const result = await searchPublicProfiles(
    supabase,
    query,
  );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-app-border bg-app-surface p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-400">
            <Search
              aria-hidden="true"
              className="h-5 w-5"
            />
          </div>

          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Jelajah
            </h1>

            <p className="mt-1 text-sm leading-6 text-zinc-500">
              Cari username atau nama tampilan dari profil yang dibagikan publik.
            </p>
          </div>
        </div>

        <form
          method="get"
          className="mt-6 flex flex-col gap-3 sm:flex-row"
        >
          <label
            htmlFor="profile-search"
            className="sr-only"
          >
            Cari profil
          </label>

          <input
            id="profile-search"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Cari username atau nama tampilan"
            autoComplete="off"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
          />

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <Search
              aria-hidden="true"
              className="h-4 w-4"
            />
            Cari
          </button>
        </form>
      </section>

      {!query ? (
        <ExploreEmptyState
          icon={<UsersRound className="h-5 w-5" />}
          title="Mulai dengan pencarian"
          description="Masukkan minimal dua karakter untuk menemukan profil publik."
        />
      ) : !result.available ? (
        <ExploreEmptyState
          icon={<AlertTriangle className="h-5 w-5" />}
          title="Pencarian tidak tersedia"
          description={
            result.errorMessage ??
            "Profil tidak dapat dicari saat ini."
          }
        />
      ) : result.profiles.length === 0 ? (
        <ExploreEmptyState
          icon={<UsersRound className="h-5 w-5" />}
          title="Profil tidak ditemukan"
          description="Coba gunakan username atau nama tampilan lain."
        />
      ) : (
        <section
          aria-labelledby="explore-results-title"
          className="space-y-4"
        >
          <div>
            <h2
              id="explore-results-title"
              className="font-semibold tracking-tight text-white"
            >
              Hasil pencarian
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              {result.profiles.length} profil ditemukan.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {result.profiles.map((profile) => (
              <PublicProfileCard
                key={profile.id}
                profile={profile}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ExploreEmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <section className="flex min-h-52 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/10 px-6 text-center">
      <div className="max-w-md">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-500">
          {icon}
        </div>

        <h2 className="mt-4 font-medium text-zinc-300">
          {title}
        </h2>

        <p className="mt-2 text-sm leading-6 text-zinc-600">
          {description}
        </p>
      </div>
    </section>
  );
}
