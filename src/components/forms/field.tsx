import { AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface FieldProps {
  name: string;
  label: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
  className?: string;
  required?: boolean;
}

/**
 * Accessible field wrapper: ties label, hint and error to the control via
 * `aria-describedby`, and announces errors politely for screen readers.
 */
export function Field({
  name,
  label,
  children,
  error,
  hint,
  className,
  required,
}: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={name}>
        {label}
        {required ? (
          <span className="ml-0.5 text-destructive" aria-hidden>
            *
          </span>
        ) : null}
      </Label>

      {children}

      {hint && !error ? (
        <p id={`${name}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p
          id={`${name}-error`}
          role="alert"
          className="flex items-start gap-1.5 text-xs font-medium text-destructive"
        >
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Attributes that wire a control to its Field hint/error. */
export function fieldProps(name: string, error?: string, hint?: string) {
  const describedBy = [
    error ? `${name}-error` : null,
    hint && !error ? `${name}-hint` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    id: name,
    name,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy || undefined,
  } as const;
}

/** Form-level error banner shown above the submit button. */
export function FormError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-destructive/25 bg-red-50 px-3.5 py-3 text-sm text-red-700"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  );
}
