/**
 * FCM HTTP v1 API sender.
 *
 * Sends push notifications to individual device tokens
 * via the Firebase Cloud Messaging HTTP v1 API.
 */

import { getAccessToken, getProjectId } from "./google-auth.ts";

export type FcmPayload = {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  notificationId?: string;
};

export type FcmSendResult = {
  token: string;
  success: boolean;
  messageId?: string;
  error?: string;
  shouldDeactivate?: boolean;
};

function responseMessageId(body: unknown): string | undefined {
  if (
    body !== null &&
    typeof body === "object" &&
    "name" in body &&
    typeof body.name === "string" &&
    body.name.trim() !== ""
  ) {
    return body.name;
  }

  return undefined;
}

/**
 * Sends a push notification to a single FCM token.
 */
export async function sendToToken(
  serviceAccountJson: string,
  token: string,
  payload: FcmPayload,
): Promise<FcmSendResult> {
  try {
    const accessToken = await getAccessToken(serviceAccountJson);
    const projectId = getProjectId(serviceAccountJson);

    const fcmUrl =
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    const message = {
      message: {
        token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        webpush: {
          notification: {
            icon: payload.icon || "/icon-192x192.png",
            badge: "/icon-192x192.png",
            tag: payload.notificationId || "humob",
            vibrate: [100, 50, 100],
          },
          fcm_options: {
            link: payload.url || "/dashboard/notifications",
          },
          data: {
            notification_id: payload.notificationId || "",
            url: payload.url || "/dashboard/notifications",
          },
        },
      },
    };

    const response = await fetch(fcmUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    const responseBody: unknown = await response.json().catch(() => null);

    if (response.ok) {
      return {
        token,
        success: true,
        messageId: responseMessageId(responseBody),
      };
    }

    const errorBody = responseBody;
    const errorCode = errorBody !== null &&
        typeof errorBody === "object" &&
        "error" in errorBody &&
        errorBody.error !== null &&
        typeof errorBody.error === "object" &&
        "details" in errorBody.error &&
        Array.isArray(errorBody.error.details)
      ? errorBody.error.details.find((detail) =>
        detail !== null &&
        typeof detail === "object" &&
        "errorCode" in detail &&
        typeof detail.errorCode === "string"
      )?.errorCode ?? ""
      : "";

    // Token is invalid or unregistered — should be deactivated
    const deactivateCodes = [
      "UNREGISTERED",
      "INVALID_ARGUMENT",
      "NOT_FOUND",
    ];

    const shouldDeactivate = deactivateCodes.includes(errorCode) ||
      response.status === 404 ||
      response.status === 400;

    return {
      token,
      success: false,
      error: `FCM error ${response.status}`,
      shouldDeactivate,
    };
  } catch (err) {
    return {
      token,
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Sends a push notification to multiple tokens.
 * Returns results for each token.
 */
export async function sendToTokens(
  serviceAccountJson: string,
  tokens: string[],
  payload: FcmPayload,
): Promise<FcmSendResult[]> {
  const results = await Promise.allSettled(
    tokens.map((token) => sendToToken(serviceAccountJson, token, payload)),
  );

  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    }
    return {
      token: tokens[index],
      success: false,
      error: result.reason?.message || "Unknown error",
    };
  });
}
