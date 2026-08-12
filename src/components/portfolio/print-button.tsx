"use client";

import { Printer, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/**
 * "Download" is the browser's own print dialog, which offers Save as PDF on
 * every major platform. Honest MVP: no server-side PDF pipeline to maintain,
 * and the print stylesheet in globals.css keeps the output clean.
 */
export function PrintButton({ label = "Download / print" }: { label?: string }) {
  return (
    <Button variant="outline" size="sm" onClick={() => window.print()}>
      <Printer aria-hidden />
      {label}
    </Button>
  );
}

/** Shares via the Web Share API where available, clipboard everywhere else. */
export function ShareButton({ url }: { url: string }) {
  async function share() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "My CampusOrbit portfolio", url });
        return;
      } catch {
        // User dismissed the sheet, or the browser refused — fall through.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success("Portfolio link copied");
    } catch {
      toast.error("Could not copy the link.");
    }
  }

  return (
    <Button variant="brand" size="sm" onClick={share}>
      <Share2 aria-hidden />
      Share portfolio
    </Button>
  );
}
