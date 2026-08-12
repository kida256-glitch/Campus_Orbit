import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  /** Short context line, e.g. "3 awaiting verification". */
  hint?: string;
  href?: string;
  tone?: "blue" | "emerald" | "amber" | "navy" | "red";
}

const TONES = {
  blue: "bg-orbit-50 text-orbit-600",
  emerald: "bg-emeraldx-50 text-emeraldx-600",
  amber: "bg-amber-50 text-amber-600",
  navy: "bg-navy-50 text-navy-600",
  red: "bg-red-50 text-red-600",
} as const;

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  href,
  tone = "blue",
}: StatCardProps) {
  const body = (
    <>
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-xl",
          TONES[tone],
        )}
      >
        <Icon className="size-[18px]" aria-hidden />
      </span>

      <p className="mt-4 text-2xl font-semibold leading-none tracking-[-0.02em] text-navy-900 tabular-nums">
        {value}
      </p>
      <p className="mt-1.5 text-sm font-medium text-navy-700">{label}</p>
      {hint ? (
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </>
  );

  const classes =
    "rounded-2xl border border-border/80 bg-card p-5 shadow-soft transition-all";

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          classes,
          "block hover:-translate-y-0.5 hover:border-orbit-200 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        {body}
      </Link>
    );
  }

  return <div className={classes}>{body}</div>;
}
