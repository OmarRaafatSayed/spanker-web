"use client"

// =============================================================================
// ErrorBoundary — React class-based error boundary
// =============================================================================

import { Component, type ReactNode } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary]", error, info)
  }

  reset = () => this.setState({ hasError: false, error: null })

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              {this.state.error?.message ?? "An unexpected error occurred"}
            </p>
          </div>
          <Button variant="outline" onClick={this.reset}>Try again</Button>
        </div>
      )
    }
    return this.props.children
  }
}
