export default function ExploreLoading() {
  return (
    <main className="space-y-6">
      <div className="h-52 animate-pulse rounded-2xl border border-white/10 bg-zinc-950" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-40 animate-pulse rounded-2xl border border-white/10 bg-zinc-950"
          />
        ))}
      </div>
    </main>
  );
}
