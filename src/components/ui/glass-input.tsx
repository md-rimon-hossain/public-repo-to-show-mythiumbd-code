"use client";

import { forwardRef, InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, label, error, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-sm font-medium text-foreground/80 ml-1">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "flex h-10 w-full rounded-md border border-white/10 bg-white/5 dark:bg-black/10 px-3 py-2 text-sm backdrop-blur-md file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 glass-input transition-all",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-red-500/50 focus-visible:ring-red-500",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-sm text-red-500 ml-1">{error}</p>}
      </div>
    );
  }
);
GlassInput.displayName = "GlassInput";
