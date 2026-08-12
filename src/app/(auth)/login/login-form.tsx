"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { signInAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError, fieldProps } from "@/components/forms/field";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signInAction, null);
  const [showPassword, setShowPassword] = useState(false);

  const errors = state?.ok === false ? state.fieldErrors : undefined;
  const formError =
    state?.ok === false && !errors ? state.message : undefined;

  return (
    <form action={action} className="space-y-4" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <FormError message={formError} />

      <Field name="email" label="Email" error={errors?.email} required>
        <Input
          {...fieldProps("email", errors?.email)}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          autoFocus
        />
      </Field>

      <Field name="password" label="Password" error={errors?.password} required>
        <div className="relative">
          <Input
            {...fieldProps("password", errors?.password)}
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Your password"
            className="pr-10"
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
      </Field>

      <Button
        type="submit"
        variant="brand"
        className="w-full"
        size="lg"
        loading={pending}
      >
        {pending ? "Signing you in…" : "Log in"}
      </Button>
    </form>
  );
}
