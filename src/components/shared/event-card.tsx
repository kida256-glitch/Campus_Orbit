import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Clock, MapPin, Users } from "lucide-react";
import { format } from "date-fns";

import { cn, formatTime } from "@/lib/utils";
import type { EventCategory, RegistrationStatus } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { RegistrationStatusBadge } from "@/components/shared/status-badge";

export interface EventCardData {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string | null;
  location: string;
  category: EventCategory;
  banner_image: string | null;
  organizer: string;
}

interface EventCardProps {
  event: EventCardData;
  /** The viewer's own registration state, when signed in. */
  registrationStatus?: RegistrationStatus | null;
  registrationCount?: number;
  className?: string;
  footer?: React.ReactNode;
}

/** Fallback gradient per category, used when an event has no banner. */
const CATEGORY_GRADIENTS: Record<EventCategory, string> = {
  AI: "from-violet-500 to-orbit-600",
  Web3: "from-orbit-600 to-emeraldx-500",
  Cloud: "from-sky-500 to-orbit-700",
  "Software Development": "from-orbit-500 to-navy-700",
  Data: "from-teal-500 to-orbit-600",
  Cybersecurity: "from-navy-700 to-red-500",
  Design: "from-pink-500 to-orbit-500",
  Entrepreneurship: "from-amber-500 to-orbit-600",
  Career: "from-emeraldx-500 to-orbit-600",
  Other: "from-navy-400 to-navy-700",
};

export function EventCard({
  event,
  registrationStatus,
  registrationCount,
  className,
  footer,
}: EventCardProps) {
  const eventDate = new Date(`${event.date}T00:00:00`);
  const isPast = eventDate < new Date(new Date().toDateString());

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:border-orbit-200 hover:shadow-card",
        className,
      )}
    >
      <Link
        href={`/events/${event.id}`}
        className="relative block aspect-[16/9] overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        aria-label={event.title}
      >
        {event.banner_image ? (
          <Image
            src={event.banner_image}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            className={cn(
              "size-full bg-gradient-to-br",
              CATEGORY_GRADIENTS[event.category],
            )}
          />
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge className="border-transparent bg-white/95 text-navy-800 backdrop-blur">
            {event.category}
          </Badge>
          {isPast ? (
            <Badge className="border-transparent bg-navy-900/85 text-white backdrop-blur">
              Past
            </Badge>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="text-[15px] font-semibold leading-snug tracking-[-0.01em] text-navy-900">
          <Link
            href={`/events/${event.id}`}
            className="transition-colors hover:text-orbit-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {event.title}
          </Link>
        </h3>

        <p className="mt-1 truncate text-xs text-muted-foreground">
          {event.organizer}
        </p>

        <dl className="mt-3 space-y-1.5 text-xs text-navy-600">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-3.5 shrink-0 text-navy-400" aria-hidden />
            <dt className="sr-only">Date</dt>
            <dd>{format(eventDate, "EEE d MMM yyyy")}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="size-3.5 shrink-0 text-navy-400" aria-hidden />
            <dt className="sr-only">Time</dt>
            <dd>
              {formatTime(event.start_time)}
              {event.end_time ? ` – ${formatTime(event.end_time)}` : ""}
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="size-3.5 shrink-0 text-navy-400" aria-hidden />
            <dt className="sr-only">Location</dt>
            <dd className="truncate">{event.location}</dd>
          </div>
          {typeof registrationCount === "number" ? (
            <div className="flex items-center gap-2">
              <Users className="size-3.5 shrink-0 text-navy-400" aria-hidden />
              <dt className="sr-only">Registrations</dt>
              <dd>
                {registrationCount}{" "}
                {registrationCount === 1 ? "student" : "students"} registered
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-4 flex items-center gap-2 pt-1">
          {registrationStatus ? (
            <RegistrationStatusBadge status={registrationStatus} />
          ) : null}
          <div className="ml-auto">{footer}</div>
        </div>
      </div>
    </article>
  );
}
