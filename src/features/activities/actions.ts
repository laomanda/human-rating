"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { SupabaseClient, User } from "@supabase/supabase-js";

import { mapActivityDatabaseError } from "@/features/activities/formatters";
import type { ActivityActionState, DailyMatchStatus } from "@/features/activities/types";
import {
  validateDeleteActivityForm,
  validateOtherActivityForm,
  validatePhysicalActivityForm,
  validateProductiveActivityForm,
  validateSleepEntryForm,
} from "@/features/activities/validators";
import { createClient } from "@/lib/supabase/server";

type EditableMatchRow = {
  id: string;
  user_id: string;
  status: DailyMatchStatus;
  input_closes_at: string;
};

class ActivityActionError extends Error {}

function createActionState(
  status: ActivityActionState["status"],
  message: string,
  fieldErrors: ActivityActionState["fieldErrors"] = {},
): ActivityActionState {
  return {
    status,
    message,
    fieldErrors,
    completedAt: Date.now(),
  };
}

function createValidationError(
  fieldErrors: ActivityActionState["fieldErrors"],
): ActivityActionState {
  return createActionState(
    "error",
    "Please correct the highlighted fields.",
    fieldErrors,
  );
}

async function getAuthenticatedContext(): Promise<{
  supabase: SupabaseClient;
  user: User;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new ActivityActionError(
      "Your session has expired. Please sign in again.",
    );
  }

  return {
    supabase,
    user,
  };
}

async function assertEditableDailyMatch(
  supabase: SupabaseClient,
  userId: string,
  dailyMatchId: string,
): Promise<EditableMatchRow> {
  const { data, error } = await supabase
    .from("daily_matches")
    .select("id, user_id, status, input_closes_at")
    .eq("id", dailyMatchId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new ActivityActionError(mapActivityDatabaseError(error));
  }

  if (!data) {
    throw new ActivityActionError(
      "The selected Daily Match could not be found.",
    );
  }

  const match = data as EditableMatchRow;

  if (match.status !== "open" && match.status !== "editable") {
    throw new ActivityActionError(
      "Today's activity input is no longer open.",
    );
  }

  const closesAt = new Date(match.input_closes_at);
  if (Number.isNaN(closesAt.getTime()) || Date.now() >= closesAt.getTime()) {
    throw new ActivityActionError(
      "Today's activity input deadline has passed.",
    );
  }

  return match;
}

function handleActionError(error: unknown): ActivityActionState {
  revalidateActivityPages();

  if (error instanceof ActivityActionError) {
    return createActionState("error", error.message);
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    return createActionState(
      "error",
      mapActivityDatabaseError(
        error as {
          message: string;
          code?: string;
          details?: string;
          hint?: string;
        },
      ),
    );
  }

  return createActionState(
    "error",
    "The activity operation could not be completed.",
  );
}

function revalidateActivityPages() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/today");
}

/* ============================================================
 * SLEEP ENTRY ACTIONS
 * ============================================================
 */

