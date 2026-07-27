import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell/app-shell";
import { createClient } from "@/lib/supabase/server";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return <AppShell>{children}</AppShell>;
}