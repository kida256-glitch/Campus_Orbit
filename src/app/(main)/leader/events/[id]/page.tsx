import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Pencil } from "lucide-react";
import { format } from "date-fns";

import { requireRole } from "@/lib/auth";
import { getEventRegistrations } from "@/lib/queries/leader";
import { formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EventStatusBadge } from "@/components/shared/status-badge";
import { AttendanceSheet } from "@/components/events/attendance-sheet";
import { CompleteEventButton } from "@/components/events/complete-event-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Manage event" };

export default async function LeaderEventPage({ params }: PageProps) {
  const profile = await requireRole("community_leader", "admin");
  const { id } = await params;

  const { event, registrations } = await getEventRegistrations(id);

  // RLS already hides other leaders' events; this also covers a bad id.
  if (!event) notFound();

  if (event.created_by !== profile.id && profile.role !== "admin") {
    notFound();
  }

  const eventDate = new Date(`${event.date}T00:00:00`);
  const isPast = eventDate < new Date(new Date().toDateString());

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/leader/events">
          <ArrowLeft aria-hidden />
          My events
        </Link>
      </Button>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <EventStatusBadge status={event.status} />
                <Badge variant="outline">{event.category}</Badge>
              </div>

              <h1 className="mt-3 text-xl font-semibold tracking-[-0.02em] text-navy-900 sm:text-2xl">
                {event.title}
              </h1>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" aria-hidden />
                  {format(eventDate, "EEE d MMM yyyy")} ·{" "}
                  {formatTime(event.start_time)}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" aria-hidden />
                  {event.location}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              {event.status === "pending" || event.status === "rejected" ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/leader/events/${event.id}/edit`}>
                    <Pencil aria-hidden />
                    Edit
                  </Link>
                </Button>
              ) : null}

              {event.status === "approved" && isPast ? (
                <CompleteEventButton eventId={event.id} />
              ) : null}

              {event.status === "approved" || event.status === "completed" ? (
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/events/${event.id}`}>View public page</Link>
                </Button>
              ) : null}
            </div>
          </div>

          {event.status === "rejected" && event.rejection_note ? (
            <p className="mt-4 rounded-xl border border-destructive/20 bg-red-50 p-3 text-xs leading-relaxed text-red-700">
              <strong>Moderator note:</strong> {event.rejection_note}
            </p>
          ) : null}

          {event.status === "pending" ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
              This event is awaiting moderation. Students cannot see it yet.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <AttendanceSheet
        eventId={event.id}
        registrations={registrations}
        isPast={isPast}
      />
    </div>
  );
}
