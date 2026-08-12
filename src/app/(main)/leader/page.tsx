import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  Clock,
  Plus,
  Users,
} from "lucide-react";
import { format } from "date-fns";

import { requireRole } from "@/lib/auth";
import { getLeaderDashboard } from "@/lib/queries/leader";
import { greeting } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { EventStatusBadge } from "@/components/shared/status-badge";

export const metadata = { title: "Leader dashboard" };

export default async function LeaderDashboardPage() {
  const profile = await requireRole("community_leader");
  const { events, metrics } = await getLeaderDashboard(profile.id);

  const firstName = profile.full_name.split(" ")[0];
  const needsVerification = events.filter(
    (event) =>
      (event.status === "completed" || event.status === "approved") &&
      new Date(`${event.date}T00:00:00`) < new Date(new Date().toDateString()),
  );

  return (
    <div className="space-y-8">
      <header className="overflow-hidden rounded-3xl border border-border/80 bg-card bg-orbit-mesh p-6 shadow-soft sm:p-8">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-navy-900 sm:text-[28px]">
          {greeting()}, {firstName} <span aria-hidden>👋</span>
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Run your community&apos;s events and turn real participation into
          evidence students can use.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild variant="brand">
            <Link href="/leader/events/new">
              <Plus aria-hidden />
              Submit an event
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/leader/events">
              <CalendarCheck aria-hidden />
              My events
            </Link>
          </Button>
        </div>
      </header>

      <section aria-labelledby="metrics-heading">
        <h2 id="metrics-heading" className="sr-only">
          Your metrics
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Events published"
            value={metrics.published}
            icon={CalendarCheck}
            href="/leader/events"
            tone="blue"
          />
          <StatCard
            label="Awaiting approval"
            value={metrics.pending}
            icon={Clock}
            hint={metrics.rejected > 0 ? `${metrics.rejected} need changes` : undefined}
            href="/leader/events"
            tone="amber"
          />
          <StatCard
            label="Total registrations"
            value={metrics.totalRegistrations}
            icon={Users}
            tone="navy"
          />
          <StatCard
            label="Verified participants"
            value={metrics.verifiedParticipants}
            icon={BadgeCheck}
            hint={`${metrics.awaitingVerification} still to verify`}
            tone="emerald"
          />
        </div>
      </section>

      {/* Verification prompt --------------------------------------------- */}
      {needsVerification.length > 0 && metrics.awaitingVerification > 0 ? (
        <Card className="border-emeraldx-200 bg-emeraldx-50/60">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-navy-900">
                {metrics.awaitingVerification}{" "}
                {metrics.awaitingVerification === 1
                  ? "participant is"
                  : "participants are"}{" "}
                waiting on you
              </p>
              <p className="mt-1 text-xs leading-relaxed text-navy-600">
                Verifying attendance is what turns your event into portfolio
                evidence for the students who showed up. Nothing counts until
                you confirm it.
              </p>
            </div>
            <Button asChild variant="emerald" size="sm">
              <Link href={`/leader/events/${needsVerification[0].id}`}>
                Verify attendance
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Recent events ---------------------------------------------------- */}
      <section aria-labelledby="recent-heading" className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <h2
            id="recent-heading"
            className="text-lg font-semibold tracking-[-0.01em] text-navy-900"
          >
            Your events
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/leader/events">
              See all
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>

        {events.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="You haven't submitted an event yet"
            description="Submit your first event and an administrator will review it before it goes live to students."
            action={{ label: "Submit an event", href: "/leader/events/new" }}
          />
        ) : (
          <ul className="space-y-3">
            {events.slice(0, 5).map((event) => {
              const registrations = event.registrations?.[0]?.count ?? 0;

              return (
                <li key={event.id}>
                  <Link
                    href={`/leader/events/${event.id}`}
                    className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-orbit-200 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-navy-900">
                        {event.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {format(
                          new Date(`${event.date}T00:00:00`),
                          "EEE d MMM yyyy",
                        )}{" "}
                        · {event.category} · {registrations}{" "}
                        {registrations === 1 ? "registration" : "registrations"}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <EventStatusBadge status={event.status} />
                      <ArrowRight
                        className="size-4 text-navy-400"
                        aria-hidden
                      />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
