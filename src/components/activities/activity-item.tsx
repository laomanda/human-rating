"use client";

import {
  Activity,
  BriefcaseBusiness,
  Clock3,
  Edit3,
  X,
} from "lucide-react";

import { useState } from "react";

import { ActivityDeleteButton } from "@/components/activities/activity-delete-button";
import { PhysicalActivityForm } from "@/components/activities/physical-activity-form";
import { ProductiveActivityForm } from "@/components/activities/productive-activity-form";

import {
  formatActivityIntensity,
  formatPhysicalActivityType,
  formatProductiveCategory,
} from "@/features/activities/formatters";

import type {
  PhysicalActivity,
  ProductiveActivity,
} from "@/features/activities/types";

type PhysicalActivityItemProps = {
  kind: "physical";
  activity: PhysicalActivity;
  canEdit: boolean;
};

type ProductiveActivityItemProps = {
  kind: "productive";
  activity: ProductiveActivity;
  canEdit: boolean;
};

type ActivityItemProps =
  | PhysicalActivityItemProps
  | ProductiveActivityItemProps;

export function ActivityItem(
  props: ActivityItemProps,
) {
  const [isEditing, setIsEditing] =
    useState(false);

  const { activity, canEdit } = props;

  if (isEditing && canEdit) {
    return (
      <article className="rounded-2xl border border-white/10 bg-black/30 p-5">
        <div className="mb-5 flex justify-end">
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-400 transition hover:bg-white/5 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </button>
        </div>

        {props.kind === "physical" ? (
          <PhysicalActivityForm
            dailyMatchId={
              props.activity.daily_match_id
            }
            activity={props.activity}
            onSuccess={() => {
              setIsEditing(false);
            }}
          />
        ) : (
          <ProductiveActivityForm
            dailyMatchId={
              props.activity.daily_match_id
            }
            activity={props.activity}
            onSuccess={() => {
              setIsEditing(false);
            }}
          />
        )}
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-white/10 bg-black/25 p-5">
      <div className="flex flex-col justify-between gap-5 sm:flex-row">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-400">
              {props.kind === "physical" ? (
                <Activity className="h-5 w-5" />
              ) : (
                <BriefcaseBusiness className="h-5 w-5" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              {props.kind === "physical" ? (
                <PhysicalContent
                  activity={props.activity}
                />
              ) : (
                <ProductiveContent
                  activity={props.activity}
                />
              )}

              <div className="mt-4 flex items-center gap-2 text-xs text-zinc-600">
                <Clock3 className="h-3.5 w-3.5" />
                {new Intl.DateTimeFormat(
                  "id-ID",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                ).format(
                  new Date(
                    activity.created_at,
                  ),
                )}
              </div>
            </div>
          </div>
        </div>

        {canEdit ? (
          <div className="flex shrink-0 items-start gap-2">
            <button
              type="button"
              onClick={() => {
                setIsEditing(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit
            </button>

            <ActivityDeleteButton
              kind={props.kind}
              activityId={activity.id}
              dailyMatchId={
                activity.daily_match_id
              }
              onSuccess={() => {
                setIsEditing(false);
              }}
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}

function PhysicalContent({
  activity,
}: {
  activity: PhysicalActivity;
}) {
  const title =
    activity.activity_type === "other"
      ? activity.custom_activity_name ??
        "Other Activity"
      : formatPhysicalActivityType(
          activity.activity_type,
        );

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-medium text-white">
          {title}
        </h3>

        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-400">
          {formatActivityIntensity(
            activity.intensity,
          )}
        </span>
      </div>

      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-400">
        {activity.reason}
      </p>
    </>
  );
}

function ProductiveContent({
  activity,
}: {
  activity: ProductiveActivity;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-medium text-white">
          {activity.title}
        </h3>

        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-400">
          {formatProductiveCategory(
            activity.category,
          )}
        </span>
      </div>

      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-400">
        {activity.description}
      </p>
    </>
  );
}