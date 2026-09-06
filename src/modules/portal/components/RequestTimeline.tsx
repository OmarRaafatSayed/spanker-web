"use client"

// =============================================================================
// RequestTimeline — vertical status history log for a request detail page
// =============================================================================

import { CheckCircle2, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { StatusLogEntry, RequestStatus } from "@/modules/portal/types/portal.types"

const STATUS_COLORS: Record<RequestStatus | string, string> = {
  new:       "bg-blue-500",
  in_review: "bg-yellow-500",
  quoted:    "bg-purple-500",
  booked:    "bg-brand-green",
  completed: "bg-green-600",
  cancelled: "bg-red-500",
}

const STATUS_LABELS: Record<RequestStatus | string, string> = {
  new:       "Request Created",
  in_review: "Under Review",
  quoted:    "Quote Ready",
  booked:    "Booking Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-EG", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

interface RequestTimelineProps {
  log: StatusLogEntry[]
}

export function RequestTimeline({ log }: RequestTimelineProps) {
  if (!log?.length) return null

  const sorted = [...log].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[15px] top-4 bottom-4 w-px bg-border" aria-hidden />

      <ol className="space-y-6">
        {sorted.map((entry, idx) => {
          const isLast  = idx === sorted.length - 1
          const dotColor = STATUS_COLORS[entry.to_status] ?? "bg-gray-400"

          return (
            <li key={entry.id} className="relative flex gap-4 pl-10">
              {/* Dot */}
              <span
                className={cn(
                  "absolute left-0 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-background",
                  dotColor
                )}
                aria-hidden
              >
                {isLast
                  ? <CheckCircle2 className="h-4 w-4 text-white" />
                  : <Clock className="h-4 w-4 text-white" />
                }
              </span>

              {/* Content */}
              <div className="flex-1 pt-1 space-y-0.5">
                <p className="font-medium text-sm leading-none">
                  {STATUS_LABELS[entry.to_status] ?? entry.to_status}
                </p>
                {entry.note && (
                  <p className="text-sm text-muted-foreground">{entry.note}</p>
                )}
                <p className="text-xs text-muted-foreground">{fmt(entry.created_at)}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
