"use client";

import {
  LoaderCircle,
  LogOut,
} from "lucide-react";

import { useFormStatus } from "react-dom";

export function SignOutSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-white/20 hover:bg-white/[0.07] hover:text-white disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? (
        <LoaderCircle
          aria-hidden="true"
          className="h-4 w-4 animate-spin motion-reduce:animate-none"
        />
      ) : (
        <LogOut
          aria-hidden="true"
          className="h-4 w-4"
        />
      )}

      {pending ? "Sedang keluar…" : "Keluar"}
    </button>
  );
}