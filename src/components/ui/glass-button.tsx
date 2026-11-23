"use client";

import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "glass-button backdrop-blur-sm bg-white text-black border border-black hover:bg-gray-100 dark:bg-black dark:text-white dark:border-white dark:hover:bg-gray-900",
        primary: "glass-button backdrop-blur-sm bg-black text-white border border-black hover:bg-gray-900 dark:bg-white dark:text-black dark:border-white dark:hover:bg-gray-100",
        outline: "glass-button backdrop-blur-sm border border-black bg-transparent hover:bg-gray-100 dark:border-white dark:hover:bg-gray-900 text-foreground",
        ghost: "hover:bg-black/5 dark:hover:bg-white/10 text-foreground bg-transparent border-transparent shadow-none",
        destructive: "glass-button backdrop-blur-sm bg-black text-white border border-black hover:bg-gray-900 dark:bg-white dark:text-black dark:border-white dark:hover:bg-gray-100",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        md: "h-10 px-4 py-2",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

export const GlassButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </Comp>
    );
  }
);
GlassButton.displayName = "GlassButton";
