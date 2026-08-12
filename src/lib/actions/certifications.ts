"use server";

import { revalidatePath } from "next/cache";

import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { certificationSchema } from "@/lib/validation";
import {
  type ActionState,
  fail,
  fieldErrorsFrom,
  humanizeDbError,
  ok,
} from "@/lib/actions/types";

/**
 * Adds or updates a certification the student is tracking.
 *
 * When `certificationId` points at the shared catalog, name/provider/skills are
 * taken from the catalog row rather than the form, so portfolio skill
 * derivation stays consistent across students tracking the same credential.
 */
export async function saveCertificationAction(
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireProfile();

  if (profile.role !== "student") {
    return fail("Only students can track certifications.");
  }

  const parsed = certificationSchema.safeParse({
    name: formData.get("name"),
    provider: formData.get("provider"),
    skills: formData.getAll("skills").map(String).filter(Boolean),
    startedDate: formData.get("startedDate") ?? "",
    completionDate: formData.get("completionDate") ?? "",
    credentialUrl: formData.get("credentialUrl") ?? "",
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return fail(
      "Check the highlighted fields.",
      fieldErrorsFrom(parsed.error.issues),
    );
  }

  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const catalogId = String(formData.get("certificationId") ?? "");

  let { name, provider, skills } = parsed.data;

  if (catalogId) {
    const { data: catalog } = await supabase
      .from("certifications")
      .select("name, provider, skills")
      .eq("id", catalogId)
      .maybeSingle();

    if (catalog) {
      name = catalog.name;
      provider = catalog.provider;
      skills = catalog.skills;
    }
  }

  const row = {
    student_id: profile.id,
    certification_id: catalogId || null,
    name,
    provider,
    skills,
    started_date: parsed.data.startedDate || null,
    completion_date: parsed.data.completionDate || null,
    credential_url: parsed.data.credentialUrl || null,
    status: parsed.data.status,
  };

  const { error } = id
    ? await supabase
        .from("student_certifications")
        .update(row)
        .eq("id", id)
        .eq("student_id", profile.id)
    : await supabase.from("student_certifications").insert(row);

  if (error) return fail(humanizeDbError(error));

  revalidatePath("/portfolio");
  revalidatePath("/dashboard");
  revalidatePath("/profile");

  return ok(
    parsed.data.status === "completed"
      ? "Certification saved and added to your portfolio."
      : "Certification saved. It will join your portfolio once completed.",
  );
}

export async function deleteCertificationAction(
  id: string,
): Promise<ActionState> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("student_certifications")
    .delete()
    .eq("id", id)
    .eq("student_id", profile.id);

  if (error) return fail(humanizeDbError(error));

  revalidatePath("/portfolio");
  revalidatePath("/dashboard");

  return ok("Certification removed.");
}
