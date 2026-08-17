import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-orbit-700 hover:-translate-y-0.5 hover:shadow-soft active:translate-y-0 active:scale-[0.98]",
        brand:
          "bg-orbit-gradient text-white shadow-glow hover:brightness-110 hover:-translate-y-0.5 hover:shadow-glow-lg active:translate-y-0 active:scale-[0.98]",
        emerald:
          "bg-accent text-accent-foreground shadow-sm hover:bg-emeraldx-700 hover:-translate-y-0.5 hover:shadow-glow-emerald active:translate-y-0 active:scale-[0.98]",
        outline:
          "border border-input bg-background shadow-sm hover:bg-secondary hover:text-secondary-foreground hover:-translate-y-0.5 hover:border-orbit-200 active:translate-y-0",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-navy-100 hover:-translate-y-0.5 active:translate-y-0",
        ghost: "hover:bg-secondary hover:text-secondary-foreground active:scale-[0.98]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-red-700 hover:-translate-y-0.5 active:translate-y-0",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-[13px]",
        lg: "h-12 rounded-xl px-7 text-base",
        icon: "size-10",
        "icon-sm": "size-8 rounded-md",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Renders a spinner and blocks interaction. */
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading, children, disabled, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? <Loader2 className="animate-spin" aria-hidden /> : null}
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
