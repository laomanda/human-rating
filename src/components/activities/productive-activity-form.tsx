"use client";

import {
  BriefcaseBusiness,
  LoaderCircle,
  Save,
} from "lucide-react";

import {
  useActionState,
  useEffect,
  useRef,
} from "react";

import {
  createProductiveActivityAction,
  updateProductiveActivityAction,
} from "@/features/activities/actions";

import {
  INITIAL_ACTIVITY_ACTION_STATE,
  PRODUCTIVE_CATEGORIES,
} from "@/features/activities/types";

import {
  formatProductiveCategory,
} from "@/features/activities/formatters";

import type {
  ProductiveActivity,
} from "@/features/activities/types";

type ProductiveActivityFormProps = {
  dailyMatchId: string;
  activity?: ProductiveActivity;
  onSuccess?: () => void;
};

export function ProductiveActivityForm({
  dailyMatchId,
  activity,
  onSuccess,
}: ProductiveActivityFormProps) {
  const formRef =
    useRef<HTMLFormElement>(null);

  const action = activity
    ? updateProductiveActivityAction
    : createProductiveActivityAction;

  const [state, formAction, isPending] =
    useActionState(
      action,
      INITIAL_ACTIVITY_ACTION_STATE,
    );

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    if (!activity) {
      formRef.current?.reset();
    }

    onSuccess?.();
  }, [
    state.completedAt,
    state.status,
    activity,
    onSuccess,
  ]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-5"
    >
      <input
        type="hidden"
        name="daily_match_id"
        value={dailyMatchId}
      />

      {activity ? (
        <input
          type="hidden"
          name="activity_id"
          value={activity.id}
        />
      ) : null}

      <div className="flex items-center gap-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-400">
          <BriefcaseBusiness className="h-5 w-5" />
        </div>

        <div>
          <h3 className="font-medium text-white">
            {activity
              ? "Edit Productive Activity"
              : "Add Productive Activity"}
          </h3>

          <p className="text-sm text-zinc-500">
            Record focused and productive work.
          </p>
        </div>
      </div>

      <Field label="Category">
        <select
          name="category"
          defaultValue={
            activity?.category ?? "work"
          }
          disabled={isPending}
          className={inputClassName}
        >
          {PRODUCTIVE_CATEGORIES.map(
            (category) => (
              <option
                key={category}
                value={category}
              >
                {formatProductiveCategory(
                  category,
                )}
              </option>
            ),
          )}
        </select>

        <FieldError
          errors={state.fieldErrors.category}
        />
      </Field>

      <Field label="Activity Title">
        <input
          type="text"
          name="title"
          defaultValue={activity?.title ?? ""}
          minLength={3}
          maxLength={120}
          required
          disabled={isPending}
          placeholder="Example: Develop HuMob dashboard"
          className={inputClassName}
        />

        <FieldError
          errors={state.fieldErrors.title}
        />
      </Field>

      <Field label="Description">
        <textarea
          name="description"
          defaultValue={
            activity?.description ?? ""
          }
          minLength={5}
          maxLength={500}
          required
          disabled={isPending}
          rows={4}
          placeholder="Describe what was completed and its context."
          className={`${inputClassName} resize-y`}
        />

        <FieldError
          errors={
            state.fieldErrors.description
          }
        />
      </Field>

      <ActionMessage state={state} />

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}

        {isPending
          ? "Saving..."
          : activity
            ? "Save Changes"
            : "Add Productive Activity"}
      </button>
    </form>
  );
}

const inputClassName =
  "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-white/25 disabled:cursor-not-allowed disabled:opacity-60";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-zinc-300">
        {label}
      </span>

      {children}
    </label>
  );
}

function FieldError({
  errors,
}: {
  errors?: string[];
}) {
  if (!errors?.length) {
    return null;
  }

  return (
    <p className="text-xs text-red-300">
      {errors[0]}
    </p>
  );
}

function ActionMessage({
  state,
}: {
  state: typeof INITIAL_ACTIVITY_ACTION_STATE;
}) {
  if (state.status === "idle") {
    return null;
  }

  return (
    <p
      aria-live="polite"
      className={
        state.status === "success"
          ? "rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300"
          : "rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300"
      }
    >
      {state.message}
    </p>
  );
}