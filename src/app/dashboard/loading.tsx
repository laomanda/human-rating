export default function DashboardLoading() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center shadow-lg shadow-black/20">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />

        <h2 className="text-lg font-semibold text-white">Memuat dashboard</h2>

        <p className="mt-2 text-sm text-zinc-400">
          Sedang memeriksa akses Anda dan menyiapkan area dashboard.
        </p>
      </div>
    </main>
  );
}