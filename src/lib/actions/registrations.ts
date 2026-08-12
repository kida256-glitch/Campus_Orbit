"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireProfile, requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { REGISTRATION_STATUSES } from "@/lib/constants";
import {
  type ActionState,
  fail,
  humanizeDbError,
  ok,
} from "@/lib/actions/types";

/** Students may only place themselves on the first two rungs of the ladder. */
const studentIntentSchema = z.object({
  eventId: z.string().uuid(),
  status: z.enum(["interested", "registered"]),
});

/**
 * Records a student's own interest or registration.
 *
 * Upserts on (event_id, student_id) so toggling between "Interested" and
 * "Registered" never creates duplicates. Deliberately cannot reach `attended`
 * or `verified` — the guard trigger rejects those, and the schema above stops
 * the attempt earlier for a clearer message.
 */
export async function setRegistrationAction(
  eventId: string,
  status: "interested" | "registered",
): Promise<ActionState> {
  const profile = await requireProfile();

  if (profile.role !== "student") {
    return fail("Only students can register for events.");
  }

  const parsed = studentIntentSchema.safeParse({ eventId, status });
  if (!parsed.success) return fail("That is not a valid registration state.");

  const supabase = await createClient();

  // Never downgrade evidence: once verified, the student's own controls are
  // read-only. The database would refuse anyway; this returns a kinder message.
  const { data: existing } = await supabase
    .from("event_registrations")
    .select("status")
    .eq("event_id", eventId)
    .eq("student_id", profile.id)
    .maybeSingle();

  if (existing && (existing.status === "verified" || existing.status === "attended")) {
    return fail(
      existing.status === "verified"
        ? "Your attendance is already verified for this event."
        : "The organiser has recorded your attendance and is reviewing it.",
    );
  }

  const { error } = await supabase.from("event_registrations").upsert(
    {
      event_id: eventId,
      student_id: profile.id,
      status: parsed.data.status,
    },
    { onConflict: "event_id,student_id" },
  );

  if (error) return fail(humanizeDbError(error));

  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/dashboard");
  revalidatePath("/discover");

  return ok(
    parsed.data.status === "registered"
      ? "You're registered. Attendance still needs organiser verification to count as proof."
      : "Saved to your interests.",
  );
}

/** Withdraws an interest or registration that has not been attested yet. */
export async function withdrawRegistrationAction(
  eventId: string,
): Promise<ActionState> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("event_registrations")
    .delete()
    .eq("event_id", eventId)
    .eq("student_id", profile.id);

  if (error) return fail(humanizeDbError(error));

  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/dashboard");

  return ok("Removed from your events.");
}

const verifySchema = z.object({
  registrationId: z.string().uuid(),
  eventId: z.string().uuid(),
  status: z.enum(REGISTRATION_STATUSES),
});

/**
 * Organiser/admin attestation. This is the step that converts participation
 * into portfolio evidence, so it is restricted to the event's own creator or an
 * admin — enforced by RLS and the guard trigger, not by this function.
 */
export async function verifyAttendanceAction(
  registrationId: string,
  eventId: string,
  status: "registered" | "attended" | "verified",
): Promise<ActionState> {
  await requireRole("community_leader", "admin");

  const parsed = verifySchema.safeParse({ registrationId, eventId, status });
  if (!parsed.success) return fail("That is not a valid attendance state.");

  const supabase = await createClient();

  const { error } = await supabase
    .from("event_registrations")
    .update({ status: parsed.data.status })
    .eq("id", registrationId);

  if (error) return fail(humanizeDbError(error));

  revalidatePath(`/leader/events/${eventId}`);
  revalidatePath("/leader");
  revalidatePath("/admin/events");

  return ok(
    status === "verified"
      ? "Attendance verified. It now counts as portfolio evidence."
      : "Attendance updated.",
  );
}

/**
 * Bulk verification for a completed event. Organisers running a 200-person
 * workshop should not have to click 200 times.
 */
export async function verifyAllAttendedAction(
  eventId: string,
): Promise<ActionState<{ count: number }>> {
  await requireRole("community_leader", "admin");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("event_registrations")
    .update({ status: "verified" })
    .eq("event_id", eventId)
    .in("status", ["registered", "attended"])
    .select("id");

  if (error) return fail(humanizeDbError(error));

  const count = data?.length ?? 0;

  revalidatePath(`/leader/events/${eventId}`);
  revalidatePath("/leader");

  return ok(
    count === 0
      ? "No one was awaiting verification."
      : `Verified ${count} ${count === 1 ? "participant" : "participants"}.`,
    { count },
  );
}
