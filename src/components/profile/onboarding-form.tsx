"use client";

import type { FormEvent } from "react";

import {
  ArrowRight,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

import { useRouter } from "next/navigation";

import { useState } from "react";

import { AvatarInput } from "@/components/profile/avatar-input";
import { UsernameField } from "@/components/profile/username-field";

import {
  PROFILE_LIMITS,
  TIME_ZONE_OPTIONS,
} from "@/features/profile/constants";

import {
  checkUsernameAvailability,
  completeMyOnboarding,
} from "@/features/profile/profile-api";

import {
  removeAvatar,
  uploadAvatar,
} from "@/features/profile/avatar-storage";

import {
  normalizeUsername,
  validateBio,
  validateFullName,
  validateTimeZone,
  validateUsername,
} from "@/features/profile/validators";

import { createClient } from "@/lib/supabase/client";

type OnboardingFormProps = {
  userId: string;
  initialFullName: string;
  initialAvatarUrl: string | null;
  initialBio: string;
  initialTimeZone: string;
  nextPath: string;
};

type FormErrors = {
  fullName?: string;
  username?: string;
  bio?: string;
  timezone?: string;
};

export function OnboardingForm({
  userId,
  initialFullName,
  initialAvatarUrl,
  initialBio,
  initialTimeZone,
  nextPath,
}: OnboardingFormProps) {
  const router = useRouter();

  const [fullName, setFullName] =
    useState(initialFullName);

  const [username, setUsername] =
    useState("");

  const [bio, setBio] =
    useState(initialBio);

  const [timeZone, setTimeZone] =
    useState(initialTimeZone);

  const [avatarFile, setAvatarFile] =
    useState<File | null>(null);

  const [
    usernameAvailable,
    setUsernameAvailable,
  ] = useState<boolean | null>(null);

  const [errors, setErrors] =
    useState<FormErrors>({});

  const [
    submitError,
    setSubmitError,
  ] = useState<string | null>(null);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const hasInitialTimeZone =
    TIME_ZONE_OPTIONS.some(
      (option) =>
        option.value === timeZone,
    );

  const timeZoneOptions =
    hasInitialTimeZone
      ? [...TIME_ZONE_OPTIONS]
      : [
          {
            value: timeZone,
            label: timeZone,
          },
          ...TIME_ZONE_OPTIONS,
        ];

  function validateForm(): FormErrors {
    const nextErrors: FormErrors =
      {};

    const fullNameError =
      validateFullName(fullName);

    const usernameError =
      validateUsername(username);

    const bioError =
      validateBio(bio);

    const timeZoneError =
      validateTimeZone(timeZone);

    if (fullNameError) {
      nextErrors.fullName =
        fullNameError;
    }

    if (usernameError) {
      nextErrors.username =
        usernameError;
    }

    if (bioError) {
      nextErrors.bio = bioError;
    }

    if (timeZoneError) {
      nextErrors.timezone =
        timeZoneError;
    }

    return nextErrors;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const nextErrors =
      validateForm();

    setErrors(nextErrors);
    setSubmitError(null);

    if (
      Object.keys(nextErrors).length >
      0
    ) {
      return;
    }

    setIsSubmitting(true);

    const supabase =
      createClient();

    let uploadedAvatarPath:
      | string
      | null = null;

    try {
      const normalizedUsername =
        normalizeUsername(username);

      /*
       * Pengecekan final tetap dilakukan saat
       * submit agar tidak bergantung sepenuhnya
       * pada hasil debounce UI.
       */
      if (
        usernameAvailable !== true
      ) {
        const availability =
          await checkUsernameAvailability(
            supabase,
            normalizedUsername,
          );

        if (!availability.available) {
          setUsernameAvailable(false);

          setErrors({
            username:
              availability.message,
          });

          return;
        }
      }

      let avatarUrl =
        initialAvatarUrl;

      if (avatarFile) {
        const uploadedAvatar =
          await uploadAvatar(
            supabase,
            userId,
            avatarFile,
          );

        uploadedAvatarPath =
          uploadedAvatar.path;

        avatarUrl =
          uploadedAvatar.publicUrl;
      }

      const result =
        await completeMyOnboarding(
          supabase,
          {
            fullName:
              fullName.trim(),
            username:
              normalizedUsername,
            bio: bio.trim(),
            timezone: timeZone,
            avatarUrl,
          },
        );

      if (!result.success) {
        throw new Error(
          result.message,
        );
      }

      /*
       * Bila request bersamaan ternyata
       * menemukan onboarding sudah selesai,
       * file baru tidak digunakan dan dibersihkan.
       */
      if (
        uploadedAvatarPath &&
        result.code ===
          "ONBOARDING_ALREADY_COMPLETED"
      ) {
        await removeAvatar(
          supabase,
          uploadedAvatarPath,
        );
      }

      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      if (uploadedAvatarPath) {
        await removeAvatar(
          supabase,
          uploadedAvatarPath,
        );
      }

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Onboarding gagal diselesaikan.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-8"
    >
      <AvatarInput
        initialAvatarUrl={
          initialAvatarUrl
        }
        fullName={fullName}
        disabled={isSubmitting}
        onFileSelected={
          setAvatarFile
        }
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label
            htmlFor="full-name"
            className="text-sm font-medium text-zinc-200"
          >
            Nama tampilan
          </label>

          <input
            id="full-name"
            name="fullName"
            type="text"
            value={fullName}
            disabled={isSubmitting}
            autoComplete="name"
            minLength={
              PROFILE_LIMITS.fullNameMin
            }
            maxLength={
              PROFILE_LIMITS.fullNameMax
            }
            required
            aria-invalid={Boolean(
              errors.fullName,
            )}
            aria-describedby={
              errors.fullName
                ? "full-name-error"
                : undefined
            }
            onChange={(event) => {
              setFullName(
                event.target.value,
              );

              setErrors(
                (current) => ({
                  ...current,
                  fullName: undefined,
                }),
              );
            }}
            className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-700 focus:border-sky-400/60 disabled:cursor-not-allowed disabled:opacity-60"
            placeholder="Nama yang akan tampil di HuMob"
          />

          {errors.fullName ? (
            <p
              id="full-name-error"
              role="alert"
              className="text-xs text-red-300"
            >
              {errors.fullName}
            </p>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <UsernameField
            value={username}
            disabled={isSubmitting}
            onChange={(value) => {
              setUsername(value);

              setErrors(
                (current) => ({
                  ...current,
                  username: undefined,
                }),
              );
            }}
            onAvailabilityChange={
              setUsernameAvailable
            }
          />

          {errors.username ? (
            <p
              role="alert"
              className="mt-2 text-xs text-red-300"
            >
              {errors.username}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <label
              htmlFor="bio"
              className="text-sm font-medium text-zinc-200"
            >
              Bio{" "}
              <span className="font-normal text-zinc-600">
                (opsional)
              </span>
            </label>

            <span className="text-xs tabular-nums text-zinc-600">
              {bio.length}/
              {PROFILE_LIMITS.bioMax}
            </span>
          </div>

          <textarea
            id="bio"
            name="bio"
            value={bio}
            disabled={isSubmitting}
            maxLength={
              PROFILE_LIMITS.bioMax
            }
            rows={4}
            aria-invalid={Boolean(
              errors.bio,
            )}
            aria-describedby={
              errors.bio
                ? "bio-error"
                : undefined
            }
            onChange={(event) => {
              setBio(
                event.target.value,
              );

              setErrors(
                (current) => ({
                  ...current,
                  bio: undefined,
                }),
              );
            }}
            className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-6 text-white outline-none transition-colors placeholder:text-zinc-700 focus:border-sky-400/60 disabled:cursor-not-allowed disabled:opacity-60"
            placeholder="Ceritakan singkat tentang diri Anda."
          />

          {errors.bio ? (
            <p
              id="bio-error"
              role="alert"
              className="text-xs text-red-300"
            >
              {errors.bio}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label
            htmlFor="timezone"
            className="text-sm font-medium text-zinc-200"
          >
            Zona waktu
          </label>

          <select
            id="timezone"
            name="timezone"
            value={timeZone}
            disabled={isSubmitting}
            required
            aria-invalid={Boolean(
              errors.timezone,
            )}
            aria-describedby={
              errors.timezone
                ? "timezone-error"
                : "timezone-help"
            }
            onChange={(event) => {
              setTimeZone(
                event.target.value,
              );

              setErrors(
                (current) => ({
                  ...current,
                  timezone: undefined,
                }),
              );
            }}
            className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition-colors focus:border-sky-400/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {timeZoneOptions.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ),
            )}
          </select>

          <p
            id="timezone-help"
            className="text-xs leading-5 text-zinc-600"
          >
            Zona waktu menentukan tanggal
            Daily Match dan batas input
            harian.
          </p>

          {errors.timezone ? (
            <p
              id="timezone-error"
              role="alert"
              className="text-xs text-red-300"
            >
              {errors.timezone}
            </p>
          ) : null}
        </div>
      </div>

      {submitError ? (
        <div
          role="alert"
          className="rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm leading-6 text-red-300"
        >
          {submitError}
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/5 bg-white/[0.025] p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400"
          />

          <p className="text-xs leading-5 text-zinc-500">
            Username akan menjadi
            identitas HuMob Anda dan tidak
            dapat diubah setelah onboarding
            selesai. Email tidak ditampilkan
            pada profil.
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 font-medium text-black transition-colors hover:bg-zinc-200 disabled:cursor-wait disabled:opacity-60"
      >
        {isSubmitting ? (
          <LoaderCircle
            aria-hidden="true"
            className="h-5 w-5 animate-spin motion-reduce:animate-none"
          />
        ) : (
          <ArrowRight
            aria-hidden="true"
            className="h-5 w-5"
          />
        )}

        {isSubmitting
          ? "Menyimpan profil…"
          : "Selesaikan onboarding"}
      </button>
    </form>
  );
}