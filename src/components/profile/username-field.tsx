"use client";

import type { ChangeEvent } from "react";

import {
  CheckCircle2,
  LoaderCircle,
  TriangleAlert,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { checkUsernameAvailability } from "@/features/profile/profile-api";

import {
  normalizeUsername,
  validateUsername,
} from "@/features/profile/validators";

import { createClient } from "@/lib/supabase/client";

type UsernameFieldProps = {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onAvailabilityChange: (
    available: boolean | null,
  ) => void;
};

type UsernameState =
  | {
      kind: "idle";
      message: string;
    }
  | {
      kind: "checking";
      message: string;
    }
  | {
      kind: "available";
      message: string;
    }
  | {
      kind: "unavailable";
      message: string;
    }
  | {
      kind: "error";
      message: string;
    };

export function UsernameField({
  value,
  disabled = false,
  onChange,
  onAvailabilityChange,
}: UsernameFieldProps) {
  const timeoutRef =
    useRef<ReturnType<
      typeof setTimeout
    > | null>(null);

  const requestIdRef =
    useRef(0);

  const mountedRef =
    useRef(true);

  const [status, setStatus] =
    useState<UsernameState>({
      kind: "idle",
      message:
        "Gunakan 4–20 karakter: huruf kecil, angka, titik, atau underscore.",
    });

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      if (timeoutRef.current) {
        clearTimeout(
          timeoutRef.current,
        );
      }
    };
  }, []);

  function scheduleAvailabilityCheck(
    nextValue: string,
  ) {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const requestId =
      requestIdRef.current + 1;

    requestIdRef.current =
      requestId;

    const validationError =
      validateUsername(nextValue);

    if (validationError) {
      setStatus({
        kind: nextValue
          ? "unavailable"
          : "idle",
        message:
          validationError ??
          "Gunakan 4–20 karakter.",
      });

      onAvailabilityChange(false);
      return;
    }

    setStatus({
      kind: "checking",
      message:
        "Memeriksa ketersediaan username…",
    });

    onAvailabilityChange(null);

    timeoutRef.current =
      setTimeout(async () => {
        try {
          const supabase =
            createClient();

          const result =
            await checkUsernameAvailability(
              supabase,
              nextValue,
            );

          if (
            !mountedRef.current ||
            requestIdRef.current !==
              requestId
          ) {
            return;
          }

          setStatus({
            kind: result.available
              ? "available"
              : "unavailable",
            message: result.message,
          });

          onAvailabilityChange(
            result.available,
          );
        } catch (error) {
          if (
            !mountedRef.current ||
            requestIdRef.current !==
              requestId
          ) {
            return;
          }

          setStatus({
            kind: "error",
            message:
              error instanceof Error
                ? error.message
                : "Username gagal diperiksa.",
          });

          onAvailabilityChange(null);
        }
      }, 450);
  }

  function handleChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const nextValue =
      normalizeUsername(
        event.target.value,
      );

    onChange(nextValue);

    scheduleAvailabilityCheck(
      nextValue,
    );
  }

  const descriptionId =
    "username-description";

  return (
    <div className="space-y-2">
      <label
        htmlFor="username"
        className="text-sm font-medium text-zinc-200"
      >
        Username
      </label>

      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-zinc-600">
          @
        </span>

        <input
          id="username"
          name="username"
          type="text"
          value={value}
          disabled={disabled}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          minLength={4}
          maxLength={20}
          required
          aria-describedby={
            descriptionId
          }
          onChange={handleChange}
          className="h-12 w-full rounded-xl border border-white/10 bg-black/30 py-3 pl-9 pr-11 text-sm text-white outline-none transition-colors placeholder:text-zinc-700 focus:border-sky-400/60 disabled:cursor-not-allowed disabled:opacity-60"
          placeholder="nama.pengguna"
        />

        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
          {status.kind ===
          "checking" ? (
            <LoaderCircle
              aria-hidden="true"
              className="h-4 w-4 animate-spin text-zinc-500 motion-reduce:animate-none"
            />
          ) : null}

          {status.kind ===
          "available" ? (
            <CheckCircle2
              aria-hidden="true"
              className="h-4 w-4 text-emerald-400"
            />
          ) : null}

          {status.kind ===
            "unavailable" ||
          status.kind === "error" ? (
            <TriangleAlert
              aria-hidden="true"
              className="h-4 w-4 text-amber-400"
            />
          ) : null}
        </div>
      </div>

      <p
        id={descriptionId}
        aria-live="polite"
        className={
          status.kind === "available"
            ? "text-xs text-emerald-400"
            : status.kind ===
                  "unavailable" ||
                status.kind === "error"
              ? "text-xs text-amber-400"
              : "text-xs text-zinc-600"
        }
      >
        {status.message}
      </p>
    </div>
  );
}