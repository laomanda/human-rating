export default function OnboardingLoading() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6">
      <div className="w-full max-w-3xl animate-pulse rounded-3xl border border-white/10 bg-app-surface p-8 motion-reduce:animate-none">
        <div className="h-10 w-32 rounded-xl bg-white/10" />

        <div className="mt-10 h-8 w-64 rounded-lg bg-white/10" />

        <div className="mt-3 h-4 w-full max-w-md rounded bg-white/5" />

        <div className="mt-10 h-28 w-28 rounded-3xl bg-white/10" />

        <div className="mt-8 grid gap-5">
          <div className="h-12 rounded-xl bg-white/5" />
          <div className="h-12 rounded-xl bg-white/5" />
          <div className="h-28 rounded-xl bg-white/5" />
          <div className="h-12 rounded-xl bg-white/5" />
        </div>
      </div>
    </main>
  );
}