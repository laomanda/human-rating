export default function TodayMatchLoading() {
  return (
    <main className="min-h-screen bg-black px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-40 animate-pulse rounded-2xl border border-white/10 bg-zinc-950" />

        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map(
            (_, index) => (
              <div
                key={index}
                className="h-[520px] animate-pulse rounded-2xl border border-white/10 bg-zinc-950"
              />
            ),
          )}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {Array.from({ length: 2 }).map(
            (_, index) => (
              <div
                key={index}
                className="h-80 animate-pulse rounded-2xl border border-white/10 bg-zinc-950"
              />
            ),
          )}
        </div>
      </div>
    </main>
  );
}