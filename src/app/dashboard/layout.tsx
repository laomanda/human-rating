import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell/app-shell";

import { getMyProfile } from "@/features/profile/queries";

import { createClient } from "@/lib/supabase/server";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const supabase =
    await createClient();

  const {
    data: { user },
    error: authError,
  } =
    await supabase.auth.getUser();

  if (authError || !user) {
    redirect(
      "/login?next=%2Fdashboard",
    );
  }

  let profile;

  try {
    profile =
      await getMyProfile(
        supabase,
        user.id,
      );
  } catch (error) {
    console.error(
      "Dashboard profile guard failed:",
      error instanceof Error
        ? error.message
        : error,
    );

    redirect(
      "/auth/auth-code-error",
    );
  }

  if (!profile) {
    redirect(
      "/auth/auth-code-error",
    );
  }

  if (
    profile.account_status !==
    "active"
  ) {
    redirect(
      "/auth/auth-code-error",
    );
  }

  if (
    !profile.onboarding_completed
  ) {
    redirect(
      "/onboarding?next=%2Fdashboard",
    );
  }

  return (
    <AppShell>
      {children}
    </AppShell>
  );
}