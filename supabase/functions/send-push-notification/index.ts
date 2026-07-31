/**
 * HuMob Edge Function: send-push-notification
 *
 * Invoked by the notifications database trigger through pg_net. The request
 * carries only a notification id; the owning user is always read from the row.
 */

import { createAdminClient } from "../_shared/rating/database.ts";
import { timingSafeEqual } from "../_shared/rating/utils.ts";
import { type FcmPayload, sendToTokens } from "../_shared/fcm/fcm-sender.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-humob-push-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type NotificationType =
  | "daily_match_morning"
  | "daily_match_afternoon"
  | "daily_match_evening"
  | "daily_match_last_warning"
  | "rating_ready"
  | "achievement"
  | "rating_delayed"
  | "account_deletion";

type DeliveryStatus = "pending" | "sent" | "failed" | "skipped";

type NotificationRow = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  delivery_status: DeliveryStatus;
  scheduled_for: string | null;
};

type NotificationPreferences = {
  push_enabled: boolean;
  morning_reminder_enabled: boolean;
  afternoon_reminder_enabled: boolean;
  evening_reminder_enabled: boolean;
  final_reminder_enabled: boolean;
  rating_ready_enabled: boolean;
  achievement_enabled: boolean;
};

type DeviceToken = {
  token: string;
};

function jsonResponse(body: Record<string, string>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizedSecret(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? "";
  return normalized === "" ? null : normalized;
}

function isAuthorized(req: Request): boolean {
  const expected = normalizedSecret(Deno.env.get("HUMOB_RATING_JOB_SECRET"));
  const received = normalizedSecret(req.headers.get("x-humob-push-secret"));

  return Boolean(expected && received && timingSafeEqual(expected, received));
}

function notificationAllowsPush(
  type: NotificationType,
  preferences: NotificationPreferences | null,
): boolean {
  if (!preferences) {
    return true;
  }

  if (!preferences.push_enabled) {
    return false;
  }

  switch (type) {
    case "daily_match_morning":
      return preferences.morning_reminder_enabled;
    case "daily_match_afternoon":
      return preferences.afternoon_reminder_enabled;
    case "daily_match_evening":
      return preferences.evening_reminder_enabled;
    case "daily_match_last_warning":
      return preferences.final_reminder_enabled;
    case "rating_ready":
      return preferences.rating_ready_enabled;
    case "achievement":
      return preferences.achievement_enabled;
    default:
      return true;
  }
}

function isFutureSchedule(scheduledFor: string | null): boolean {
  if (!scheduledFor) {
    return false;
  }

  const scheduledAt = new Date(scheduledFor).getTime();
  return Number.isFinite(scheduledAt) && scheduledAt > Date.now();
}

async function updateDeliveryStatus(
  supabase: ReturnType<typeof createAdminClient>,
  notificationId: string,
  status: DeliveryStatus,
  fields: {
    sent_at?: string;
    fcm_message_id?: string | null;
    error_message?: string | null;
  } = {},
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ delivery_status: status, ...fields })
    .eq("id", notificationId);

  if (error) {
    console.error("Notification delivery status update failed", {
      notificationId,
      code: error.code ?? null,
    });
  }
}

