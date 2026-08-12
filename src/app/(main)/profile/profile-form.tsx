"use client";

import { useState, useTransition } from "react";
import { Check, Link2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/forms/field";
import { TagPicker } from "@/components/forms/tag-picker";
import { INTEREST_OPTIONS, SKILL_OPTIONS } from "@/lib/constants";
import {
  updateProfileAction,
  updateUsernameAction,
} from "@/lib/actions/profile";
import type { Profile } from "@/lib/auth";

export function ProfileForm({
  profile,
  siteUrl,
}: {
  profile: Profile;
  siteUrl: string;
}) {
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();

  const links = (profile.links ?? {}) as {
    github?: string;
    linkedin?: string;
    website?: string;
  };

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await updateProfileAction(formData);
      if (result.ok) {
        toast.success(result.message ?? "Saved");
        setErrors({});
        setFormError(undefined);
      } else {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.message);
      }
    });
  }

  return (
    <form action={submit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">About you</CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <FormError message={formError} />

          <Field
            label="Full name"
            name="fullName"
            error={errors.fullName}
            required
          >
            <Input
              id="fullName"
              name="fullName"
              defaultValue={profile.full_name}
              required
            />
          </Field>

          <Field
            label="Short bio"
            name="bio"
            error={errors.bio}
            hint="Two or three sentences. This appears at the top of your public portfolio."
          >
            <textarea
              id="bio"
              name="bio"
              rows={4}
              maxLength={600}
              defaultValue={profile.bio ?? ""}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Third-year Business Computing student. I build web apps and spend weekends at hackathons."
            />
          </Field>

          <div className="rounded-xl bg-secondary/60 p-4">
            <p className="text-sm font-medium text-navy-800">University / College</p>
            <p className="mt-1 text-xs text-muted-foreground">
              You can update this below if it changes.
            </p>
          </div>

          <Field
            label="School / University / College"
            name="university"
            error={errors.university}
          >
            <Input
              id="university"
              name="university"
              defaultValue={profile.university ?? ""}
              placeholder="e.g. University of Lagos, MIT, KNUST"
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Interests</CardTitle>
          <p className="text-xs text-muted-foreground">
            These drive your recommendations. Pick at least three.
          </p>
        </CardHeader>
        <CardContent>
          <TagPicker
            name="interests"
            options={INTEREST_OPTIONS}
            defaultSelected={profile.interests ?? []}
            max={12}
            emptyHint="No interests selected — recommendations will be generic."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Skills</CardTitle>
          <p className="text-xs text-muted-foreground">
            Self-declared skills appear on your portfolio marked as unverified
            until activity backs them up.
          </p>
        </CardHeader>
        <CardContent>
          <TagPicker
            name="skills"
            options={SKILL_OPTIONS}
            defaultSelected={profile.skills ?? []}
            max={20}
            allowCustom
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="GitHub" name="github" error={errors.github}>
            <Input
              id="github"
              name="github"
              type="url"
              defaultValue={links.github ?? ""}
              placeholder="https://github.com/yourname"
            />
          </Field>
          <Field label="LinkedIn" name="linkedin" error={errors.linkedin}>
            <Input
              id="linkedin"
              name="linkedin"
              type="url"
              defaultValue={links.linkedin ?? ""}
              placeholder="https://www.linkedin.com/in/yourname"
            />
          </Field>
          <Field label="Website" name="website" error={errors.website}>
            <Input
              id="website"
              name="website"
              type="url"
              defaultValue={links.website ?? ""}
              placeholder="https://yoursite.com"
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" loading={pending}>
          <Check aria-hidden />
          Save profile
        </Button>
      </div>

      <UsernameCard username={profile.username} siteUrl={siteUrl} />
    </form>
  );
}

/**
 * Handle editing lives outside the main form because it is a separate action
 * with its own uniqueness failure mode.
 */
function UsernameCard({
  username,
  siteUrl,
}: {
  username: string | null;
  siteUrl: string;
}) {
  const [value, setValue] = useState(username ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function save() {
    startTransition(async () => {
      const result = await updateUsernameAction(value);
      if (result.ok) {
        toast.success(result.message ?? "Handle updated");
        setError(undefined);
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="size-4 text-orbit-600" aria-hidden />
          Portfolio handle
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          This forms your shareable portfolio URL.
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="shrink-0 text-xs text-muted-foreground">
            {siteUrl}/portfolio/
          </span>
          <Input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            aria-label="Portfolio handle"
            aria-invalid={error ? true : undefined}
            className="sm:max-w-xs"
            placeholder="your-name"
          />
          <Button
            type="button"
            variant="outline"
            loading={pending}
            onClick={save}
            disabled={!value.trim() || value === username}
          >
            Update
          </Button>
        </div>

        {error ? (
          <p role="alert" className="text-xs font-medium text-destructive">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
