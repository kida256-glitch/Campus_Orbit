"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/supabase/public";
import { z } from "zod";

import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { eventSchema, rejectionSchema } from "@/lib/validation";
import {
  type ActionState,
  fail,
  fieldErrorsFrom,
  humanizeDbError,
  ok,
} from "@/lib/actions/types";

function parseEventForm(formData: FormData) {
  return eventSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime") ?? "",
    location: formData.get("location"),
    category: formData.get("category"),
    organizer: formData.get("organizer"),
    bannerImage: formData.get("bannerImage") ?? "",
    externalRsvpUrl: formData.get("externalRsvpUrl") ?? "",
  });
}

/**
 * Community leader event submission.
 *
 * The payload deliberately carries no status: `guard_event_insert` forces
 * `pending` for any non-admin author, so a crafted request cannot self-publish.
 */
export async function submitEventAction(
  formData: FormData,
): Promise<ActionState<{ id: string }>> {
  const profile = await requireRole("community_leader", "admin");

  const parsed = parseEventForm(formData);
  if (!parsed.success) {
    return fail(
      "Check the highlighted fields.",
      fieldErrorsFrom(parsed.error.issues),
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description,
      date: parsed.data.date,
      start_time: parsed.data.startTime,
      end_time: parsed.data.endTime || null,
      location: parsed.data.location,
      category: parsed.data.category,
      organizer: parsed.data.organizer,
      banner_image: parsed.data.bannerImage || null,
      external_rsvp_url: parsed.data.externalRsvpUrl || null,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error) return fail(humanizeDbError(error));

  revalidatePath("/leader");
  revalidatePath("/leader/events");
  revalidatePath("/admin/events");

  return ok(
    "Submitted for review. An administrator will approve it before students see it.",
    { id: data.id },
  );
}

/** Edits an event the caller owns. Resubmits rejected events for review. */
export async function updateEventAction(
  eventId: string,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireRole("community_leader", "admin");

  const parsed = parseEventForm(formData);
  if (!parsed.success) {
    return fail(
      "Check the highlighted fields.",
      fieldErrorsFrom(parsed.error.issues),
    );
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("events")
    .select("status, created_by")
    .eq("id", eventId)
    .maybeSingle();

  if (!existing) return fail("That event no longer exists.");

  const isOwner = existing.created_by === profile.id;
  const isAdmin = profile.role === "admin";

  if (!isOwner && !isAdmin) {
    return fail("You can only edit events you submitted.");
  }

  // Editing a rejected event puts it back in the queue rather than leaving it
  // stranded in a rejected state.
  const resubmit = existing.status === "rejected" && !isAdmin;

  const { error } = await supabase
    .from("events")
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      date: parsed.data.date,
      start_time: parsed.data.startTime,
      end_time: parsed.data.endTime || null,
      location: parsed.data.location,
      category: parsed.data.category,
      organizer: parsed.data.organizer,
      banner_image: parsed.data.bannerImage || null,
      external_rsvp_url: parsed.data.externalRsvpUrl || null,
      ...(resubmit ? { status: "pending" as const, rejection_note: null } : {}),
    })
    .eq("id", eventId);

  if (error) return fail(humanizeDbError(error));

  // An edit can change a published event's title, date or venue.
  revalidateTag(CACHE_TAGS.events);
  revalidatePath("/leader");
  revalidatePath("/leader/events");
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/admin/events");

  return ok(
    resubmit ? "Updated and resubmitted for review." : "Event updated.",
  );
}

export async function deleteEventAction(eventId: string): Promise<ActionState> {
  await requireRole("community_leader", "admin");
  const supabase = await createClient();

  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) return fail(humanizeDbError(error));

  revalidateTag(CACHE_TAGS.events);
  revalidatePath("/leader/events");
  revalidatePath("/admin/events");

  return ok("Event deleted.");
}

/** Marks a past event completed so organisers can close out verification. */
export async function completeEventAction(
  eventId: string,
): Promise<ActionState> {
  await requireRole("community_leader", "admin");
  const supabase = await createClient();

  const { error } = await supabase
    .from("events")
    .update({ status: "completed" })
    .eq("id", eventId);

  if (error) return fail(humanizeDbError(error));

  revalidateTag(CACHE_TAGS.events);
  revalidatePath("/leader/events");
  revalidatePath(`/leader/events/${eventId}`);

  return ok("Event marked as completed.");
}

// ---------------------------------------------------------------------------
// Admin moderation
// ---------------------------------------------------------------------------

export async function approveEventAction(
  eventId: string,
): Promise<ActionState> {
  await requireRole("admin");
  const supabase = await createClient();

  // reviewed_by/reviewed_at and the organiser's notification are set by the
  // guard trigger, so approval is a single status write.
  const { error } = await supabase
    .from("events")
    .update({ status: "approved" })
    .eq("id", eventId);

  if (error) return fail(humanizeDbError(error));

  // The public catalog is cached and shared, so approval must drop that cache
  // rather than only the rendered pages.
  revalidateTag(CACHE_TAGS.events);
  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath("/discover");

  return ok("Event approved and published.");
}

export async function rejectEventAction(
  eventId: string,
  note: string,
): Promise<ActionState> {
  await requireRole("admin");

  const parsed = rejectionSchema.safeParse({ id: eventId, note });
  if (!parsed.success) {
    return fail(
      parsed.error.issues[0]?.message ??
        "Add a moderation note explaining the decision.",
    );
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("events")
    .update({ status: "rejected", rejection_note: parsed.data.note })
    .eq("id", eventId);

  if (error) return fail(humanizeDbError(error));

  revalidateTag(CACHE_TAGS.events);
  revalidatePath("/admin/events");
  revalidatePath("/events");

  return ok("Event rejected and the organiser has been notified.");
}

const bulkSchema = z.object({ ids: z.array(z.string().uuid()).min(1) });

/** Approves a batch from the moderation queue. */
export async function approveEventsAction(
  ids: string[],
): Promise<ActionState<{ count: number }>> {
  await requireRole("admin");

  const parsed = bulkSchema.safeParse({ ids });
  if (!parsed.success) return fail("Select at least one event.");

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .update({ status: "approved" })
    .in("id", parsed.data.ids)
    .eq("status", "pending")
    .select("id");

  if (error) return fail(humanizeDbError(error));

  revalidateTag(CACHE_TAGS.events);
  revalidatePath("/admin/events");
  revalidatePath("/events");

  const count = data?.length ?? 0;
  return ok(`Approved ${count} ${count === 1 ? "event" : "events"}.`, { count });
}