import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseConfig } from "@/lib/supabase/env";

const protectedRoutes = ["/dashboard"];

function isProtectedRoute(pathname: string) {
  return protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function copyCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });

  return target;
}

export async function updateSession(request: NextRequest) {
  const { url, publishableKey } = getSupabaseConfig();

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },

      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  let isAuthenticated = false;

  try {
    const { data } = await supabase.auth.getClaims();

    isAuthenticated = Boolean(data?.claims?.sub);
  } catch {
    isAuthenticated = false;
  }

  const pathname = request.nextUrl.pathname;

  if (!isAuthenticated && isProtectedRoute(pathname)) {
    const loginUrl = request.nextUrl.clone();

    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set(
      "next",
      `${pathname}${request.nextUrl.search}`,
    );

    return copyCookies(response, NextResponse.redirect(loginUrl));
  }

  if (isAuthenticated && pathname === "/login") {
    const dashboardUrl = request.nextUrl.clone();

    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";

    return copyCookies(response, NextResponse.redirect(dashboardUrl));
  }

  return response;
}