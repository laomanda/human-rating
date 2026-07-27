import { NextResponse } from "next/server";

import { getMyProfile } from "@/features/profile/queries";

import { getSafeInternalPath } from "@/lib/navigation/safe-redirect";

import { createClient } from "@/lib/supabase/server";

function createRedirectUrl(
  origin: string,
  path: string,
): URL {
  return new URL(path, origin);
}

export async function GET(
  request: Request,
) {
  const requestUrl =
    new URL(request.url);

  const code =
    requestUrl.searchParams.get(
      "code",
    );

  const nextPath =
    getSafeInternalPath(
      requestUrl.searchParams.get(
        "next",
      ),
      "/dashboard",
    );

  const applicationOrigin =
    requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(
      createRedirectUrl(
        applicationOrigin,
        "/auth/auth-code-error",
      ),
    );
  }

  const supabase =
    await createClient();

  const {
    error: exchangeError,
  } =
    await supabase.auth
      .exchangeCodeForSession(code);

  if (exchangeError) {
    console.error(
      "Supabase OAuth code exchange failed:",
      exchangeError.message,
    );

    return NextResponse.redirect(
      createRedirectUrl(
        applicationOrigin,
        "/auth/auth-code-error",
      ),
    );
  }

  const {
    data: { user },
    error: userError,
  } =
    await supabase.auth.getUser();

  if (userError || !user) {
    console.error(
      "Authenticated user could not be loaded after OAuth callback:",
      userError?.message ??
        "User missing",
    );

    return NextResponse.redirect(
      createRedirectUrl(
        applicationOrigin,
        "/auth/auth-code-error",
      ),
    );
  }

  try {
    const profile =
      await getMyProfile(
        supabase,
        user.id,
      );

    if (
      !profile ||
      profile.account_status !==
        "active"
    ) {
      return NextResponse.redirect(
        createRedirectUrl(
          applicationOrigin,
          "/auth/auth-code-error",
        ),
      );
    }

    if (
      !profile.onboarding_completed
    ) {
      const onboardingUrl =
        createRedirectUrl(
          applicationOrigin,
          "/onboarding",
        );

      onboardingUrl.searchParams.set(
        "next",
        nextPath,
      );

      return NextResponse.redirect(
        onboardingUrl,
      );
    }

    const destination =
      nextPath.startsWith(
        "/onboarding",
      )
        ? "/dashboard"
        : nextPath;

    return NextResponse.redirect(
      createRedirectUrl(
        applicationOrigin,
        destination,
      ),
    );
  } catch (error) {
    console.error(
      "Profile lookup failed after OAuth callback:",
      error instanceof Error
        ? error.message
        : error,
    );

    return NextResponse.redirect(
      createRedirectUrl(
        applicationOrigin,
        "/auth/auth-code-error",
      ),
    );
  }
}