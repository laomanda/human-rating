import {
  Activity,
  BriefcaseBusiness,
  Inbox,
} from "lucide-react";

import { ActivityItem } from "@/components/activities/activity-item";

import type {
  PhysicalActivity,
  ProductiveActivity,
} from "@/features/activities/types";

export function PhysicalActivityList({
  activities,
  canEdit,
}: {
  activities: PhysicalActivity[];
  canEdit: boolean;
}) {
  return (
    <ActivitySection
      icon={<Activity className="h-5 w-5" />}
      title="Physical Activities"
      description={`${activities.length} physical activity record(s)`}
    >
      {activities.length > 0 ? (
        <div className="space-y-3">
          {activities.map((activity) => (
            <ActivityItem
              key={activity.id}
              kind="physical"
              activity={activity}
              canEdit={canEdit}
            />
          ))}
        </div>
      ) : (
        <EmptyActivityList
          message="No physical activity has been recorded today."
        />
      )}
    </ActivitySection>
  );
}

export function ProductiveActivityList({
  activities,
  canEdit,
}: {
  activities: ProductiveActivity[];
  canEdit: boolean;
}) {
  return (
    <ActivitySection
      icon={
        <BriefcaseBusiness className="h-5 w-5" />
      }
      title="Productive Activities"
      description={`${activities.length} productive activity record(s)`}
    >
      {activities.length > 0 ? (
        <div className="space-y-3">
          {activities.map((activity) => (
            <ActivityItem
              key={activity.id}
              kind="productive"
              activity={activity}
              canEdit={canEdit}
            />
          ))}
        </div>
      ) : (
        <EmptyActivityList
          message="No productive activity has been recorded today."
        />
      )}
    </ActivitySection>
  );
}

function ActivitySection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-950 p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-400">
          {icon}
        </div>

        <div>
          <h2 className="font-medium text-white">
            {title}
          </h2>

          <p className="text-sm text-zinc-500">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}

function EmptyActivityList({
  message,
}: {
  message: string;
}) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/20 px-6">
      <div className="text-center">
        <Inbox className="mx-auto h-7 w-7 text-zinc-700" />

        <p className="mt-3 text-sm text-zinc-500">
          {message}
        </p>
      </div>
    </div>
  );
}