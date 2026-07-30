import { BellOff } from "lucide-react";

export function NotificationEmpty() {
  return (
    <section className="flex min-h-60 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/10 px-6 text-center">
      <div className="max-w-md">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-500">
          <BellOff
            aria-hidden="true"
            className="h-6 w-6"
          />
        </div>

        <h2 className="mt-4 font-medium text-zinc-300">
          Belum ada notifikasi
        </h2>

        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Notifikasi pengingat harian, rating selesai, dan pencapaian akan muncul di sini.
        </p>
      </div>
    </section>
  );
}
