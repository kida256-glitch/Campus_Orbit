import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  hint?: string;
  href?: string;
  tone?: "blue" | "emerald" | "amber" | "navy" | "red";
  /** Stagger index for the entry animation. */
  stagger?: number;
}

const TONES = {
  blue: {
    icon: "bg-orbit-100 text-orbit-600",
    gradient: "from-orbit-50/80 via-white to-white",
    border: "border-orbit-100/80",
    value: "text-orbit-900",
    glow: "hover:shadow-glow hover:border-orbit-200",
  },
  emerald: {
    icon: "bg-emeraldx-100 text-emeraldx-600",
    gradient: "from-emeraldx-50/80 via-white to-white",
    border: "border-emeraldx-100/80",
    value: "text-emeraldx-900",
    glow: "hover:shadow-glow-emerald hover:border-emeraldx-200",
  },
  amber: {
    icon: "bg-amber-100 text-amber-600",
    gradient: "from-amber-50/80 via-white to-white",
    border: "border-amber-100/80",
    value: "text-amber-900",
    glow: "hover:border-amber-200",
  },
  navy: {
    icon: "bg-navy-100 text-navy-600",
    gradient: "from-navy-50/80 via-white to-white",
    border: "border-navy-100/80",
    value: "text-navy-900",
    glow: "hover:border-navy-200",
  },
  red: {
    icon: "bg-red-100 text-red-600",
    gradient: "from-red-50/80 via-white to-white",
    border: "border-red-100/80",
    value: "text-red-900",
    glow: "hover:border-red-200",
  },
} as const;

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  href,
  tone = "blue",
  stagger,
}: StatCardProps) {
  const t = TONES[tone];

  const body = (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 shadow-soft transition-all duration-300",
      t.gradient,
      t.border,
      href && cn("hover:-translate-y-1 cursor-pointer", t.glow),
      stagger && `animate-fade-up stagger-${stagger}`,
    )}>
      {/* Icon */}
      <span className={cn(
        "inline-flex size-10 items-center justify-center rounded-xl shadow-sm",
        t.icon,
      )}>
        <Icon className="size-5" aria-hidden />
      </span>

      {/* Value */}
      <p className={cn(
        "mt-4 text-2xl font-bold leading-none tracking-[-0.03em] tabular-nums number-animate",
        t.value,
      )}>
        {value}
      </p>

      {/* Label */}
      <p className="mt-1.5 text-sm font-medium text-navy-700">{label}</p>

      {/* Hint */}
      {hint ? (
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{hint}</p>
      ) : null}

      {/* Subtle top-left shine */}
      <div
        className="pointer-events-none absolute -right-4 -top-4 size-20 rounded-full opacity-30"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.8), transparent 70%)" }}
        aria-hidden
      />
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl"
      >
        {body}
      </Link>
    );
  }

  return body;
}
