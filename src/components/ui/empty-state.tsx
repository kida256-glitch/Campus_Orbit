import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href: string };
  className?: string;
  /** Optional secondary hint, e.g. explaining how a section fills up. */
  hint?: string;
}

/**
 * Shared empty state. Every list in CampusOrbit uses this so a new account
 * never sees a blank panel without an explanation of how to fill it.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  hint,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/40 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-background shadow-soft">
        <Icon className="size-5 text-orbit-500" aria-hidden />
      </div>
      <h3 className="text-base font-semibold text-navy-900">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {hint ? (
        <p className="mt-3 max-w-sm text-xs text-muted-foreground/80">{hint}</p>
      ) : null}
      {action ? (
        <Button asChild className="mt-5" size="sm">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      ) : null}
    </div>
  );
}
