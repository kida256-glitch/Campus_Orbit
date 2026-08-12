import {
  BadgeCheck,
  CircleCheck,
  CircleDashed,
  CircleDot,
  Clock,
  Star,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type {
  EventStatus,
  ModerationStatus,
  ProgressStatus,
  RegistrationStatus,
} from "@/lib/constants";

/** Event moderation state. */
export function EventStatusBadge({ status }: { status: EventStatus }) {
  switch (status) {
    case "approved":
      return (
        <Badge variant="verified">
          <CircleCheck aria-hidden />
          Approved
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="pending">
          <Clock aria-hidden />
          Awaiting review
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="rejected">
          <XCircle aria-hidden />
          Needs changes
        </Badge>
      );
    case "completed":
      return (
        <Badge variant="secondary">
          <CircleCheck aria-hidden />
          Completed
        </Badge>
      );
  }
}

/**
 * Attendance ladder. The distinction between "attended" and "verified" is the
 * product's trust boundary, so the labels spell it out.
 */
export function RegistrationStatusBadge({
  status,
}: {
  status: RegistrationStatus;
}) {
  switch (status) {
    case "interested":
      return (
        <Badge variant="muted">
          <Star aria-hidden />
          Interested
        </Badge>
      );
    case "registered":
      return (
        <Badge>
          <CircleDot aria-hidden />
          Registered
        </Badge>
      );
    case "attended":
      return (
        <Badge variant="pending">
          <Clock aria-hidden />
          Awaiting verification
        </Badge>
      );
    case "verified":
      return (
        <Badge variant="verified">
          <BadgeCheck aria-hidden />
          Verified
        </Badge>
      );
  }
}

export function ProgressStatusBadge({ status }: { status: ProgressStatus }) {
  switch (status) {
    case "saved":
      return (
        <Badge variant="muted">
          <Star aria-hidden />
          Saved
        </Badge>
      );
    case "in_progress":
      return (
        <Badge>
          <CircleDashed aria-hidden />
          In progress
        </Badge>
      );
    case "completed":
      return (
        <Badge variant="verified">
          <CircleCheck aria-hidden />
          Completed
        </Badge>
      );
  }
}

export function ModerationStatusBadge({
  status,
}: {
  status: ModerationStatus;
}) {
  switch (status) {
    case "approved":
      return (
        <Badge variant="verified">
          <CircleCheck aria-hidden />
          Approved
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="pending">
          <Clock aria-hidden />
          Pending
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="rejected">
          <XCircle aria-hidden />
          Rejected
        </Badge>
      );
  }
}

/** Small "✓ Verified" marker used on portfolio evidence rows. */
export function VerifiedMark({ label = "Verified" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emeraldx-700">
      <BadgeCheck className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}
