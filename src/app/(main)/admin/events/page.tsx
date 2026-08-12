import Link from "next/link";
import { ShieldCheck, Users } from "lucide-react";
import { format } from "date-fns";

import { requireRole } from "@/lib/auth";
import { listEventsForModeration } from "@/lib/queries/admin";
import { cn, formatTime } from "@/lib/utils";
import type { EventStatus } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { EventStatusBadge } from "@/components/shared/status-badge";
import { ModerationActions } from "@/components/admin/moderation-actions";

export const metadata = { title: "Event approvals" };

const FILTERS = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "completed", label: "Completed" },
  { id: "all", label: "All" },
] as const;

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminEventsPage({ searchParams }: PageProps) {
  await requireRole("admin");
  const params = await searchParams;

  const status = (FILTERS.find((f) => f.id === params.status)?.id ??
    "pending") as EventStatus | "all";

  const events = await listEventsForModeration(status);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Moderation"
        title="Event approvals"
        description="Nothing reaches students until it passes through here. Rejections always carry a note back to the organiser."
      />

      <nav aria-label="Filter by status">
        <ul className="scrollbar-slim flex gap-1.5 overflow-x-auto pb-1">
          {FILTERS.map((filter) => {
            const active = filter.id === status;
            return (
              <li key={filter.id}>
                <Link
                  href={`/admin/events?status=${filter.id}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "border-transparent bg-navy-900 text-white"
                      : "border-border bg-card text-navy-700 hover:border-orbit-200 hover:text-orbit-700",
                  )}
                >
                  {filter.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {events.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title={
            status === "pending"
              ? "The queue is clear"
              : `No ${status} events`
          }
          description={
            status === "pending"
              ? "Every submitted event has been reviewed. New submissions will appear here."
              : "Try a different status filter."
          }
        />
      ) : (
        <ul className="space-y-4">
          {events.map((event) => {
            const registrations = event.registrations?.[0]?.count ?? 0;

            return (
              <li
                key={event.id}
                className="rounded-2xl border border-border/80 bg-card p-5 shadow-soft"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <EventStatusBadge status={event.status} />
                      <Badge variant="outline">{event.category}</Badge>
                      {registrations > 0 ? (
                        <Badge variant="muted">
                          <Users aria-hidden />
                          {registrations}
                        </Badge>
                      ) : null}
                    </div>

                    <h2 className="mt-3 text-base font-semibold text-navy-900">
                      {event.title}
                    </h2>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {format(
                        new Date(`${event.date}T00:00:00`),
                        "EEE d MMM yyyy",
                      )}{" "}
                      · {formatTime(event.start_time)} · {event.location}
                    </p>

                    <p className="mt-2 text-xs text-muted-foreground">
                      Submitted by{" "}
                      <span className="font-medium text-navy-700">
                        {event.author?.full_name ?? "Unknown"}
                      </span>{" "}
                      for {event.organizer}
                    </p>

                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-navy-700">
                      {event.description}
                    </p>

                    {event.rejection_note ? (
                      <p className="mt-3 rounded-xl border border-destructive/20 bg-red-50 p-3 text-xs leading-relaxed text-red-700">
                        <strong>Your note:</strong> {event.rejection_note}
                      </p>
                    ) : null}

                    {event.external_rsvp_url ? (
                      <p className="mt-3 truncate text-xs text-muted-foreground">
                        External RSVP: {event.external_rsvp_url}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 lg:items-end">
                    {event.status === "pending" ? (
                      <ModerationActions
                        id={event.id}
                        kind="event"
                        title={event.title}
                      />
                    ) : event.status === "rejected" ? (
                      <ModerationActions
                        id={event.id}
                        kind="event"
                        title={event.title}
                      />
                    ) : null}

                    {event.status === "approved" ||
                    event.status === "completed" ? (
                      <Link
                        href={`/events/${event.id}`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        View public page
                      </Link>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