function notificationIdFromBody(body: unknown): string | null {
  if (
    body !== null &&
    typeof body === "object" &&
    "notification_id" in body &&
    typeof body.notification_id === "string" &&
    body.notification_id.trim() !== ""
  ) {
    return body.notification_id;
  }

  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (!isAuthorized(req)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid request" }, 400);
  }

  const notificationId = notificationIdFromBody(body);
  if (!notificationId) {
    return jsonResponse({ error: "Invalid request" }, 400);
  }

  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch {
    console.error("Notification delivery environment is incomplete");
    return jsonResponse({ error: "Delivery unavailable" }, 500);
  }

  try {
    const { data, error } = await supabase
      .from("notifications")
      .select(
        "id, user_id, type, title, message, delivery_status, scheduled_for",
      )
      .eq("id", notificationId)
      .maybeSingle();

    const notification = data as NotificationRow | null;
    if (error || !notification) {
      console.error("Notification lookup failed", {
        notificationId,
        code: error?.code ?? null,
      });
      return jsonResponse({ error: "Notification unavailable" }, 404);
    }

    if (
      notification.delivery_status === "sent" ||
      notification.delivery_status === "skipped"
    ) {
      return jsonResponse({ status: "already_processed" });
    }

    if (isFutureSchedule(notification.scheduled_for)) {
      return jsonResponse({ status: "scheduled" });
    }

    const { data: preferencesData } = await supabase
      .from("notification_preferences")
      .select(
        "push_enabled, morning_reminder_enabled, afternoon_reminder_enabled, evening_reminder_enabled, final_reminder_enabled, rating_ready_enabled, achievement_enabled",
      )
      .eq("user_id", notification.user_id)
      .maybeSingle();

    const preferences = preferencesData as NotificationPreferences | null;
    if (!notificationAllowsPush(notification.type, preferences)) {
      await updateDeliveryStatus(
        supabase,
        notification.id,
        "skipped",
        {
          sent_at: new Date().toISOString(),
          error_message: "PUSH_DISABLED",
        },
      );
      return jsonResponse({ status: "skipped" });
    }

    const { data: tokensData, error: tokensError } = await supabase
      .from("device_tokens")
      .select("token")
      .eq("user_id", notification.user_id)
      .eq("is_active", true);

    const tokens = (tokensData ?? []) as DeviceToken[];
    if (tokensError || tokens.length === 0) {
      await updateDeliveryStatus(
        supabase,
        notification.id,
        "skipped",
        {
          sent_at: new Date().toISOString(),
          error_message: "NO_ACTIVE_DEVICE_TOKENS",
        },
      );
      return jsonResponse({ status: "skipped" });
    }

    const serviceAccountJson = normalizedSecret(
      Deno.env.get("FCM_SERVICE_ACCOUNT_JSON"),
    );
    if (!serviceAccountJson) {
      await updateDeliveryStatus(
        supabase,
        notification.id,
        "failed",
        { error_message: "FCM_NOT_CONFIGURED" },
      );
      return jsonResponse({ error: "Delivery unavailable" }, 500);
    }

    const payload: FcmPayload = {
      title: notification.title,
      body: notification.message,
      icon: "/icon-192x192.png",
      url: "/dashboard/notifications",
      notificationId: notification.id,
    };

    const tokenStrings = tokens.map(({ token }) => token);
    const results = await sendToTokens(
      serviceAccountJson,
      tokenStrings,
      payload,
    );
    const staleTokens = results
      .filter((result) => result.shouldDeactivate)
      .map((result) => result.token);

    if (staleTokens.length > 0) {
      const { error: deactivateError } = await supabase
        .from("device_tokens")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .in("token", staleTokens)
        .eq("user_id", notification.user_id);

      if (deactivateError) {
        console.error("Stale device tokens could not be deactivated", {
          notificationId,
          code: deactivateError.code ?? null,
        });
      }
    }

    const successfulResult = results.find((result) => result.success);
    if (!successfulResult) {
      await updateDeliveryStatus(
        supabase,
        notification.id,
        "failed",
        { error_message: "FCM_DELIVERY_FAILED" },
      );
      return jsonResponse({ status: "failed" }, 502);
    }

    await updateDeliveryStatus(
      supabase,
      notification.id,
      "sent",
      {
        sent_at: new Date().toISOString(),
        fcm_message_id: successfulResult.messageId ?? null,
        error_message: null,
      },
    );

    return jsonResponse({ status: "sent" });
  } catch (error) {
    console.error("Notification delivery failed", {
      notificationId,
      message: error instanceof Error ? error.message : "unknown",
    });
    await updateDeliveryStatus(
      supabase,
      notificationId,
      "failed",
      { error_message: "PUSH_DELIVERY_FAILED" },
    );
    return jsonResponse({ error: "Delivery failed" }, 500);
  }
});
