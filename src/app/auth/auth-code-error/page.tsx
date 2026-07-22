import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Authentication Error | HuMob",
};

export default function AuthCodeErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-8 text-center shadow-2xl shadow-black/40">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/10 text-red-300">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <h1 className="mt-6 text-2xl font-semibold text-white">
          Authentication failed
        </h1>

        <p className="mt-3 text-sm leading-6 text-zinc-400">
          HuMob could not complete the Google authentication process. Please
          restart the sign-in process.
        </p>

        <Link
          href="/login"
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-medium text-black transition hover:bg-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </section>
    </main>
  );
}