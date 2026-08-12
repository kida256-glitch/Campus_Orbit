"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validation";
import {
  type ActionState,
  fail,
  fieldErrorsFrom,
  humanizeDbError,
  ok,
} from "@/lib/actions/types";

/**
 * Updates the signed-in user's own profile.
 *
 * `role` and `suspended` are absent from the payload on purpose. Even if they
 * were added, `guard_profile_changes` rejects the write for non-admins.
 */
export async function updateProfileAction(
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireProfile();

  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    bio: formData.get("bio") ?? "",
    university: formData.get("university") ?? "",
    interests: formData.getAll("interests").map(String).filter(Boolean),
    skills: formData.getAll("skills").map(String).filter(Boolean),
    github: formData.get("github") ?? "",
    linkedin: formData.get("linkedin") ?? "",
    website: formData.get("website") ?? "",
  });

  if (!parsed.success) {
    return fail(
      "Check the highlighted fields.",
      fieldErrorsFrom(parsed.error.issues),
    );
  }

  const links: Record<string, string> = {};
  if (parsed.data.github) links.github = parsed.data.github;
  if (parsed.data.linkedin) links.linkedin = parsed.data.linkedin;
  if (parsed.data.website) links.website = parsed.data.website;

  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      bio: parsed.data.bio || null,
      university: parsed.data.university || undefined,
      interests: parsed.data.interests,
      skills: parsed.data.skills,
      links,
      onboarded: true,
    })
    .eq("id", profile.id);

  if (error) return fail(humanizeDbError(error));

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/portfolio");

  return ok("Profile updated.");
}

const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Use at least 3 characters")
  .max(40, "Keep it under 40 characters")
  .regex(
    /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/,
    "Use lowercase letters, numbers and hyphens only",
  );

/** Changes the handle that forms the public portfolio URL. */
export async function updateUsernameAction(
  username: string,
): Promise<ActionState> {
  const profile = await requireProfile();

  const parsed = usernameSchema.safeParse(username);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "That handle is not valid.");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ username: parsed.data })
    .eq("id", profile.id);

  if (error) {
    if (error.code === "23505" || /duplicate key/i.test(error.message)) {
      return fail("That handle is already taken. Try another.");
    }
    return fail(humanizeDbError(error));
  }

  revalidatePath("/profile");
  revalidatePath("/portfolio");

  return ok(`Your portfolio link is now /portfolio/${parsed.data}`);
}

const visibilitySchema = z.object({
  isPublic: z.boolean(),
  showEvents: z.boolean(),
  showOpportunities: z.boolean(),
  showCertifications: z.boolean(),
  showContact: z.boolean(),
});

/**
 * Portfolio privacy. Defaults are set at signup (private, contact hidden); this
 * is the student's own opt-in. `public_portfolio()` reads these flags, so a
 * disabled section is filtered out in the database rather than merely hidden
 * in the UI.
 */
export async function updatePortfolioVisibilityAction(input: {
  isPublic: boolean;
  showEvents: boolean;
  showOpportunities: boolean;
  showCertifications: boolean;
  showContact: boolean;
}): Promise<ActionState> {
  const profile = await requireProfile();

  const parsed = visibilitySchema.safeParse(input);
  if (!parsed.success) return fail("Those privacy settings are not valid.");

  const supabase = await createClient();

  const { error } = await supabase.from("portfolio_visibility").upsert(
    {
      student_id: profile.id,
      is_public: parsed.data.isPublic,
      show_events: parsed.data.showEvents,
      show_opportunities: parsed.data.showOpportunities,
      show_certifications: parsed.data.showCertifications,
      show_contact: parsed.data.showContact,
    },
    { onConflict: "student_id" },
  );

  if (error) return fail(humanizeDbError(error));

  revalidatePath("/portfolio");
  if (profile.username) revalidatePath(`/portfolio/${profile.username}`);

  return ok(
    parsed.data.isPublic
      ? "Your portfolio is live. Anyone with the link can view it."
      : "Your portfolio is private again.",
  );
}
