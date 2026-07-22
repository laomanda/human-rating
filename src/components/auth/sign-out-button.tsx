import { LogOut } from "lucide-react";

import { signOutAction } from "@/app/auth/action";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </form>
  );
}