export async function upsertSleepEntryAction(
  _previousState: ActivityActionState,
  formData: FormData,
): Promise<ActivityActionState> {
  const validation = validateSleepEntryForm(formData);

  if (!validation.success) {
    return createValidationError(validation.fieldErrors);
  }

  try {
    const { supabase, user } = await getAuthenticatedContext();
    await assertEditableDailyMatch(
      supabase,
      user.id,
      validation.data.dailyMatchId,
    );

    const { error } = await supabase.from("sleep_entries").upsert(
      {
        daily_match_id: validation.data.dailyMatchId,
        user_id: user.id,
        duration_minutes: validation.data.durationMinutes,
        quality: validation.data.quality,
        woke_during_sleep: validation.data.wokeDuringSleep,
        notes: validation.data.notes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "daily_match_id" },
    );

    if (error) {
      throw error;
    }

    revalidateActivityPages();
    return createActionState("success", "Sleep entry saved successfully.");
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteSleepEntryAction(
  _previousState: ActivityActionState,
  formData: FormData,
): Promise<ActivityActionState> {
  const dailyMatchId = formData.get("daily_match_id") as string;

  try {
    const { supabase, user } = await getAuthenticatedContext();
    await assertEditableDailyMatch(supabase, user.id, dailyMatchId);

    const { error } = await supabase
      .from("sleep_entries")
      .delete()
      .eq("daily_match_id", dailyMatchId)
      .eq("user_id", user.id);

    if (error) {
      throw error;
    }

    revalidateActivityPages();
    return createActionState("success", "Sleep entry deleted.");
  } catch (error) {
    return handleActionError(error);
  }
}

/* ============================================================
 * PHYSICAL ACTIVITY ACTIONS
 * ============================================================
 */

export async function createPhysicalActivityAction(
  _previousState: ActivityActionState,
  formData: FormData,
): Promise<ActivityActionState> {
  const validation = validatePhysicalActivityForm(formData, {
    requireActivityId: false,
  });

  if (!validation.success) {
    return createValidationError(validation.fieldErrors);
  }

  try {
    const { supabase, user } = await getAuthenticatedContext();
    await assertEditableDailyMatch(
      supabase,
      user.id,
      validation.data.dailyMatchId,
    );

    const { error } = await supabase.from("physical_activities").insert({
      client_instance_id: randomUUID(),
      daily_match_id: validation.data.dailyMatchId,
      user_id: user.id,
      activity_type: validation.data.activityType,
      custom_activity_name: validation.data.customActivityName,
      intensity: validation.data.intensity,
      reason: validation.data.reason,
    });

    if (error) {
      throw error;
    }

    revalidateActivityPages();
    return createActionState(
      "success",
      "Physical activity added successfully.",
    );
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updatePhysicalActivityAction(
  _previousState: ActivityActionState,
  formData: FormData,
): Promise<ActivityActionState> {
  const validation = validatePhysicalActivityForm(formData, {
    requireActivityId: true,
  });

  if (!validation.success) {
    return createValidationError(validation.fieldErrors);
  }

  if (!validation.data.activityId) {
    return createActionState("error", "Physical activity ID is missing.");
  }

  try {
    const { supabase, user } = await getAuthenticatedContext();
    await assertEditableDailyMatch(
      supabase,
      user.id,
      validation.data.dailyMatchId,
    );

    const { data, error } = await supabase
      .from("physical_activities")
      .update({
        activity_type: validation.data.activityType,
        custom_activity_name: validation.data.customActivityName,
        intensity: validation.data.intensity,
        reason: validation.data.reason,
      })
      .eq("id", validation.data.activityId)
      .eq("user_id", user.id)
      .eq("daily_match_id", validation.data.dailyMatchId)
      .select("id")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new ActivityActionError(
        "The physical activity could not be found.",
      );
    }

    revalidateActivityPages();
    return createActionState(
      "success",
      "Physical activity updated successfully.",
    );
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deletePhysicalActivityAction(
  _previousState: ActivityActionState,
  formData: FormData,
): Promise<ActivityActionState> {
  const validation = validateDeleteActivityForm(formData);

  if (!validation.success) {
    return createValidationError(validation.fieldErrors);
  }

  try {
    const { supabase, user } = await getAuthenticatedContext();
    await assertEditableDailyMatch(
      supabase,
      user.id,
      validation.data.dailyMatchId,
    );

    const { data, error } = await supabase
      .from("physical_activities")
      .delete()
      .eq("id", validation.data.activityId)
      .eq("user_id", user.id)
      .eq("daily_match_id", validation.data.dailyMatchId)
      .select("id")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new ActivityActionError(
        "The physical activity could not be found.",
      );
    }

    revalidateActivityPages();
    return createActionState("success", "Physical activity deleted.");
  } catch (error) {
    return handleActionError(error);
  }
}

/* ============================================================
 * PRODUCTIVE ACTIVITY ACTIONS
 * ============================================================
 */

export async function createProductiveActivityAction(
  _previousState: ActivityActionState,
  formData: FormData,
): Promise<ActivityActionState> {
  const validation = validateProductiveActivityForm(formData, {
    requireActivityId: false,
  });

  if (!validation.success) {
    return createValidationError(validation.fieldErrors);
  }

  try {
    const { supabase, user } = await getAuthenticatedContext();
    await assertEditableDailyMatch(
      supabase,
      user.id,
      validation.data.dailyMatchId,
    );

    const { error } = await supabase.from("productive_activities").insert({
      client_instance_id: randomUUID(),
      daily_match_id: validation.data.dailyMatchId,
      user_id: user.id,
      category: validation.data.category,
      title: validation.data.title,
      description: validation.data.description,
    });

    if (error) {
      throw error;
    }

    revalidateActivityPages();
    return createActionState(
      "success",
      "Productive activity added successfully.",
    );
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateProductiveActivityAction(
  _previousState: ActivityActionState,
  formData: FormData,
): Promise<ActivityActionState> {
  const validation = validateProductiveActivityForm(formData, {
    requireActivityId: true,
  });

  if (!validation.success) {
    return createValidationError(validation.fieldErrors);
  }

  if (!validation.data.activityId) {
    return createActionState("error", "Productive activity ID is missing.");
  }

  try {
    const { supabase, user } = await getAuthenticatedContext();
    await assertEditableDailyMatch(
      supabase,
      user.id,
      validation.data.dailyMatchId,
    );

    const { data, error } = await supabase
      .from("productive_activities")
      .update({
        category: validation.data.category,
        title: validation.data.title,
        description: validation.data.description,
      })
      .eq("id", validation.data.activityId)
      .eq("user_id", user.id)
      .eq("daily_match_id", validation.data.dailyMatchId)
      .select("id")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new ActivityActionError(
        "The productive activity could not be found.",
      );
    }

    revalidateActivityPages();
    return createActionState(
      "success",
      "Productive activity updated successfully.",
    );
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteProductiveActivityAction(
  _previousState: ActivityActionState,
  formData: FormData,
): Promise<ActivityActionState> {
  const validation = validateDeleteActivityForm(formData);

  if (!validation.success) {
    return createValidationError(validation.fieldErrors);
  }

  try {
    const { supabase, user } = await getAuthenticatedContext();
    await assertEditableDailyMatch(
      supabase,
      user.id,
      validation.data.dailyMatchId,
    );

    const { data, error } = await supabase
      .from("productive_activities")
      .delete()
      .eq("id", validation.data.activityId)
      .eq("user_id", user.id)
      .eq("daily_match_id", validation.data.dailyMatchId)
      .select("id")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new ActivityActionError(
        "The productive activity could not be found.",
      );
    }

    revalidateActivityPages();
    return createActionState("success", "Productive activity deleted.");
  } catch (error) {
    return handleActionError(error);
  }
}

/* ============================================================
 * OTHER ACTIVITY ACTIONS
 * ============================================================
 */

export async function createOtherActivityAction(
  _previousState: ActivityActionState,
  formData: FormData,
): Promise<ActivityActionState> {
  const validation = validateOtherActivityForm(formData, {
    requireActivityId: false,
  });

  if (!validation.success) {
    return createValidationError(validation.fieldErrors);
  }

  try {
    const { supabase, user } = await getAuthenticatedContext();
    await assertEditableDailyMatch(
      supabase,
      user.id,
      validation.data.dailyMatchId,
    );

    const { error } = await supabase.from("other_activities").insert({
      client_instance_id: randomUUID(),
      daily_match_id: validation.data.dailyMatchId,
      user_id: user.id,
      category: validation.data.category,
      title: validation.data.title,
      description: validation.data.description,
      duration_minutes: validation.data.durationMinutes,
    });

    if (error) {
      throw error;
    }

    revalidateActivityPages();
    return createActionState(
      "success",
      "Other activity added successfully.",
    );
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateOtherActivityAction(
  _previousState: ActivityActionState,
  formData: FormData,
): Promise<ActivityActionState> {
  const validation = validateOtherActivityForm(formData, {
    requireActivityId: true,
  });

  if (!validation.success) {
    return createValidationError(validation.fieldErrors);
  }

  if (!validation.data.activityId) {
    return createActionState("error", "Activity ID is missing.");
  }

  try {
    const { supabase, user } = await getAuthenticatedContext();
    await assertEditableDailyMatch(
      supabase,
      user.id,
      validation.data.dailyMatchId,
    );

    const { data, error } = await supabase
      .from("other_activities")
      .update({
        category: validation.data.category,
        title: validation.data.title,
        description: validation.data.description,
        duration_minutes: validation.data.durationMinutes,
      })
      .eq("id", validation.data.activityId)
      .eq("user_id", user.id)
      .eq("daily_match_id", validation.data.dailyMatchId)
      .select("id")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new ActivityActionError("The activity could not be found.");
    }

    revalidateActivityPages();
    return createActionState("success", "Activity updated successfully.");
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteOtherActivityAction(
  _previousState: ActivityActionState,
  formData: FormData,
): Promise<ActivityActionState> {
  const validation = validateDeleteActivityForm(formData);

  if (!validation.success) {
    return createValidationError(validation.fieldErrors);
  }

  try {
    const { supabase, user } = await getAuthenticatedContext();
    await assertEditableDailyMatch(
      supabase,
      user.id,
      validation.data.dailyMatchId,
    );

    const { data, error } = await supabase
      .from("other_activities")
      .delete()
      .eq("id", validation.data.activityId)
      .eq("user_id", user.id)
      .eq("daily_match_id", validation.data.dailyMatchId)
      .select("id")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new ActivityActionError("The activity could not be found.");
    }

    revalidateActivityPages();
    return createActionState("success", "Activity deleted.");
  } catch (error) {
    return handleActionError(error);
  }
}