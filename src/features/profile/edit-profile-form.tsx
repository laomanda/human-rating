"use client";

import type { FormEvent } from "react";

import {
  ArrowLeft,
  LoaderCircle,
  LockKeyhole,
  Save,
} from "lucide-react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AvatarInput } from "@/components/profile/avatar-input";

import { PROFILE_LIMITS } from "@/features/profile/constants";

import {
  getManagedAvatarPath,
  removeAvatar,
  uploadAvatar,
} from "@/features/profile/avatar-storage";

import { updateMyProfile } from "@/features/profile/profile-api";

import type { ProfileRecord } from "@/features/profile/types";

import {
  validateBio,
  validateFullName,
} from "@/features/profile/validators";

import { createClient } from "@/lib/supabase/client";

type EditProfileFormProps = {
  userId: string;
  profile: ProfileRecord;
};

type FormErrors = {
  fullName?: string;
  bio?: string;
};

export function EditProfileForm({
  userId,
  profile,
}: EditProfileFormProps) {
  const router = useRouter();

  const initialFullName =
    profile.full_name ?? "";

  const initialBio =
    profile.bio ?? "";

  const [fullName, setFullName] =
    useState(initialFullName);

  const [bio, setBio] =
    useState(initialBio);

  const [avatarFile, setAvatarFile] =
    useState<File | null>(null);

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

  const hasChanges =
    fullName.trim() !==
      initialFullName.trim() ||
    bio.trim() !== initialBio.trim() ||
    avatarFile !== null;

  function validateForm(): FormErrors {
    const nextErrors: FormErrors = {};

    const fullNameError =
      validateFullName(fullName);

    const bioError =
      validateBio(bio);

    if (fullNameError) {
      nextErrors.fullName =
        fullNameError;
    }

    if (bioError) {
      nextErrors.bio = bioError;
    }

    return nextErrors;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      isSubmitting ||
      !hasChanges
    ) {
      return;
    }

    const nextErrors =
      validateForm();

    setErrors(nextErrors);
    setSubmitError(null);

    if (
      Object.keys(nextErrors).length > 0
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
      let nextAvatarUrl =
        profile.avatar_url;

      if (avatarFile) {
        const uploaded =
          await uploadAvatar(
            supabase,
            userId,
            avatarFile,
          );

        uploadedAvatarPath =
          uploaded.path;

        nextAvatarUrl =
          uploaded.publicUrl;
      }

      const result =
        await updateMyProfile(
          supabase,
          {
            fullName:
              fullName.trim(),
            bio: bio.trim(),
            avatarUrl:
              nextAvatarUrl,
          },
        );

      if (!result.success) {
        throw new Error(
          result.message,
        );
      }

      /*
       * Avatar lama baru dihapus setelah:
       * 1. avatar baru berhasil diunggah;
       * 2. URL avatar baru berhasil disimpan melalui RPC.
       */
      if (uploadedAvatarPath) {
        const oldAvatarPath =
          getManagedAvatarPath(
            profile.avatar_url,
            userId,
          );

        if (
          oldAvatarPath &&
          oldAvatarPath !==
            uploadedAvatarPath
        ) {
          await removeAvatar(
            supabase,
            oldAvatarPath,
          );
        }
      }

      router.replace(
        "/dashboard/profile",
      );

      router.refresh();
    } catch (error) {
      /*
       * Avatar baru yang belum berhasil dipakai
       * oleh profil harus dibersihkan.
       */
      if (uploadedAvatarPath) {
        await removeAvatar(
          supabase,
          uploadedAvatarPath,
        );
      }

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Profil gagal diperbarui.",
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
          profile.avatar_url
        }
        fullName={fullName}
        disabled={isSubmitting}
        onFileSelected={
          setAvatarFile
        }
      />

      <div className="grid gap-6">
        <div className="space-y-2">
          <label
            htmlFor="profile-full-name"
            className="text-sm font-medium text-zinc-200"
          >
            Nama tampilan
          </label>

          <input
            id="profile-full-name"
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
                ? "profile-full-name-error"
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
            className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition-colors placeholder:text-zinc-700 focus:border-sky-400/60 disabled:cursor-not-allowed disabled:opacity-60"
          />

          {errors.fullName ? (
            <p
              id="profile-full-name-error"
              role="alert"
              className="text-xs text-red-300"
            >
              {errors.fullName}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="profile-username"
            className="text-sm font-medium text-zinc-200"
          >
            Username
          </label>

          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-zinc-600">
              @
            </span>

            <input
              id="profile-username"
              type="text"
              value={
                profile.username ?? ""
              }
              readOnly
              disabled
              className="h-12 w-full cursor-not-allowed rounded-xl border border-white/5 bg-white/[0.025] py-3 pl-9 pr-11 text-sm text-zinc-500"
            />

            <LockKeyhole
              aria-hidden="true"
              className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600"
            />
          </div>

          <p className="text-xs leading-5 text-zinc-600">
            Username menjadi identitas
            permanen akun HuMob.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <label
              htmlFor="profile-bio"
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
            id="profile-bio"
            name="bio"
            value={bio}
            disabled={isSubmitting}
            maxLength={
              PROFILE_LIMITS.bioMax
            }
            rows={5}
            aria-invalid={Boolean(
              errors.bio,
            )}
            aria-describedby={
              errors.bio
                ? "profile-bio-error"
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
              id="profile-bio-error"
              role="alert"
              className="text-xs text-red-300"
            >
              {errors.bio}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-200">
            Zona waktu
          </p>

          <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.025] px-4 py-3">
            <LockKeyhole
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-zinc-600"
            />

            <span className="text-sm text-zinc-500">
              {profile.timezone}
            </span>
          </div>

          <p className="text-xs leading-5 text-zinc-600">
            Perubahan zona waktu akan
            tersedia melalui menu Pengaturan.
          </p>
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

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/dashboard/profile"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.07] hover:text-white"
        >
          <ArrowLeft
            aria-hidden="true"
            className="h-4 w-4"
          />

          Batal
        </Link>

        <button
          type="submit"
          disabled={
            isSubmitting ||
            !hasChanges
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <LoaderCircle
              aria-hidden="true"
              className="h-4 w-4 animate-spin motion-reduce:animate-none"
            />
          ) : (
            <Save
              aria-hidden="true"
              className="h-4 w-4"
            />
          )}

          {isSubmitting
            ? "Menyimpan…"
            : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  );
}