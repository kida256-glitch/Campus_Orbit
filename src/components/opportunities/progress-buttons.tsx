"use client";

import { useTransition } from "react";
import { CircleCheck, CircleDashed, Star, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ProgressStatus } from "@/lib/constants";
import {
  removeOpportunityProgressAction,
  setOpportunityProgressAction,
} from "@/lib/actions/opportunities";

interface ProgressButtonsProps {
  opportunityId: string;
  status: ProgressStatus | null;
  /** Card layouts show icon-only buttons; the detail page shows labels. */
  showLabels?: boolean;
}

export function ProgressButtons({
  opportunityId,
  status,
  showLabels = false,
}: ProgressButtonsProps) {
  const [pending, startTransition] = useTransition();

  function set(next: ProgressStatus) {
    startTransition(async () => {
      const result =
        status === next
          ? await removeOpportunityProgressAction(opportunityId)
          : await setOpportunityProgressAction(opportunityId, next);

      if (result.ok) toast.success(result.message ?? "Saved");
      else toast.error(result.message ?? "Something went wrong");
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Button
        size="sm"
        variant={status === "saved" ? "secondary" : "outline"}
        loading={pending}
        onClick={() => set("saved")}
        aria-pressed={status === "saved"}
        aria-label="Save for later"
      >
        <Star aria-hidden />
        {showLabels ? "Save" : null}
      </Button>

      <Button
        size="sm"
        variant={status === "in_progress" ? "default" : "outline"}
        loading={pending}
        onClick={() => set("in_progress")}
        aria-pressed={status === "in_progress"}
        aria-label="Mark as in progress"
      >
        <CircleDashed aria-hidden />
        {showLabels ? "In progress" : null}
      </Button>

      <Button
        size="sm"
        variant={status === "completed" ? "emerald" : "outline"}
        loading={pending}
        onClick={() => set("completed")}
        aria-pressed={status === "completed"}
        aria-label="Mark as completed"
      >
        <CircleCheck aria-hidden />
        {showLabels ? "Completed" : null}
      </Button>

      {status && showLabels ? (
        <Button
          size="icon-sm"
          variant="ghost"
          loading={pending}
          onClick={() =>
            startTransition(async () => {
              const result =
                await removeOpportunityProgressAction(opportunityId);
              if (result.ok) toast.success(result.message ?? "Removed");
              else toast.error(result.message);
            })
          }
          aria-label="Remove from my list"
        >
          <X aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}
