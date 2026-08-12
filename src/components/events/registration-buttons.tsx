"use client";

import { useTransition } from "react";
import { BadgeCheck, Check, Star, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { RegistrationStatus } from "@/lib/constants";
import {
  setRegistrationAction,
  withdrawRegistrationAction,
} from "@/lib/actions/registrations";

interface RegistrationButtonsProps {
  eventId: string;
  status: RegistrationStatus | null;
  /** Hides the withdraw control in dense card layouts. */
  compact?: boolean;
}

/**
 * The student's own two rungs of the attendance ladder.
 *
 * Once an organiser has attested (`attended`/`verified`) the controls become a
 * read-only statement, because that state is evidence and is not the student's
 * to change.
 */
export function RegistrationButtons({
  eventId,
  status,
  compact = false,
}: RegistrationButtonsProps) {
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<{ ok: boolean; message?: string }>) {
    startTransition(async () => {
      const result = await fn();
      if (result.ok) {
        toast.success(result.message ?? "Saved");
      } else {
        toast.error(result.message ?? "Something went wrong");
      }
    });
  }

  if (status === "verified") {
    return (
      <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-emeraldx-700">
        <BadgeCheck className="size-4" aria-hidden />
        Verified attendance
      </p>
    );
  }

  if (status === "attended") {
    return (
      <p className="text-xs font-medium text-amber-700">
        Awaiting organiser verification
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant={status === "registered" ? "emerald" : "default"}
        loading={pending}
        onClick={() =>
          run(() =>
            setRegistrationAction(
              eventId,
              status === "registered" ? "interested" : "registered",
            ),
          )
        }
        aria-pressed={status === "registered"}
      >
        {status === "registered" ? (
          <>
            <Check aria-hidden />
            Attending
          </>
        ) : (
          "Attend"
        )}
      </Button>

      <Button
        size="sm"
        variant={status === "interested" ? "secondary" : "outline"}
        loading={pending}
        onClick={() => run(() => setRegistrationAction(eventId, "interested"))}
        aria-pressed={status === "interested"}
      >
        <Star aria-hidden />
        {status === "interested" ? "Interested" : "Save"}
      </Button>

      {status && !compact ? (
        <Button
          size="icon-sm"
          variant="ghost"
          loading={pending}
          onClick={() => run(() => withdrawRegistrationAction(eventId))}
          aria-label="Remove from my events"
        >
          <X aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}
