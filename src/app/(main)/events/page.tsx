import { CalendarDays } from "lucide-react";

import { getProfile } from "@/lib/auth";
import { getMyRegistrationMap, listEvents } from "@/lib/queries/catalog";
import { EVENT_CATEGORIES } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { EventCard } from "@/components/shared/event-card";
import { FilterBar } from "@/components/shared/filter-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { RegistrationButtons } from "@/components/events/registration-buttons";

export const metadata = {
  title: "Events",
  description:
    "Campus technology events reviewed before publication so students can trust what they find.",
};

interface PageProps {
  searchParams: Promise<{ q?: string; category?: string; when?: string }>;
}

export default async function EventsPage({ searchParams }: PageProps) {
  // Resolve the params and the viewer together — neither depends on the other.
  const [params, profile] = await Promise.all([searchParams, getProfile()]);

  const when =
    params.when === "past" || params.when === "all" ? params.when : "upcoming";

  // The catalog query and the viewer's own registration state are independent,
  // so they overlap instead of running back to back.
  const [events, registrations] = await Promise.all([
    listEvents({ search: params.q, category: params.category, when }),
    profile?.role === "student"
      ? getMyRegistrationMap(profile.id)
      : Promise.resolve(new Map<string, never>()),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Campus events"
        title="Events"
        description="Every event here was submitted by a campus community and approved by a moderator before publication."
      />

      <FilterBar
        placeholder="Search events, organisers or venues…"
        selects={[
          {
            name: "category",
            label: "Category",
            options: [
              { value: "all", label: "All categories" },
              ...EVENT_CATEGORIES.map((category) => ({
                value: category,
                label: category,
              })),
            ],
          },
          {
            name: "when",
            label: "When",
            options: [
              { value: "all", label: "Upcoming" },
              { value: "past", label: "Past" },
            ],
          },
        ]}
      />

      {events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No events match those filters"
          description="Try a different category, or clear the filters to see everything currently published."
          hint="Community leaders submit events and an administrator reviews them before they appear."
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground" role="status">
            {events.length} {events.length === 1 ? "event" : "events"}
            {when === "past" ? " in the past" : when === "upcoming" ? " coming up" : ""}
          </p>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                registrationStatus={registrations.get(event.id) ?? null}
                footer={
                  profile?.role === "student" ? (
                    <RegistrationButtons
                      eventId={event.id}
                      status={registrations.get(event.id) ?? null}
                      compact
                    />
                  ) : null
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
