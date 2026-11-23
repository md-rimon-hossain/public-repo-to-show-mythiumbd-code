"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const glassCardVariants = cva(
  "rounded-xl transition-all duration-300 border border-border overflow-hidden",
  {
    variants: {
      variant: {
        default: "glass-card",
        heavy: "glass-heavy",
        light: "glass-light",
        liquid: "liquid-glass",
      },
      hover: {
        true: "hover:shadow-lg hover:-translate-y-1 hover:border-foreground/20",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      hover: false,
    },
  }
);

export interface GlassCardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant, hover, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(glassCardVariants({ variant, hover, className }))}
        {...props}
      />
    );
  }
);
GlassCard.displayName = "GlassCard";
