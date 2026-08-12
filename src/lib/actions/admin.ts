"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/supabase/public";
import { z } from "zod";

import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ROLES } from "@/lib/constants";
import { opportunitySchema } from "@/lib/validation";
import {
  type ActionState,
  fail,
  fieldErrorsFrom,
  humanizeDbError,
  ok,
} from "@/lib/actions/types";

// ---------------------------------------------------------------------------
// Opportunity management
// ---------------------------------------------------------------------------

function parseOpportunityForm(formData: FormData) {
  return opportunitySchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    organization: formData.get("organization"),
    type: formData.get("type"),
    deadline: formData.get("deadline") ?? "",
    skillTags: formData.getAll("skillTags").map(String).filter(Boolean),
    applicationUrl: formData.get("applicationUrl") ?? "",
    image: formData.get("image") ?? "",
    status: formData.get("status") ?? "published",
  });
}

export async function saveOpportunityAction(
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireRole("admin");

  const parsed = parseOpportunityForm(formData);
  if (!parsed.success) {
    return fail(
      "Check the highlighted fields.",
      fieldErrorsFrom(parsed.error.issues),
    );
  }

  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");

  const row = {
    title: parsed.data.title,
    description: parsed.data.description,
    organization: parsed.data.organization,
    type: parsed.data.type,
    deadline: parsed.data.deadline || null,
    skill_tags: parsed.data.skillTags,
    application_url: parsed.data.applicationUrl || null,
    image: parsed.data.image || null,
    status: parsed.data.status,
  };

  const { error } = id
    ? await supabase.from("opportunities").update(row).eq("id", id)
    : await supabase
        .from("opportunities")
        .insert({ ...row, created_by: profile.id });

  if (error) return fail(humanizeDbError(error));

  revalidatePath("/admin/opportunities");
  revalidateTag(CACHE_TAGS.opportunities);
  revalidatePath("/opportunities");
  revalidatePath("/discover");

  return ok(id ? "Opportunity updated." : "Opportunity created.");
}

/** Publish/unpublish without deleting, so student progress rows survive. */
export async function setOpportunityStatusAction(
  id: string,
  status: "draft" | "published" | "archived",
): Promise<ActionState> {
  await requireRole("admin");
  const supabase = await createClient();

  const { error } = await supabase
    .from("opportunities")
    .update({ status })
    .eq("id", id);

  if (error) return fail(humanizeDbError(error));

  revalidatePath("/admin/opportunities");
  revalidateTag(CACHE_TAGS.opportunities);
  revalidatePath("/opportunities");

  const messages = {
    published: "Opportunity published.",
    draft: "Opportunity unpublished.",
    archived: "Opportunity archived.",
  } as const;

  return ok(messages[status]);
}

export async function deleteOpportunityAction(
  id: string,
): Promise<ActionState> {
  await requireRole("admin");
  const supabase = await createClient();

  const { error } = await supabase.from("opportunities").delete().eq("id", id);
  if (error) return fail(humanizeDbError(error));

  revalidatePath("/admin/opportunities");
  revalidateTag(CACHE_TAGS.opportunities);
  revalidatePath("/opportunities");

  return ok("Opportunity deleted.");
}

// ---------------------------------------------------------------------------
// User management
// ---------------------------------------------------------------------------

const roleChangeSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(ROLES),
});

/**
 * Changes a user's role.
 *
 * Uses the ordinary RLS-bound client, not the service role: the admin's own
 * session must satisfy `profiles_admin_update`, and `guard_profile_changes`
 * records the change and notifies the user. Admins cannot demote themselves,
 * which avoids locking the platform out of moderation.
 */
export async function changeUserRoleAction(
  userId: string,
  role: "student" | "community_leader" | "admin",
): Promise<ActionState> {
  const profile = await requireRole("admin");

  const parsed = roleChangeSchema.safeParse({ userId, role });
  if (!parsed.success) return fail("That is not a valid role.");

  if (userId === profile.id && role !== "admin") {
    return fail(
      "You cannot remove your own admin role. Ask another administrator.",
    );
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.userId);

  if (error) return fail(humanizeDbError(error));

  revalidatePath("/admin/users");
  revalidatePath("/admin/analytics");

  return ok("Role updated and the user has been notified.");
}

/**
 * Suspends or restores an account.
 *
 * Suspension keeps the row (so evidence and moderation history survive) but
 * `requireProfile` diverts the user to /suspended, and `is_active_role()`
 * returns false, which strips their write policies at the database level.
 */
export async function setUserSuspendedAction(
  userId: string,
  suspended: boolean,
): Promise<ActionState> {
  const profile = await requireRole("admin");

  if (userId === profile.id) {
    return fail("You cannot suspend your own account.");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ suspended })
    .eq("id", userId);

  if (error) return fail(humanizeDbError(error));

  revalidatePath("/admin/users");

  return ok(suspended ? "Account suspended." : "Account restored.");
}