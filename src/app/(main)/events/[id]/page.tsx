import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Clock,
  ExternalLink,
  MapPin,
  Users,
} from "lucide-react";
import { format } from "date-fns";

import { getProfile } from "@/lib/auth";
import { getEventDetail } from "@/lib/queries/catalog";
import { createClient } from "@/lib/supabase/server";
import { formatTime } from "@/lib/utils";
import type { RegistrationStatus } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RegistrationButtons } from "@/components/events/registration-buttons";
import { EventStatusBadge } from "@/components/shared/status-badge";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const { event } = await getEventDetail(id);

  if (!event) return { title: "Event not found" };

  return {
    title: event.title,
    description: event.description.slice(0, 155),
  };
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [{ event, registrationCount }, profile] = await Promise.all([
    getEventDetail(id),
    getProfile(),
  ]);

  // RLS hides unapproved events from everyone but the organiser and admins, so
  // a missing row here is genuinely a 404 for this viewer.
  if (!event) notFound();

  let myStatus: RegistrationStatus | null = null;

  if (profile?.role === "student") {
    const supabase = await createClient();
    const { data } = await supabase
      .from("event_registrations")
      .select("status")
      .eq("event_id", id)
      .eq("student_id", profile.id)
      .maybeSingle();

    myStatus = (data?.status as RegistrationStatus | undefined) ?? null;
  }

  const eventDate = new Date(`${event.date}T00:00:00`);
  const isPast = eventDate < new Date(new Date().toDateString());

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/events">
          <ArrowLeft aria-hidden />
          All events
        </Link>
      </Button>

      <article className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-soft">
        {event.banner_image ? (
          <div className="relative aspect-[21/9] w-full">
            <Image
              src={event.banner_image}
              alt=""
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 900px"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="h-32 w-full bg-orbit-gradient sm:h-40" />
        )}

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{event.category}</Badge>
            {isPast ? <Badge variant="muted">Past event</Badge> : null}
            {/* Organisers and admins see the moderation state; students never
                see an unapproved event at all. */}
            {profile && (profile.id === event.created_by || profile.role === "admin") ? (
              <EventStatusBadge status={event.status} />
            ) : null}
          </div>

          <h1 className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-navy-900 sm:text-3xl">
            {event.title}
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Organised by {event.organizer}
          </p>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-secondary/60 p-4">
              <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-navy-500">
                <CalendarDays className="size-3.5" aria-hidden />
                Date
              </dt>
              <dd className="mt-1.5 text-sm font-semibold text-navy-900">
                {format(eventDate, "EEE d MMM yyyy")}
              </dd>
            </div>
            <div className="rounded-xl bg-secondary/60 p-4">
              <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-navy-500">
                <Clock className="size-3.5" aria-hidden />
                Time
              </dt>
              <dd className="mt-1.5 text-sm font-semibold text-navy-900">
                {formatTime(event.start_time)}
                {event.end_time ? ` – ${formatTime(event.end_time)}` : ""}
              </dd>
            </div>
            <div className="rounded-xl bg-secondary/60 p-4">
              <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-navy-500">
                <MapPin className="size-3.5" aria-hidden />
                Location
              </dt>
              <dd className="mt-1.5 text-sm font-semibold text-navy-900">
                {event.location}
              </dd>
            </div>
            <div className="rounded-xl bg-secondary/60 p-4">
              <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-navy-500">
                <Users className="size-3.5" aria-hidden />
                Registered
              </dt>
              <dd className="mt-1.5 text-sm font-semibold text-navy-900">
                {registrationCount}{" "}
                {registrationCount === 1 ? "student" : "students"}
              </dd>
            </div>
          </dl>

          <div className="mt-8 max-w-3xl space-y-4">
            <h2 className="text-base font-semibold text-navy-900">
              About this event
            </h2>
            {event.description.split(/\n{2,}/).map((paragraph, index) => (
              <p
                key={index}
                className="text-sm leading-relaxed text-navy-700"
              >
                {paragraph}
              </p>
            ))}
          </div>

          {/* Actions --------------------------------------------------------- */}
          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-6">
            {profile?.role === "student" ? (
              <RegistrationButtons eventId={event.id} status={myStatus} />
            ) : !profile ? (
              <Button asChild>
                <Link href={`/login?next=/events/${event.id}`}>
                  Sign in to register
                </Link>
              </Button>
            ) : null}

            {event.external_rsvp_url ? (
              <Button asChild variant="outline">
                <a
                  href={event.external_rsvp_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open external RSVP
                  <ExternalLink aria-hidden />
                </a>
              </Button>
            ) : null}
          </div>

          {profile?.role === "student" ? (
            <Card className="mt-6 border-orbit-100 bg-orbit-50/60">
              <CardContent className="flex gap-3 p-4">
                <BadgeCheck
                  className="mt-0.5 size-5 shrink-0 text-orbit-600"
                  aria-hidden
                />
                <div>
                  <p className="text-sm font-semibold text-navy-900">
                    Registering is not the same as proof
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-navy-600">
                    After the event the organiser verifies who actually took
                    part. Only verified attendance becomes evidence on your
                    portfolio — that is what makes it trustworthy to a recruiter.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </article>
    </div>
  );
}
