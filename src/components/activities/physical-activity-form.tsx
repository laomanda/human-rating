"use client";

import {
  Activity,
  LoaderCircle,
  Save,
} from "lucide-react";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  createPhysicalActivityAction,
  updatePhysicalActivityAction,
} from "@/features/activities/actions";

import {
  ACTIVITY_INTENSITIES,
  INITIAL_ACTIVITY_ACTION_STATE,
  PHYSICAL_ACTIVITY_TYPES,
} from "@/features/activities/types";

import {
  formatActivityIntensity,
  formatPhysicalActivityType,
} from "@/features/activities/formatters";

import type {
  PhysicalActivity,
  PhysicalActivityType,
} from "@/features/activities/types";

type PhysicalActivityFormProps = {
  dailyMatchId: string;
  activity?: PhysicalActivity;
  onSuccess?: () => void;
};

export function PhysicalActivityForm({
  dailyMatchId,
  activity,
  onSuccess,
}: PhysicalActivityFormProps) {
  const formRef =
    useRef<HTMLFormElement>(null);

  const [activityType, setActivityType] =
    useState<PhysicalActivityType>(
      activity?.activity_type ?? "walking",
    );

  const action = activity
    ? updatePhysicalActivityAction
    : createPhysicalActivityAction;

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
      setTimeout(() => setActivityType("walking"), 0);
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
          <Activity className="h-5 w-5" />
        </div>

        <div>
          <h3 className="font-medium text-white">
            {activity
              ? "Edit Physical Activity"
              : "Add Physical Activity"}
          </h3>

          <p className="text-sm text-zinc-500">
            Record movement, exercise, or physical work.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Activity Type">
          <select
            name="activity_type"
            value={activityType}
            onChange={(event) => {
              setActivityType(
                event.target
                  .value as PhysicalActivityType,
              );
            }}
            disabled={isPending}
            className={inputClassName}
          >
            {PHYSICAL_ACTIVITY_TYPES.map(
              (type) => (
                <option
                  key={type}
                  value={type}
                >
                  {formatPhysicalActivityType(
                    type,
                  )}
                </option>
              ),
            )}
          </select>

          <FieldError
            errors={
              state.fieldErrors.activity_type
            }
          />
        </Field>

        <Field label="Intensity">
          <select
            name="intensity"
            defaultValue={
              activity?.intensity ?? "moderate"
            }
            disabled={isPending}
            className={inputClassName}
          >
            {ACTIVITY_INTENSITIES.map(
              (intensity) => (
                <option
                  key={intensity}
                  value={intensity}
                >
                  {formatActivityIntensity(
                    intensity,
                  )}
                </option>
              ),
            )}
          </select>

          <FieldError
            errors={state.fieldErrors.intensity}
          />
        </Field>
      </div>

      {activityType === "other" ? (
        <Field label="Custom Activity Name">
          <input
            type="text"
            name="custom_activity_name"
            defaultValue={
              activity?.custom_activity_name ??
              ""
            }
            minLength={2}
            maxLength={80}
            required
            disabled={isPending}
            placeholder="Example: Badminton"
            className={inputClassName}
          />

          <FieldError
            errors={
              state.fieldErrors
                .custom_activity_name
            }
          />
        </Field>
      ) : null}

      <Field label="Reason or Context">
        <textarea
          name="reason"
          defaultValue={activity?.reason ?? ""}
          minLength={5}
          maxLength={500}
          required
          disabled={isPending}
          rows={4}
          placeholder="Why did you perform this activity?"
          className={`${inputClassName} resize-y`}
        />

        <FieldError
          errors={state.fieldErrors.reason}
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
            : "Add Physical Activity"}
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