"use client"

// =============================================================================
// /requests — list all customer requests
// =============================================================================

import { useState } from "react"
import Link from "next/link"
import { useRequests }    from "@/modules/portal/hooks/useRequests"
import { RequestCard }    from "@/modules/portal/components/RequestCard"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { Button }         from "@/components/ui/button"
import { AlertCircle, FileText } from "lucide-react"
import type { RequestStatus } from "@/modules/portal/types/portal.types"

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "",           label: "All" },
  { value: "new",        label: "New" },
  { value: "in_review",  label: "In Review" },
  { value: "quoted",     label: "Quoted" },
  { value: "booked",     label: "Booked" },
  { value: "completed",  label: "Completed" },
  { value: "cancelled",  label: "Cancelled" },
]

export default function RequestsPage() {
  const [statusFilter, setStatusFilter] = useState("")
  const { requests, total, isLoading, error, refresh } = useRequests({
    status_filter: statusFilter || undefined,
    limit: 20,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Requests</h1>
          {!isLoading && <p className="text-sm text-muted-foreground">{total} request{total !== 1 ? "s" : ""} total</p>}
        </div>
        <Button asChild>
          <Link href="/requests/new">+ New Request</Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              statusFilter === f.value
                ? "bg-brand-green text-white border-brand-green"
                : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-brand-green/50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* States */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <AlertCircle className="w-10 h-10 text-destructive" />
          <p className="text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={refresh}>Retry</Button>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            {statusFilter ? `No ${statusFilter} requests` : "No requests yet"}
          </p>
          {!statusFilter && (
            <Button asChild><Link href="/requests/new">Create your first request</Link></Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <RequestCard key={req.id} request={req} />
          ))}
        </div>
      )}
    </div>
  )
}
