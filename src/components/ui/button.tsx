// =============================================================================
// Button Component - Luxury Design System
// =============================================================================

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background relative overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-brand-green text-white hover:bg-brand-green-dark shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md hover:shadow-lg transition-all duration-300",
        outline:
          "border border-border-luxury bg-background hover:bg-accent hover:text-accent-foreground shadow-sm hover:shadow-md transition-all duration-300",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm hover:shadow-md transition-all duration-300",
        ghost: "hover:bg-accent hover:text-accent-foreground transition-colors duration-200",
        link: "text-primary underline-offset-4 hover:underline transition-colors duration-200",
        luxury: "bg-[linear-gradient(135deg,#1b4332_0%,#2d6a4f_50%,#52b788_100%)] text-white shadow-md hover:shadow-lg transform hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300",
        glass: "glass-card text-text-luxury hover:glass-panel transform hover:-translate-y-1 transition-all duration-300",
        glow: "bg-brand-green text-white shadow-glow hover:shadow-glow-strong hover:animate-glow-pulse transition-all duration-300",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
        xl: "h-12 px-10 rounded-lg text-base font-semibold",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  withShimmer?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, withShimmer = false, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {(variant === "luxury" || variant === "glow" || withShimmer) && (
          <div className="absolute inset-0 bg-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-shimmer" />
        )}
        <span className="relative z-10">{children}</span>
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }