"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Route-level error boundary.
 *
 * Shows a recovery action rather than a stack trace. The digest is surfaced
 * because it is the only thing that correlates a user report with server logs.
 */
export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("CampusOrbit route error:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md py-12">
      <Card>
        <CardContent className="flex flex-col items-center p-8 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-red-50">
            <AlertTriangle className="size-5 text-destructive" aria-hidden />
          </span>

          <h1 className="mt-4 text-lg font-semibold text-navy-900">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            This page could not load. Your data is safe — nothing was changed.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button onClick={reset}>
              <RotateCcw aria-hidden />
              Try again
            </Button>
            <Button variant="outline" asChild>
              <a href="/dashboard">Back to dashboard</a>
            </Button>
          </div>

          {error.digest ? (
            <p className="mt-5 text-xs text-muted-foreground">
              Reference: <code className="font-mono">{error.digest}</code>
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
