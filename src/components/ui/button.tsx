import React from "react";
import { cn } from "@/utils/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

/**
 * Button component for the Tarjih editorial/legal layout.
 * Primary is the brand-red accent; brand-green is reserved for
 * authenticity/success meaning elsewhere in the app, not for buttons.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-brand-red/30 active:scale-95 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
          // Variants
          {
            "bg-brand-red text-white hover:bg-brand-red-dark shadow-sm hover:shadow-md":
              variant === "primary",
            "bg-brand-red-light text-brand-red hover:bg-brand-red/15":
              variant === "secondary",
            "border border-border-warm bg-transparent text-text-primary hover:bg-brand-red-light hover:border-brand-red/40 hover:text-brand-red":
              variant === "outline",
            "bg-transparent text-text-secondary hover:bg-brand-red-light hover:text-brand-red":
              variant === "ghost",
          },
          // Sizes
          {
            "h-9 px-4 text-sm": size === "sm",
            "h-11 px-6 text-sm": size === "md",
            "h-12 px-8 text-base": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
