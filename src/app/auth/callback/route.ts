import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function getSafeRedirectPath(value: string | null) {
  if (!value) {
    return "/dashboard";
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

function getApplicationOrigin(request: Request, fallbackOrigin: string) {
  if (process.env.NODE_ENV === "development") {
    return fallbackOrigin;
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProtocol =
    request.headers.get("x-forwarded-proto") ?? "https";

  if (forwardedHost) {
    return `${forwardedProtocol}://${forwardedHost}`;
  }

  return fallbackOrigin;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeRedirectPath(
    requestUrl.searchParams.get("next"),
  );

  const applicationOrigin = getApplicationOrigin(
    request,
    requestUrl.origin,
  );

  if (!code) {
    return NextResponse.redirect(
      `${applicationOrigin}/auth/auth-code-error`,
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Supabase OAuth code exchange failed:", error.message);

    return NextResponse.redirect(
      `${applicationOrigin}/auth/auth-code-error`,
    );
  }

  return NextResponse.redirect(`${applicationOrigin}${next}`);
}