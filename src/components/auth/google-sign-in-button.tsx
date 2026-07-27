"use client";

import { LoaderCircle } from "lucide-react";

import { useState } from "react";

import { getSafeInternalPath } from "@/lib/navigation/safe-redirect";

import { createClient } from "@/lib/supabase/client";

export function GoogleSignInButton() {
  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const supabase =
        createClient();

      const currentUrl =
        new URL(
          window.location.href,
        );

      const nextPath =
        getSafeInternalPath(
          currentUrl.searchParams.get(
            "next",
          ),
          "/dashboard",
        );

      const callbackUrl =
        new URL(
          "/auth/callback",
          window.location.origin,
        );

      callbackUrl.searchParams.set(
        "next",
        nextPath,
      );

      const { error } =
        await supabase.auth
          .signInWithOAuth({
            provider: "google",
            options: {
              redirectTo:
                callbackUrl.toString(),
            },
          });

      if (error) {
        throw error;
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Login Google gagal dimulai.",
      );

      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-5 py-3.5 font-medium text-black transition-colors hover:bg-zinc-200 disabled:cursor-wait disabled:opacity-60"
      >
        {isLoading ? (
          <LoaderCircle
            aria-hidden="true"
            className="h-5 w-5 animate-spin motion-reduce:animate-none"
          />
        ) : (
          <GoogleIcon />
        )}

        <span>
          {isLoading
            ? "Menghubungkan ke Google…"
            : "Lanjutkan dengan Google"}
        </span>
      </button>

      {errorMessage ? (
        <p
          role="alert"
          className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-center text-sm text-red-300"
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
    >
      <path
        fill="#4285F4"
        d="M21.6 12.227c0-.709-.064-1.391-.182-2.045H12v3.873h5.382a4.603 4.603 0 0 1-1.996 3.018v2.509h3.232c1.891-1.741 2.982-4.309 2.982-7.355Z"
      />

      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.964-.895 6.618-2.418l-3.232-2.509c-.895.6-2.041.955-3.386.955-2.605 0-4.809-1.759-5.596-4.123H3.064v2.591A9.997 9.997 0 0 0 12 22Z"
      />

      <path
        fill="#FBBC05"
        d="M6.404 13.905A6.01 6.01 0 0 1 6.091 12c0-.664.114-1.309.313-1.905V7.504h-3.34A9.995 9.995 0 0 0 2 12c0 1.614.386 3.141 1.064 4.496l3.34-2.591Z"
      />

      <path
        fill="#EA4335"
        d="M12 5.973c1.468 0 2.786.504 3.823 1.491l2.868-2.868C16.959 2.982 14.695 2 12 2a9.997 9.997 0 0 0-8.936 5.504l3.34 2.591C7.191 7.732 9.395 5.973 12 5.973Z"
      />
    </svg>
  );
}