"use client";

import { Toaster as SonnerToaster } from "sonner";

/** App-wide toast host, styled to match the CampusOrbit surface tokens. */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "rounded-xl border border-border bg-background text-navy-900 shadow-card",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground rounded-md",
          cancelButton: "bg-secondary text-navy-700 rounded-md",
          success: "border-emeraldx-200",
          error: "border-red-200",
        },
      }}
    />
  );
}
