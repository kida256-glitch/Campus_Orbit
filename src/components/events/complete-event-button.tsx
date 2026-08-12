"use client";

import { useTransition } from "react";
import { CircleCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { completeEventAction } from "@/lib/actions/events";

/** Closes out a past event. Leaders may do this; approve/reject stays admin-only. */
export function CompleteEventButton({ eventId }: { eventId: string }) {
  const [pending, startTransition] = useTransition();

  function complete() {
    startTransition(async () => {
      const result = await completeEventAction(eventId);
      if (result.ok) toast.success(result.message ?? "Marked complete");
      else toast.error(result.message);
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={pending}>
          <CircleCheck aria-hidden />
          Mark completed
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mark this event completed?</AlertDialogTitle>
          <AlertDialogDescription>
            It stays visible to students as a past event. You can still verify
            attendance afterwards.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={complete}>
            Mark completed
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
