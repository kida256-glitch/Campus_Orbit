"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { approveEventAction, rejectEventAction } from "@/lib/actions/events";
import {
  reviewListingAction,
  reviewSellerAction,
} from "@/lib/actions/marketplace";

type Kind = "event" | "seller" | "listing";

/**
 * Approve / reject pair used across every moderation queue.
 *
 * Rejection always requires a written note. That is enforced in the database
 * too (a CHECK constraint for events, and the action for marketplace rows), so
 * a moderator cannot silently kill someone's submission.
 */
export function ModerationActions({
  id,
  kind,
  title,
  compact = false,
}: {
  id: string;
  kind: Kind;
  title: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function approve() {
    startTransition(async () => {
      const result =
        kind === "event"
          ? await approveEventAction(id)
          : kind === "seller"
            ? await reviewSellerAction(id, "approved")
            : await reviewListingAction(id, "approved");

      if (result.ok) toast.success(result.message ?? "Approved");
      else toast.error(result.message);
    });
  }

  function reject() {
    startTransition(async () => {
      const result =
        kind === "event"
          ? await rejectEventAction(id, note)
          : kind === "seller"
            ? await reviewSellerAction(id, "rejected", note)
            : await reviewListingAction(id, "rejected", note);

      if (result.ok) {
        toast.success(result.message ?? "Rejected");
        setOpen(false);
        setNote("");
        setError(undefined);
      } else {
        setError(result.message);
      }
    });
  }

  const rejectLabel =
    kind === "listing" ? "Remove" : kind === "seller" ? "Decline" : "Reject";

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="emerald"
          loading={pending}
          onClick={approve}
        >
          <Check aria-hidden />
          {compact ? null : "Approve"}
        </Button>

        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => setOpen(true)}
        >
          <X aria-hidden />
          {compact ? null : rejectLabel}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{rejectLabel}: {title}</DialogTitle>
            <DialogDescription>
              Explain what needs to change. This note is sent to the submitter,
              so make it actionable.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label htmlFor="moderation-note" className="sr-only">
              Moderation note
            </label>
            <textarea
              id="moderation-note"
              rows={4}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              aria-invalid={error ? true : undefined}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="The description doesn't say what students will actually do. Add an agenda and resubmit."
            />
            <p className="text-xs text-muted-foreground">
              At least 10 characters.
            </p>
            {error ? (
              <p role="alert" className="text-xs font-medium text-destructive">
                {error}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={pending}
              onClick={reject}
              disabled={note.trim().length < 10}
            >
              {rejectLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
