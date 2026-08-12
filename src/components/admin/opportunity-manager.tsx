"use client";

import { useRef, useState, useTransition } from "react";
import {
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/forms/field";
import { TagPicker } from "@/components/forms/tag-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { EmptyState } from "@/components/ui/empty-state";
import { OPPORTUNITY_TYPES, SKILL_OPTIONS } from "@/lib/constants";
import {
  deleteOpportunityAction,
  saveOpportunityAction,
  setOpportunityStatusAction,
} from "@/lib/actions/admin";
import type { Tables } from "@/lib/types/database";

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type Opportunity = Tables<"opportunities">;

/**
 * Admin CRUD for the opportunity directory.
 *
 * Unpublishing sets status to `draft` rather than deleting, so students who
 * already saved or completed an opportunity keep their progress rows and their
 * portfolio evidence survives.
 */
export function OpportunityManager({
  opportunities,
}: {
  opportunities: Opportunity[];
}) {
  const [editing, setEditing] = useState<Opportunity | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const formRef = useRef<HTMLFormElement>(null);

  function openNew() {
    setEditing(null);
    setErrors({});
    setFormError(undefined);
    setOpen(true);
  }

  function openEdit(opportunity: Opportunity) {
    setEditing(opportunity);
    setErrors({});
    setFormError(undefined);
    setOpen(true);
  }

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await saveOpportunityAction(formData);
      if (result.ok) {
        toast.success(result.message ?? "Saved");
        setOpen(false);
        formRef.current?.reset();
      } else {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.message);
      }
    });
  }

  function toggleStatus(opportunity: Opportunity) {
    startTransition(async () => {
      const next = opportunity.status === "published" ? "draft" : "published";
      const result = await setOpportunityStatusAction(opportunity.id, next);
      if (result.ok) toast.success(result.message ?? "Updated");
      else toast.error(result.message);
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteOpportunityAction(id);
      if (result.ok) toast.success(result.message ?? "Deleted");
      else toast.error(result.message);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={openNew}>
          <Plus aria-hidden />
          New opportunity
        </Button>
      </div>

      {opportunities.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="No opportunities yet"
          description="Create the first opportunity so students have something to work towards."
        />
      ) : (
        <ul className="space-y-3">
          {opportunities.map((opportunity) => (
            <li
              key={opportunity.id}
              className="rounded-2xl border border-border/80 bg-card p-4 shadow-soft sm:p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        opportunity.status === "published"
                          ? "verified"
                          : opportunity.status === "draft"
                            ? "pending"
                            : "muted"
                      }
                    >
                      {opportunity.status}
                    </Badge>
                    <Badge variant="outline">{opportunity.type}</Badge>
                  </div>

                  <h3 className="mt-2.5 text-sm font-semibold text-navy-900">
                    {opportunity.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {opportunity.organization} ·{" "}
                    {opportunity.deadline
                      ? `closes ${format(new Date(`${opportunity.deadline}T00:00:00`), "d MMM yyyy")}`
                      : "rolling deadline"}
                  </p>

                  {opportunity.skill_tags.length > 0 ? (
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {opportunity.skill_tags.map((tag) => (
                        <li key={tag}>
                          <Badge variant="muted">{tag}</Badge>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    loading={pending}
                    onClick={() => toggleStatus(opportunity)}
                  >
                    {opportunity.status === "published" ? (
                      <>
                        <EyeOff aria-hidden />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <Eye aria-hidden />
                        Publish
                      </>
                    )}
                  </Button>

                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => openEdit(opportunity)}
                    aria-label={`Edit ${opportunity.title}`}
                  >
                    <Pencil aria-hidden />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Delete ${opportunity.title}`}
                      >
                        <Trash2 aria-hidden />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete {opportunity.title}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This permanently removes the opportunity and every
                          student&apos;s progress on it, including completions
                          that currently count as portfolio evidence. Unpublish
                          instead if you only want to hide it.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => remove(opportunity.id)}
                        >
                          Delete permanently
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit opportunity" : "New opportunity"}
            </DialogTitle>
            <DialogDescription>
              Skill tags drive the recommendation engine, so pick them
              carefully.
            </DialogDescription>
          </DialogHeader>

          {/* Remount on target change so defaultValues refresh. */}
          <form
            key={editing?.id ?? "new"}
            ref={formRef}
            action={submit}
            className="space-y-4"
          >
            <FormError message={formError} />

            {editing ? (
              <input type="hidden" name="id" value={editing.id} />
            ) : null}

            <Field label="Title" name="title" error={errors.title} required>
              <Input
                id="title"
                name="title"
                required
                defaultValue={editing?.title}
              />
            </Field>

            <Field
              label="Description"
              name="description"
              error={errors.description}
              required
            >
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                defaultValue={editing?.description}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Organisation"
                name="organization"
                error={errors.organization}
                required
              >
                <Input
                  id="organization"
                  name="organization"
                  required
                  defaultValue={editing?.organization}
                />
              </Field>

              <Field label="Type" name="type">
                <select
                  id="type"
                  name="type"
                  defaultValue={editing?.type ?? "Internship"}
                  className={inputClass}
                >
                  {OPPORTUNITY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Deadline"
                name="deadline"
                hint="Leave blank for a rolling deadline."
              >
                <input
                  id="deadline"
                  name="deadline"
                  type="date"
                  defaultValue={editing?.deadline ?? ""}
                  className={inputClass}
                />
              </Field>

              <Field label="Status" name="status">
                <select
                  id="status"
                  name="status"
                  defaultValue={editing?.status ?? "published"}
                  className={inputClass}
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </Field>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-navy-800">
                Skill tags
              </p>
              <TagPicker
                name="skillTags"
                options={SKILL_OPTIONS}
                defaultSelected={editing?.skill_tags ?? []}
                max={12}
                allowCustom
              />
            </div>

            <Field
              label="Application URL"
              name="applicationUrl"
              error={errors.applicationUrl}
            >
              <Input
                id="applicationUrl"
                name="applicationUrl"
                type="url"
                placeholder="https://"
                defaultValue={editing?.application_url ?? ""}
              />
            </Field>

            <Field label="Image URL" name="image" error={errors.image}>
              <Input
                id="image"
                name="image"
                type="url"
                placeholder="https://"
                defaultValue={editing?.image ?? ""}
              />
            </Field>

            <DialogFooter>
              <Button type="submit" loading={pending}>
                {editing ? "Save changes" : "Create opportunity"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
