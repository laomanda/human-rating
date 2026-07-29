export default function PublicProfileLoading() {
  return (
    <main className="min-h-screen bg-black px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="h-5 w-36 animate-pulse rounded bg-zinc-900" />
        <div className="h-40 animate-pulse rounded-2xl border border-white/10 bg-zinc-950" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-2xl border border-white/10 bg-zinc-950"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
