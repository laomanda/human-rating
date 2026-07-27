export default function ProfileLoading() {
  return (
    <div className="space-y-6 animate-pulse motion-reduce:animate-none">
      <section className="rounded-2xl border border-app-border bg-app-surface p-6">
        <div className="flex items-center gap-5">
          <div className="h-24 w-24 rounded-3xl bg-white/10" />

          <div className="flex-1 space-y-3">
            <div className="h-7 w-52 rounded-lg bg-white/10" />
            <div className="h-4 w-32 rounded bg-white/5" />
            <div className="h-4 w-full max-w-md rounded bg-white/5" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <div
            key={index}
            className="h-40 rounded-2xl border border-app-border bg-app-surface"
          />
        ))}
      </section>

      <section className="h-72 rounded-2xl border border-app-border bg-app-surface" />
    </div>
  );
}