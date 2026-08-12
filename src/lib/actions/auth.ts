"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { dashboardPathFor, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { onboardingSchema, signInSchema, signUpSchema } from "@/lib/validation";
import {
  type ActionState,
  fail,
  fieldErrorsFrom,
  humanizeDbError,
  ok,
} from "@/lib/actions/types";

export async function signUpAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    university: formData.get("university") ?? "",
  });

  if (!parsed.success) {
    return fail(
      "Check the highlighted fields.",
      fieldErrorsFrom(parsed.error.issues),
    );
  }

  const { fullName, email, password, role, university } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Consumed by the handle_new_user trigger, which sanitises `role` and
      // refuses to grant admin regardless of what is sent here.
      data: { full_name: fullName, role, university: university || undefined },
    },
  });

  if (error) {
    if (/already registered|already been registered/i.test(error.message)) {
      return fail("That email already has an account.", {
        email: "This email is already registered. Try logging in instead.",
      });
    }
    return fail(humanizeDbError(error));
  }

  redirect("/onboarding");
}

export async function signInAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return fail(
      "Check the highlighted fields.",
      fieldErrorsFrom(parsed.error.issues),
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Deliberately vague: do not reveal whether the address exists.
    return fail("Those details do not match an account.", {
      password: "Incorrect email or password.",
    });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, suspended, onboarded")
    .eq("id", data.user.id)
    .single();

  if (profile?.suspended) {
    redirect("/suspended");
  }

  const next = String(formData.get("next") ?? "");
  if (next.startsWith("/") && !next.startsWith("//")) {
    redirect(next);
  }

  if (profile && !profile.onboarded && profile.role === "student") {
    redirect("/onboarding");
  }

  redirect(dashboardPathFor(profile?.role ?? "student"));
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function completeOnboardingAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireProfile();

  const parsed = onboardingSchema.safeParse({
    interests: formData.getAll("interests").map(String),
    skills: formData.getAll("skills").map(String),
  });

  if (!parsed.success) {
    return fail(
      parsed.error.issues[0]?.message ?? "Check your selections.",
      fieldErrorsFrom(parsed.error.issues),
    );
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      interests: parsed.data.interests,
      skills: parsed.data.skills,
      onboarded: true,
    })
    .eq("id", profile.id);

  if (error) return fail(humanizeDbError(error));

  revalidatePath("/dashboard");
  redirect(dashboardPathFor(profile.role));
}

/**
 * Lets a student skip interest selection. Used as a bare `<form action>`, so it
 * returns void. The `onboarded` flag only controls whether this prompt appears
 * again, so a failed update is not worth blocking the student over.
 */
export async function skipOnboardingAction(): Promise<void> {
  const profile = await requireProfile();
  const supabase = await createClient();

  await supabase
    .from("profiles")
    .update({ onboarded: true })
    .eq("id", profile.id);

  redirect(dashboardPathFor(profile.role));
}

export { ok };
