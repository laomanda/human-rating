/**
 * HuMob Edge Function: send-push-notification
 *
 * Called by the pg_net database trigger when a new notification is inserted.
 * Fetches the notification row, checks user preferences, retrieves active
 * device tokens, and sends FCM push notifications via the HTTP v1 API.
 *
 * Required secrets:
 * - FCM_SERVICE_ACCOUNT_JSON — Google service account key (JSON string)
 *
 * Available environment variables (auto-set by Supabase):
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";

import {
  sendToTokens,
  type FcmPayload,
} from "../_shared/fcm/fcm-sender.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    // 1. Parse request body
    const body = await req.json();
    const notificationId = body.notification_id;
    const userId = body.user_id;

    if (!notificationId || !userId) {
      return jsonResponse(
        { error: "Missing notification_id or user_id" },
        400,
      );
    }

    // 2. Get service account key
    const serviceAccountJson = Deno.env.get("FCM_SERVICE_ACCOUNT_JSON");
    if (!serviceAccountJson) {
      console.error("FCM_SERVICE_ACCOUNT_JSON not configured");
      return jsonResponse(
        { error: "FCM not configured" },
        500,
      );
    }

    // 3. Create admin Supabase client (service role)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 4. Fetch the notification row
    const { data: notification, error: notifError } = await supabase
      .from("notifications")
      .select("id, user_id, type, title, message, push_status")
      .eq("id", notificationId)
      .single();

    if (notifError || !notification) {
      console.error("Notification not found:", notifError?.message);
      return jsonResponse({ error: "Notification not found" }, 404);
    }

    // Skip if already processed
    if (notification.push_status === "sent" || notification.push_status === "skipped") {
      return jsonResponse({
        status: "already_processed",
        push_status: notification.push_status,
      });
    }

    // 5. Check user push preference
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("push_enabled")
      .eq("user_id", userId)
      .single();

    // Default to true if no preference row
    const pushEnabled = prefs?.push_enabled ?? true;

    if (!pushEnabled) {
      await supabase
        .from("notifications")
        .update({ push_status: "skipped" })
        .eq("id", notificationId);

      return jsonResponse({ status: "skipped", reason: "push_disabled" });
    }

    // 6. Fetch active device tokens for the user
    const { data: tokens, error: tokensError } = await supabase
      .from("device_tokens")
      .select("token")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (tokensError || !tokens || tokens.length === 0) {
      await supabase
        .from("notifications")
        .update({ push_status: "skipped" })
        .eq("id", notificationId);

      return jsonResponse({
        status: "skipped",
        reason: "no_active_tokens",
      });
    }

    // 7. Build FCM payload
    const payload: FcmPayload = {
      title: notification.title,
      body: notification.message,
      icon: "/icon-192x192.png",
      url: "/dashboard/notifications",
      notificationId: notification.id,
    };

    // 8. Send push to all active tokens
    const tokenStrings = tokens.map(
      (t: { token: string }) => t.token,
    );

    const results = await sendToTokens(
      serviceAccountJson,
      tokenStrings,
      payload,
    );

    // 9. Deactivate stale tokens
    const staleTokens = results
      .filter((r) => r.shouldDeactivate)
      .map((r) => r.token);

    if (staleTokens.length > 0) {
      for (const staleToken of staleTokens) {
        await supabase
          .from("device_tokens")
          .update({
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq("token", staleToken);
      }
    }

    // 10. Update push status
    const anySuccess = results.some((r) => r.success);
    await supabase
      .from("notifications")
      .update({
        push_status: anySuccess ? "sent" : "failed",
      })
      .eq("id", notificationId);

    return jsonResponse({
      status: anySuccess ? "sent" : "failed",
      total_tokens: tokenStrings.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      stale_deactivated: staleTokens.length,
    });
  } catch (err) {
    console.error("send-push-notification error:", err);
    return jsonResponse(
      {
        error: err instanceof Error ? err.message : "Internal error",
      },
      500,
    );
  }
});
