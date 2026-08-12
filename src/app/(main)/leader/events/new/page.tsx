import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { EventForm } from "@/components/events/event-form";

export const metadata = { title: "Submit an event" };

export default async function NewEventPage() {
  await requireRole("community_leader", "admin");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="New submission"
        title="Submit an event"
        description="Tell students what's happening. A moderator reviews every submission before it goes live."
      />

      <EventForm />
    </div>
  );
}
