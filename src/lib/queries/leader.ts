import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { EventStatus, RegistrationStatus } from "@/lib/constants";
import type { Tables } from "@/lib/types/database";

export interface LeaderEventRow extends Tables<"events"> {
  registrations: { count: number }[];
}

/**
 * A community leader's own events plus headline metrics.
 *
 * RLS restricts `events` to rows the caller created, so no `created_by` filter
 * is strictly required — it is included anyway to keep the intent obvious and
 * to stay correct if an admin ever reuses this query.
 */
export async function getLeaderDashboard(leaderId: string) {
  const supabase = await createClient();

  const [eventsResult, registrationsResult] = await Promise.all([
    supabase
      .from("events")
      .select("*, registrations:event_registrations(count)")
      .eq("created_by", leaderId)
      .order("date", { ascending: false }),
    // Every registration across this leader's events, for the status breakdown.
    supabase
      .from("event_registrations")
      .select("id, status, event_id, events!inner(created_by)")
      .eq("events.created_by", leaderId),
  ]);

  const events = (eventsResult.data ?? []) as LeaderEventRow[];
  const registrations = registrationsResult.data ?? [];

  const byStatus = (status: EventStatus) =>
    events.filter((event) => event.status === status).length;

  const countRegistrations = (status: RegistrationStatus) =>
    registrations.filter((row) => row.status === status).length;

  return {
    events,
    metrics: {
      published: byStatus("approved") + byStatus("completed"),
      pending: byStatus("pending"),
      rejected: byStatus("rejected"),
      totalRegistrations: registrations.length,
      verifiedParticipants: countRegistrations("verified"),
      awaitingVerification:
        countRegistrations("attended") + countRegistrations("registered"),
    },
  };
}

export interface RegistrationRow {
  id: string;
  status: RegistrationStatus;
  created_at: string;
  verified_at: string | null;
  student: {
    id: string;
    full_name: string;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

/**
 * The attendance sheet for one event.
 *
 * Reads through the `event_participants` view rather than joining `profiles`.
 * `can_view_profile` is strictly self-or-admin, so a direct join would return
 * null students and the sheet would show "Unknown student" for everyone. The
 * view is SECURITY DEFINER, carries its own `created_by = auth.uid()` predicate,
 * and projects only display fields — so an organiser gets the names they need to
 * check people in, and never the email addresses they do not.
 */
export async function getEventRegistrations(eventId: string) {
  const supabase = await createClient();

  const [eventResult, participantsResult] = await Promise.all([
    supabase.from("events").select("*").eq("id", eventId).maybeSingle(),
    supabase
      .from("event_participants")
      .select(
        "id, status, created_at, verified_at, student_id, student_name, student_username, student_avatar",
      )
      .eq("event_id", eventId)
      .order("created_at", { ascending: true }),
  ]);

  const registrations: RegistrationRow[] = (participantsResult.data ?? []).map(
    (row) => ({
      id: row.id as string,
      status: row.status as RegistrationStatus,
      created_at: row.created_at as string,
      verified_at: row.verified_at as string | null,
      student: row.student_id
        ? {
            id: row.student_id as string,
            full_name: (row.student_name as string | null) ?? "Unknown student",
            username: row.student_username as string | null,
            avatar_url: row.student_avatar as string | null,
          }
        : null,
    }),
  );

  return {
    event: eventResult.data as Tables<"events"> | null,
    registrations,
  };
}
