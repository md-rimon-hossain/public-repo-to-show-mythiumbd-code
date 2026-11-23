"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 backdrop-blur-md",
  {
    variants: {
      variant: {
        default: "border-transparent bg-white/20 dark:bg-black/30 text-foreground",
        trending: "border-orange-500/30 bg-orange-500/20 text-orange-600 dark:text-orange-400",
        new: "border-blue-500/30 bg-blue-500/20 text-blue-600 dark:text-blue-400",
        save: "border-green-500/30 bg-green-500/20 text-green-600 dark:text-green-400",
        category: "border-gray-500/30 bg-gray-500/20 text-gray-600 dark:text-gray-400",
        status: "border-zinc-500/30 bg-zinc-500/20 text-zinc-600 dark:text-zinc-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface GlassBadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export const GlassBadge = forwardRef<HTMLDivElement, GlassBadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      />
    );
  }
);
GlassBadge.displayName = "GlassBadge";
