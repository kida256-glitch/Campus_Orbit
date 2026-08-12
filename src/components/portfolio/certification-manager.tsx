"use client";

import { useRef, useState, useTransition } from "react";
import { Award, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/forms/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  deleteCertificationAction,
  saveCertificationAction,
} from "@/lib/actions/certifications";
import type { Tables } from "@/lib/types/database";

interface CertificationManagerProps {
  certifications: Tables<"student_certifications">[];
  catalog: Pick<Tables<"certifications">, "id" | "name" | "provider">[];
}

/**
 * Certification tracker.
 *
 * This is the one place a student enters data by hand, and only because no
 * campus organiser can attest to an external credential. Completed entries feed
 * the portfolio's skill derivation, which is why picking from the shared
 * catalog is offered first — catalog entries carry consistent skill tags.
 */
export function CertificationManager({
  certifications,
  catalog,
}: CertificationManagerProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await saveCertificationAction(formData);

      if (result.ok) {
        toast.success(result.message ?? "Saved");
        setErrors({});
        setOpen(false);
        formRef.current?.reset();
      } else {
        setErrors(result.fieldErrors ?? {});
        toast.error(result.message);
      }
    });
  }

  function remove(id: string, name: string) {
    startTransition(async () => {
      const result = await deleteCertificationAction(id);
      if (result.ok) toast.success(`Removed ${name}`);
      else toast.error(result.message);
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Certifications</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Completed certifications appear on your portfolio automatically.
            </p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus aria-hidden />
                Add
              </Button>
            </DialogTrigger>

            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Track a certification</DialogTitle>
                <DialogDescription>
                  Pick one from the catalog for consistent skill tagging, or
                  enter your own.
                </DialogDescription>
              </DialogHeader>

              <form ref={formRef} action={submit} className="space-y-4">
                <Field
                  label="From the catalog"
                  name="certificationId"
                  hint="Optional. Selecting one overrides the name, provider and skills below."
                >
                  <select
                    id="certificationId"
                    name="certificationId"
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    defaultValue=""
                  >
                    <option value="">Not listed — I&apos;ll type it in</option>
                    {catalog.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} — {item.provider}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  label="Certification name"
                  name="name"
                  error={errors.name}
                  required
                >
                  <input
                    id="name"
                    name="name"
                    required
                    placeholder="AWS Certified Cloud Practitioner"
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </Field>

                <Field
                  label="Provider"
                  name="provider"
                  error={errors.provider}
                  required
                >
                  <input
                    id="provider"
                    name="provider"
                    required
                    placeholder="AWS"
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Started" name="startedDate">
                    <input
                      id="startedDate"
                      name="startedDate"
                      type="date"
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </Field>

                  <Field
                    label="Completed"
                    name="completionDate"
                    error={errors.completionDate}
                  >
                    <input
                      id="completionDate"
                      name="completionDate"
                      type="date"
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </Field>
                </div>

                <Field label="Status" name="status">
                  <select
                    id="status"
                    name="status"
                    defaultValue="in_progress"
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </Field>

                <Field
                  label="Credential URL"
                  name="credentialUrl"
                  error={errors.credentialUrl}
                  hint="A public verification link, if the provider issues one."
                >
                  <input
                    id="credentialUrl"
                    name="credentialUrl"
                    type="url"
                    placeholder="https://"
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </Field>

                <DialogFooter>
                  <Button type="submit" loading={pending}>
                    Save certification
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {certifications.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-secondary/40 px-4 py-6 text-center text-xs text-muted-foreground">
            No certifications tracked yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {certifications.map((cert) => (
              <li
                key={cert.id}
                className="flex items-center gap-3 rounded-xl border border-border/80 bg-card p-3"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Award className="size-4" aria-hidden />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-navy-900">
                    {cert.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {cert.provider}
                  </p>
                </div>

                <Badge
                  variant={cert.status === "completed" ? "verified" : "pending"}
                >
                  {cert.status === "completed" ? "Completed" : "In progress"}
                </Badge>

                <Button
                  size="icon-sm"
                  variant="ghost"
                  loading={pending}
                  onClick={() => remove(cert.id, cert.name)}
                  aria-label={`Remove ${cert.name}`}
                >
                  <Trash2 aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
