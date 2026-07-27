"use client";

import type { ChangeEvent } from "react";

import {
  Camera,
  ImagePlus,
  Trash2,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { MAX_AVATAR_SIZE_LABEL } from "@/features/profile/constants";

import { validateAvatarFile } from "@/features/profile/validators";

type AvatarInputProps = {
  initialAvatarUrl: string | null;
  fullName: string;
  disabled?: boolean;
  onFileSelected: (
    file: File | null,
  ) => void;
};

export function AvatarInput({
  initialAvatarUrl,
  fullName,
  disabled = false,
  onFileSelected,
}: AvatarInputProps) {
  const inputRef =
    useRef<HTMLInputElement>(null);

  const objectUrlRef =
    useRef<string | null>(null);

  const [previewUrl, setPreviewUrl] =
    useState<string | null>(
      initialAvatarUrl,
    );

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(
          objectUrlRef.current,
        );
      }
    };
  }, []);

  function clearObjectUrl() {
    if (!objectUrlRef.current) {
      return;
    }

    URL.revokeObjectURL(
      objectUrlRef.current,
    );

    objectUrlRef.current = null;
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0] ?? null;

    if (!file) {
      return;
    }

    const validationError =
      validateAvatarFile(file);

    if (validationError) {
      setErrorMessage(validationError);
      event.target.value = "";
      return;
    }

    clearObjectUrl();

    const nextPreviewUrl =
      URL.createObjectURL(file);

    objectUrlRef.current =
      nextPreviewUrl;

    setPreviewUrl(nextPreviewUrl);
    setErrorMessage(null);
    onFileSelected(file);
  }

  function handleReset() {
    clearObjectUrl();

    setPreviewUrl(initialAvatarUrl);
    setErrorMessage(null);
    onFileSelected(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) =>
        part.charAt(0).toUpperCase(),
      )
      .join("") || "H";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
          {previewUrl ? (
            <div
              role="img"
              aria-label={`Foto profil ${
                fullName || "HuMob"
              }`}
              className="h-full w-full bg-cover bg-center"
              style={{
                backgroundImage:
                  `url(${JSON.stringify(
                    previewUrl,
                  )})`,
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-zinc-300">
              {initials}
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center bg-black/55 py-2 text-white backdrop-blur-sm">
            <Camera
              aria-hidden="true"
              className="h-4 w-4"
            />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="font-medium text-white">
            Foto profil
          </h2>

          <p className="mt-1 text-sm leading-6 text-zinc-500">
            Gunakan foto JPG, PNG, atau
            WEBP dengan ukuran maksimal{" "}
            {MAX_AVATAR_SIZE_LABEL}.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() =>
                inputRef.current?.click()
              }
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ImagePlus
                aria-hidden="true"
                className="h-4 w-4"
              />

              Pilih foto
            </button>

            {previewUrl !==
            initialAvatarUrl ? (
              <button
                type="button"
                disabled={disabled}
                onClick={handleReset}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2
                  aria-hidden="true"
                  className="h-4 w-4"
                />

                Batalkan
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={disabled}
        onChange={handleFileChange}
        className="sr-only"
        aria-label="Pilih foto profil"
      />

      {errorMessage ? (
        <p
          role="alert"
          className="rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300"
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}