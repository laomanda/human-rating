"use server";

import { revalidatePath } from "next/cache";

import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/features/notification/queries";
import { createClient } from "@/lib/supabase/server";

export async function markAsReadAction(notificationId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Tidak terautentikasi" };
  }

  const success = await markNotificationAsRead(
    supabase,
    user.id,
    notificationId,
  );

  if (success) {
    revalidatePath("/dashboard/notifications");
    revalidatePath("/dashboard");
  }

  return { success };
}

export async function markAllAsReadAction() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Tidak terautentikasi" };
  }

  const success = await markAllNotificationsAsRead(supabase, user.id);

  if (success) {
    revalidatePath("/dashboard/notifications");
    revalidatePath("/dashboard");
  }

  return { success };
}
