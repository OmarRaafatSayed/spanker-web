"use client"

// =============================================================================
// RequestCard — compact card for listing a single travel request
// =============================================================================

import Link from "next/link"
import { Calendar, MapPin, Users, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge }             from "@/components/ui/badge"
import { cn }                from "@/lib/utils"
import type { RequestResponse, RequestStatus, RequestType } from "@/modules/portal/types/portal.types"

// ── Status helpers ─────────────────────────────────────────────────────────

const STATUS_LABELS: Record<RequestStatus, string> = {
  new:        "New",
  in_review:  "In Review",
  quoted:     "Quoted",
  booked:     "Booked",
  completed:  "Completed",
  cancelled:  "Cancelled",
}

const STATUS_COLORS: Record<RequestStatus, string> = {
  new:       "bg-blue-100 text-blue-700 border-blue-200",
  in_review: "bg-yellow-100 text-yellow-800 border-yellow-200",
  quoted:    "bg-purple-100 text-purple-700 border-purple-200",
  booked:    "bg-brand-green/10 text-brand-green border-brand-green/20",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-600 border-red-200",
}

const TYPE_LABELS: Record<RequestType, string> = {
  visa:    "✈️ Visa",
  flight:  "🛫 Flight",
  hotel:   "🏨 Hotel",
  package: "📦 Package",
}

function fmt(dateStr?: string) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString("en-EG", { day: "numeric", month: "short", year: "numeric" })
}

// ── Component ──────────────────────────────────────────────────────────────

interface RequestCardProps {
  request: RequestResponse | Partial<RequestResponse>
  compact?: boolean
}

export function RequestCard({ request, compact = false }: RequestCardProps) {
  const status   = (request.status ?? "new") as RequestStatus
  const reqType  = (request.request_type ?? "package") as RequestType

  return (
    <Link href={`/requests/${request.id}`} className="block group">
      <Card className="hover:shadow-md transition-shadow duration-200 border border-border">
        <CardContent className={cn("p-4", compact && "p-3")}>
          <div className="flex items-start justify-between gap-3">
            {/* Left */}
            <div className="flex-1 min-w-0 space-y-2">
              {/* Type + status */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {TYPE_LABELS[reqType]}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                    STATUS_COLORS[status]
                  )}
                >
                  {STATUS_LABELS[status]}
                </span>
              </div>

              {/* Name + destination */}
              <p className="font-semibold text-foreground truncate">
                {request.full_name ?? "—"}
              </p>

              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {request.destination && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {request.destination}
                  </span>
                )}
                {request.travel_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {fmt(request.travel_date)}
                  </span>
                )}
                {request.num_travelers && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {request.num_travelers} traveler{request.num_travelers > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>

            {/* Arrow */}
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-brand-green transition-colors mt-1 shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
