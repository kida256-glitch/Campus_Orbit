"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/forms/field";
import { EVENT_CATEGORIES } from "@/lib/constants";
import { submitEventAction, updateEventAction } from "@/lib/actions/events";
import type { Tables } from "@/lib/types/database";

const selectClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/**
 * Event submission and editing.
 *
 * There is no status control: a leader's submission always enters the queue as
 * pending, and editing a rejected event resubmits it. Both rules live in the
 * database, so the absence of the field here is a UI reflection of that, not
 * the enforcement itself.
 */
export function EventForm({ event }: { event?: Tables<"events"> }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = event
        ? await updateEventAction(event.id, formData)
        : await submitEventAction(formData);

      if (result.ok) {
        toast.success(result.message ?? "Saved");
        setErrors({});
        setFormError(undefined);
        router.push("/leader/events");
      } else {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.message);
        // Move focus to the banner so the failure is announced.
        document.getElementById("event-form-top")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  }

  return (
    <form action={submit} className="space-y-6">
      <div id="event-form-top" />

      {event?.status === "rejected" && event.rejection_note ? (
        <div
          role="alert"
          className="rounded-2xl border border-destructive/25 bg-red-50 p-4"
        >
          <p className="text-sm font-semibold text-red-800">
            A moderator asked for changes
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-red-700">
            {event.rejection_note}
          </p>
          <p className="mt-2 text-xs text-red-600">
            Saving your edits resubmits this event for review.
          </p>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Event details</CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <FormError message={formError} />

          <Field label="Title" name="title" error={errors.title} required>
            <Input
              id="title"
              name="title"
              required
              defaultValue={event?.title}
              placeholder="AWS Cloud Practitioner Bootcamp"
            />
          </Field>

          <Field
            label="Description"
            name="description"
            error={errors.description}
            hint="What will students actually do? At least 20 characters."
            required
          >
            <textarea
              id="description"
              name="description"
              required
              rows={6}
              defaultValue={event?.description}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="A hands-on session covering core AWS services, the shared responsibility model and exam strategy. Bring a laptop."
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Date" name="date" error={errors.date} required>
              <input
                id="date"
                name="date"
                type="date"
                required
                defaultValue={event?.date}
                className={selectClass}
              />
            </Field>

            <Field
              label="Start time"
              name="startTime"
              error={errors.startTime}
              required
            >
              <input
                id="startTime"
                name="startTime"
                type="time"
                required
                defaultValue={event?.start_time?.slice(0, 5)}
                className={selectClass}
              />
            </Field>

            <Field label="End time" name="endTime" error={errors.endTime}>
              <input
                id="endTime"
                name="endTime"
                type="time"
                defaultValue={event?.end_time?.slice(0, 5) ?? ""}
                className={selectClass}
              />
            </Field>
          </div>

          <Field
            label="Location"
            name="location"
            error={errors.location}
            required
          >
            <Input
              id="location"
              name="location"
              required
              defaultValue={event?.location}
              placeholder="e.g. Main Auditorium, Block C, Room 204"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" name="category">
              <select
                id="category"
                name="category"
                defaultValue={event?.category ?? "Software Development"}
                className={selectClass}
              >
                {EVENT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Organising community"
              name="organizer"
              error={errors.organizer}
              required
            >
              <Input
                id="organizer"
                name="organizer"
                required
                defaultValue={event?.organizer}
                placeholder="e.g. Computer Science Society"
              />
            </Field>
          </div>

          <Field
            label="Banner image URL"
            name="bannerImage"
            error={errors.bannerImage}
            hint="Optional. A 16:9 image works best; a category gradient is used otherwise."
          >
            <Input
              id="bannerImage"
              name="bannerImage"
              type="url"
              defaultValue={event?.banner_image ?? ""}
              placeholder="https://"
            />
          </Field>

          <Field
            label="External RSVP link"
            name="externalRsvpUrl"
            error={errors.externalRsvpUrl}
            hint="Optional. Use this if registration happens on another platform."
          >
            <Input
              id="externalRsvpUrl"
              name="externalRsvpUrl"
              type="url"
              defaultValue={event?.external_rsvp_url ?? ""}
              placeholder="https://"
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={pending}>
          <Send aria-hidden />
          {event ? "Save changes" : "Submit for review"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>

      {!event ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          Your event enters the moderation queue as <strong>pending</strong>. An
          administrator reviews it before students can see it — that review is
          what makes CampusOrbit listings trustworthy.
        </p>
      ) : null}
    </form>
  );
}
