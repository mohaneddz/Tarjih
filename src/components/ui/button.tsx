import React from "react";
import { cn } from "@/utils/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

/**
 * Premium Button component styled for the Tarjih academic/legal layout.
 * Maps variants to brand-green, brand-gold, and warm-border styles.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-full font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-brand-green/30 active:scale-95 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
          // Variants
          {
            "bg-brand-green text-white hover:bg-brand-green-dark shadow-sm hover:shadow-md":
              variant === "primary",
            "bg-brand-gold-light text-brand-gold hover:bg-brand-gold/15":
              variant === "secondary",
            "border border-border-warm bg-transparent text-text-primary hover:bg-[#FAF6F0] hover:border-brand-gold/40 hover:text-brand-gold":
              variant === "outline",
            "bg-transparent text-text-secondary hover:bg-brand-gold-light hover:text-brand-gold":
              variant === "ghost",
          },
          // Sizes
          {
            "h-9 px-4 text-xs": size === "sm",
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
