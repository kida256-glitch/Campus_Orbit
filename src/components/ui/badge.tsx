import * as React from "react";
import { type VariantProps, cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-transparent bg-orbit-50 text-orbit-700",
        secondary: "border-transparent bg-secondary text-navy-700",
        outline: "border-border text-navy-600",
        verified: "border-transparent bg-emeraldx-50 text-emeraldx-700",
        pending: "border-transparent bg-amber-50 text-amber-700",
        rejected: "border-transparent bg-red-50 text-red-700",
        muted: "border-transparent bg-navy-50 text-navy-500",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
