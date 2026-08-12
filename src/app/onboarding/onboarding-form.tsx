"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";

import { completeOnboardingAction, skipOnboardingAction } from "@/lib/actions/auth";
import { INTEREST_OPTIONS, SKILL_OPTIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormError } from "@/components/forms/field";
import { TagPicker } from "@/components/forms/tag-picker";

export function OnboardingForm({
  defaultInterests,
  defaultSkills,
}: {
  defaultInterests: string[];
  defaultSkills: string[];
}) {
  const [state, action, pending] = useActionState(
    completeOnboardingAction,
    null,
  );

  return (
    <div className="space-y-4">
      <form action={action} className="space-y-4">
        <Card>
          <CardContent className="pt-5 sm:pt-6">
            <TagPicker
              name="interests"
              label="Interests — pick at least 3"
              options={INTEREST_OPTIONS}
              defaultSelected={defaultInterests}
              max={12}
              emptyHint="Choose the topics you want to hear about."
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 sm:pt-6">
            <TagPicker
              name="skills"
              label="Skills you already have (optional)"
              options={SKILL_OPTIONS}
              defaultSelected={defaultSkills}
              max={20}
              allowCustom
              emptyHint="Skip this if you are just starting out — verified activity will add skills for you."
            />
          </CardContent>
        </Card>

        <FormError message={state?.ok === false ? state.message : undefined} />

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="submit"
            variant="brand"
            size="lg"
            loading={pending}
            className="sm:flex-1"
          >
            {pending ? "Setting up your dashboard…" : "Continue"}
            {!pending ? <ArrowRight aria-hidden /> : null}
          </Button>
        </div>
      </form>

      {/* Separate form so skipping never submits the pickers. */}
      <form action={skipOnboardingAction}>
        <Button type="submit" variant="ghost" size="sm" className="w-full">
          Skip for now
        </Button>
      </form>
    </div>
  );
}
