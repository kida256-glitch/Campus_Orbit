/**
 * Shared shape for every Server Action result.
 *
 * Actions never throw for expected failures; they return a discriminated
 * result so forms can render field-level errors and toasts without a
 * try/catch at every call site.
 */
export type ActionState<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | {
      ok: false;
      message: string;
      /** Field name -> first error message, keyed to the form input names. */
      fieldErrors?: Record<string, string>;
    };

export const ok = <T>(message?: string, data?: T): ActionState<T> => ({
  ok: true,
  message,
  data,
});

export const fail = (
  message: string,
  fieldErrors?: Record<string, string>,
): ActionState<never> => ({ ok: false, message, fieldErrors });

/** Flattens a Zod error into `{ field: firstMessage }`. */
export function fieldErrorsFrom(
  issues: { path: (string | number)[]; message: string }[],
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

/**
 * Turns a Postgres/PostgREST error into something a student can act on.
 * Guard-trigger messages are already human-readable, so those pass through.
 */
export function humanizeDbError(error: {
  message: string;
  code?: string;
}): string {
  const message = error.message ?? "Something went wrong";

  if (/row-level security/i.test(message) || error.code === "42501") {
    return "You do not have permission to do that.";
  }
  if (error.code === "23505" || /duplicate key/i.test(message)) {
    return "That already exists.";
  }
  if (error.code === "23514") {
    return "Some of those details are not valid. Check the form and try again.";
  }
  if (error.code === "23503") {
    return "That item no longer exists.";
  }

  return message;
}
