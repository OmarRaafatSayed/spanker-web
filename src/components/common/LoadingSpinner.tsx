// =============================================================================
// LoadingSpinner
// =============================================================================

import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
  label?: string
}

const SIZES = { sm: "w-5 h-5 border-2", md: "w-8 h-8 border-4", lg: "w-12 h-12 border-4" }

export function LoadingSpinner({ size = "md", className, label = "Loading…" }: LoadingSpinnerProps) {
  return (
    <div role="status" className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <div
        className={cn(
          "rounded-full border-brand-green border-t-transparent animate-spin",
          SIZES[size]
        )}
        aria-hidden
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}

export function FullPageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoadingSpinner size="lg" />
    </div>
  )
}
