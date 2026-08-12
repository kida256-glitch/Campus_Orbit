"use client";

import { useActionState, useState } from "react";
import { Check, Eye, EyeOff, GraduationCap, Megaphone } from "lucide-react";

import { signUpAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError, fieldProps } from "@/components/forms/field";

const ROLE_OPTIONS = [
  {
    value: "student",
    label: "Student",
    icon: GraduationCap,
    description: "Discover events, track opportunities, build a portfolio",
  },
  {
    value: "community_leader",
    label: "Community Leader",
    icon: Megaphone,
    description: "Submit events and verify who attended",
  },
] as const;

/** Live password checklist so requirements are visible before submitting. */
const RULES = [
  { test: (v: string) => v.length >= 8, label: "At least 8 characters" },
  { test: (v: string) => /[A-Z]/.test(v), label: "An uppercase letter" },
  { test: (v: string) => /[a-z]/.test(v), label: "A lowercase letter" },
  { test: (v: string) => /[0-9]/.test(v), label: "A number" },
];

export function SignupForm() {
  const [state, action, pending] = useActionState(signUpAction, null);
  const [role, setRole] = useState<string>("student");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const errors = state?.ok === false ? state.fieldErrors : undefined;
  const formError = state?.ok === false && !errors ? state.message : undefined;

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormError message={formError} />

      <Field name="fullName" label="Full name" error={errors?.fullName} required>
        <Input
          {...fieldProps("fullName", errors?.fullName)}
          autoComplete="name"
          placeholder="Benjamin Ssekandi"
          required
          autoFocus
        />
      </Field>

      <Field
        name="email"
        label="Email"
        error={errors?.email}
        required
      >
        <Input
          {...fieldProps("email", errors?.email)}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      </Field>

      <Field
        name="university"
        label="School / University / College"
        error={errors?.university}
        hint="Where you study. You can update this later."
      >
        <Input
          {...fieldProps("university", errors?.university)}
          autoComplete="organization"
          placeholder="e.g. University of Lagos, MIT, KNUST"
        />
      </Field>

      <Field name="password" label="Password" error={errors?.password} required>
        <div className="relative">
          <Input
            {...fieldProps("password", errors?.password)}
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Create a password"
            className="pr-10"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-1 top-1 rounded-md p-2 text-muted-foreground transition-colors hover:text-navy-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden />
            ) : (
              <Eye className="size-4" aria-hidden />
            )}
          </button>
        </div>

        {password.length > 0 ? (
          <ul className="mt-2 grid grid-cols-2 gap-1.5">
            {RULES.map((rule) => {
              const met = rule.test(password);
              return (
                <li
                  key={rule.label}
                  className={cn(
                    "flex items-center gap-1.5 text-xs",
                    met ? "text-emeraldx-700" : "text-muted-foreground",
                  )}
                >
                  <Check
                    className={cn(
                      "size-3.5 shrink-0",
                      met ? "opacity-100" : "opacity-30",
                    )}
                    aria-hidden
                  />
                  {rule.label}
                </li>
              );
            })}
          </ul>
        ) : null}
      </Field>

      {/* Role selection. Admin is intentionally not offered. */}
      <fieldset>
        <legend className="text-sm font-medium text-navy-800">
          How will you use CampusOrbit?
        </legend>

        <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
          {ROLE_OPTIONS.map((option) => {
            const selected = role === option.value;
            return (
              <label
                key={option.value}
                className={cn(
                  "cursor-pointer rounded-xl border p-3.5 transition-all",
                  "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1",
                  selected
                    ? "border-orbit-400 bg-orbit-50/70 shadow-sm"
                    : "border-border hover:border-orbit-200 hover:bg-secondary/60",
                )}
              >
                <input
                  type="radio"
                  name="role"
                  value={option.value}
                  checked={selected}
                  onChange={() => setRole(option.value)}
                  className="sr-only"
                />
                <span className="flex items-center gap-2">
                  <option.icon
                    className={cn(
                      "size-4",
                      selected ? "text-orbit-600" : "text-muted-foreground",
                    )}
                    aria-hidden
                  />
                  <span className="text-sm font-semibold text-navy-900">
                    {option.label}
                  </span>
                  {selected ? (
                    <Check className="ml-auto size-4 text-orbit-600" aria-hidden />
                  ) : null}
                </span>
                <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">
                  {option.description}
                </span>
              </label>
            );
          })}
        </div>

        {errors?.role ? (
          <p role="alert" className="mt-2 text-xs font-medium text-destructive">
            {errors.role}
          </p>
        ) : null}
      </fieldset>

      <Button
        type="submit"
        variant="brand"
        className="w-full"
        size="lg"
        loading={pending}
      >
        {pending ? "Creating your account…" : "Create account"}
      </Button>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Administrator accounts are provisioned by the CampusOrbit team and
        cannot be selected here.
      </p>
    </form>
  );
}
