"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  type ActionState,
  fail,
  humanizeDbError,
  ok,
} from "@/lib/actions/types";

const progressSchema = z.object({
  opportunityId: z.string().uuid(),
  status: z.enum(["saved", "in_progress", "completed"]),
  evidenceUrl: z
    .string()
    .trim()
    .url("Enter a full URL, including https://")
    .optional()
    .or(z.literal("")),
});

/**
 * Moves an opportunity along the student's own pipeline.
 *
 * `completed` is self-reported by design: unlike event attendance, there is no
 * campus organiser who can attest to an external internship or certification.
 * The portfolio labels these as completed rather than verified-by-a-third-party,
 * and `completed_at` is stamped by a database trigger so the timestamp is not
 * client-supplied.
 */
export async function setOpportunityProgressAction(
  opportunityId: string,
  status: "saved" | "in_progress" | "completed",
  evidenceUrl?: string,
): Promise<ActionState> {
  const profile = await requireProfile();

  if (profile.role !== "student") {
    return fail("Only students can track opportunities.");
  }

  const parsed = progressSchema.safeParse({ opportunityId, status, evidenceUrl });
  if (!parsed.success) {
    return fail(
      parsed.error.issues[0]?.message ?? "That is not a valid progress state.",
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.from("opportunity_progress").upsert(
    {
      opportunity_id: opportunityId,
      student_id: profile.id,
      status: parsed.data.status,
      evidence_url: parsed.data.evidenceUrl || null,
    },
    { onConflict: "opportunity_id,student_id" },
  );

  if (error) return fail(humanizeDbError(error));

  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${opportunityId}`);
  revalidatePath("/dashboard");
  revalidatePath("/portfolio");
  revalidatePath("/discover");

  const messages = {
    saved: "Saved for later.",
    in_progress: "Marked as in progress.",
    completed: "Completed. It now appears on your portfolio as evidence.",
  } as const;

  return ok(messages[parsed.data.status]);
}

/** Removes an opportunity from the student's pipeline entirely. */
export async function removeOpportunityProgressAction(
  opportunityId: string,
): Promise<ActionState> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("opportunity_progress")
    .delete()
    .eq("opportunity_id", opportunityId)
    .eq("student_id", profile.id);

  if (error) return fail(humanizeDbError(error));

  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${opportunityId}`);
  revalidatePath("/portfolio");

  return ok("Removed from your list.");
}
