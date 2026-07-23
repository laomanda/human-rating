"use client";

import {
  LoaderCircle,
  Trash2,
} from "lucide-react";

import {
  useActionState,
  useEffect,
} from "react";

import {
  deletePhysicalActivityAction,
  deleteProductiveActivityAction,
} from "@/features/activities/actions";

import {
  INITIAL_ACTIVITY_ACTION_STATE,
} from "@/features/activities/types";

type ActivityDeleteButtonProps = {
  kind: "physical" | "productive";
  activityId: string;
  dailyMatchId: string;
  onSuccess?: () => void;
};

export function ActivityDeleteButton({
  kind,
  activityId,
  dailyMatchId,
  onSuccess,
}: ActivityDeleteButtonProps) {
  const action =
    kind === "physical"
      ? deletePhysicalActivityAction
      : deleteProductiveActivityAction;

  const [state, formAction, isPending] =
    useActionState(
      action,
      INITIAL_ACTIVITY_ACTION_STATE,
    );

  useEffect(() => {
    if (state.status === "success") {
      onSuccess?.();
    }
  }, [
    state.completedAt,
    state.status,
    onSuccess,
  ]);

  return (
    <div className="space-y-2">
      <form
        action={formAction}
        onSubmit={(event) => {
          const confirmed =
            window.confirm(
              "Delete this activity permanently?",
            );

          if (!confirmed) {
            event.preventDefault();
          }
        }}
      >
        <input
          type="hidden"
          name="activity_id"
          value={activityId}
        />

        <input
          type="hidden"
          name="daily_match_id"
          value={dailyMatchId}
        />

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}

          {isPending ? "Deleting..." : "Delete"}
        </button>
      </form>

      {state.status === "error" ? (
        <p className="max-w-xs text-xs text-red-300">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}