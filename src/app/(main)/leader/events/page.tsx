import Link from "next/link";
import { ArrowRight, CalendarCheck, Plus, Users } from "lucide-react";
import { format } from "date-fns";

import { requireRole } from "@/lib/auth";
import { getLeaderDashboard } from "@/lib/queries/leader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { EventStatusBadge } from "@/components/shared/status-badge";

export const metadata = { title: "My events" };

export default async function LeaderEventsPage() {
  const profile = await requireRole("community_leader", "admin");
  const { events } = await getLeaderDashboard(profile.id);

  const groups = [
    { key: "pending", label: "Awaiting review" },
    { key: "rejected", label: "Needs changes" },
    { key: "approved", label: "Published" },
    { key: "completed", label: "Completed" },
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Event management"
        title="My events"
        description="Everything you have submitted, grouped by where it sits in moderation."
        actions={
          <Button asChild>
            <Link href="/leader/events/new">
              <Plus aria-hidden />
              Submit an event
            </Link>
          </Button>
        }
      />

      {events.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No events yet"
          description="Once you submit an event it appears here with its moderation status."
          action={{ label: "Submit an event", href: "/leader/events/new" }}
        />
      ) : (
        <div className="space-y-8">
          {groups.map((group) => {
            const items = events.filter((event) => event.status === group.key);
            if (items.length === 0) return null;

            return (
              <section key={group.key} aria-labelledby={`${group.key}-heading`}>
                <h2
                  id={`${group.key}-heading`}
                  className="text-sm font-semibold uppercase tracking-[0.12em] text-navy-500"
                >
                  {group.label}{" "}
                  <span className="font-normal text-muted-foreground">
                    ({items.length})
                  </span>
                </h2>

                <ul className="mt-3 space-y-3">
                  {items.map((event) => {
                    const registrations = event.registrations?.[0]?.count ?? 0;
                    const isPast =
                      new Date(`${event.date}T00:00:00`) <
                      new Date(new Date().toDateString());

                    return (
                      <li
                        key={event.id}
                        className="rounded-2xl border border-border/80 bg-card p-4 shadow-soft sm:p-5"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-navy-900">
                              {event.title}
                            </h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {format(
                                new Date(`${event.date}T00:00:00`),
                                "EEE d MMM yyyy",
                              )}{" "}
                              · {event.location}
                            </p>

                            <div className="mt-2.5 flex flex-wrap items-center gap-2">
                              <EventStatusBadge status={event.status} />
                              <Badge variant="outline">{event.category}</Badge>
                              <Badge variant="muted">
                                <Users aria-hidden />
                                {registrations}
                              </Badge>
                            </div>

                            {event.status === "rejected" &&
                            event.rejection_note ? (
                              <p className="mt-3 rounded-xl border border-destructive/20 bg-red-50 p-3 text-xs leading-relaxed text-red-700">
                                <strong>Moderator note:</strong>{" "}
                                {event.rejection_note}
                              </p>
                            ) : null}
                          </div>

                          <div className="flex shrink-0 flex-wrap gap-2">
                            {event.status === "pending" ||
                            event.status === "rejected" ? (
                              <Button asChild size="sm" variant="outline">
                                <Link href={`/leader/events/${event.id}/edit`}>
                                  Edit
                                </Link>
                              </Button>
                            ) : null}

                            <Button asChild size="sm" variant="outline">
                              <Link href={`/leader/events/${event.id}`}>
                                {isPast && registrations > 0
                                  ? "Verify attendance"
                                  : "Manage"}
                                <ArrowRight aria-hidden />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
