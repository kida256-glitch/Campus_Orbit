"use server";

import { revalidatePath } from "next/cache";

import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  type ActionState,
  fail,
  humanizeDbError,
  ok,
} from "@/lib/actions/types";

/**
 * Notifications are created only by database triggers. Clients can read their
 * own and flip the read flag — nothing more (there is no INSERT policy).
 */
export async function markAllNotificationsReadAction(): Promise<ActionState> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", profile.id)
    .eq("read", false);

  if (error) return fail(humanizeDbError(error));

  revalidatePath("/", "layout");
  return ok("All notifications marked as read");
}

export async function markNotificationReadAction(
  id: string,
): Promise<ActionState> {
  await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id);

  if (error) return fail(humanizeDbError(error));

  revalidatePath("/", "layout");
  return ok();
}
