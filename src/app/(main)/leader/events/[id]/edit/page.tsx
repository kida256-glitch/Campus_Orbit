import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EventForm } from "@/components/events/event-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Edit event" };

export default async function EditEventPage({ params }: PageProps) {
  const profile = await requireRole("community_leader", "admin");
  const { id } = await params;

  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!event) notFound();

  if (event.created_by !== profile.id && profile.role !== "admin") {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Edit submission"
        title="Edit event"
        description={
          event.status === "rejected"
            ? "Address the moderator's note below — saving resubmits this event for review."
            : "Update the details students will see."
        }
      />

      <EventForm event={event} />
    </div>
  );
}
