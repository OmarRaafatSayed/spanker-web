"use client"

// =============================================================================
// DocumentCard — displays a single uploaded document with status + actions
// =============================================================================

import { FileText, Trash2, ExternalLink, AlertCircle } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn }     from "@/lib/utils"
import type { DocumentResponse, DocStatus } from "@/modules/portal/types/portal.types"

const STATUS_LABELS: Record<DocStatus, string> = {
  uploaded:     "Uploaded",
  under_review: "Under Review",
  approved:     "Approved",
  rejected:     "Rejected",
  expired:      "Expired",
}

const STATUS_COLORS: Record<DocStatus, string> = {
  uploaded:     "bg-blue-100 text-blue-700 border-blue-200",
  under_review: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved:     "bg-green-100 text-green-700 border-green-200",
  rejected:     "bg-red-100 text-red-600 border-red-200",
  expired:      "bg-gray-100 text-gray-600 border-gray-200",
}

const DOC_TYPE_LABELS: Record<string, string> = {
  PASSPORT:         "Passport",
  NATIONAL_ID:      "National ID",
  PHOTO:            "Photo",
  BANK_STATEMENT:   "Bank Statement",
  SALARY_SLIP:      "Salary Slip",
  HOTEL_BOOKING:    "Hotel Booking",
  FLIGHT_BOOKING:   "Flight Booking",
  TRAVEL_INSURANCE: "Travel Insurance",
  OTHER:            "Other Document",
}

function fmtSize(bytes?: number) {
  if (!bytes) return null
  if (bytes < 1024)       return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface DocumentCardProps {
  doc: DocumentResponse
  onDelete?: (docId: string) => Promise<void>
  /** Only allow deletion while doc status is "uploaded" */
  canDelete?: boolean
}

export function DocumentCard({ doc, onDelete, canDelete }: DocumentCardProps) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!onDelete) return
    setDeleting(true)
    try { await onDelete(doc.id) }
    finally { setDeleting(false) }
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 hover:bg-muted/30 transition-colors">
      {/* Icon */}
      <div className="shrink-0 w-9 h-9 rounded-md bg-brand-green/10 flex items-center justify-center">
        <FileText className="w-4 h-4 text-brand-green" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium truncate">
            {DOC_TYPE_LABELS[doc.doc_type] ?? doc.doc_type}
          </p>
          <span className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            STATUS_COLORS[doc.status]
          )}>
            {STATUS_LABELS[doc.status]}
          </span>
        </div>

        <p className="text-xs text-muted-foreground truncate">{doc.file_name}</p>

        {fmtSize(doc.file_size) && (
          <p className="text-xs text-muted-foreground">{fmtSize(doc.file_size)}</p>
        )}

        {/* Staff rejection notes — always show */}
        {doc.status === "rejected" && doc.staff_notes && (
          <div className="flex items-start gap-1.5 rounded-md bg-red-50 border border-red-200 px-2.5 py-2 mt-1">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
            <p className="text-xs text-red-700">{doc.staff_notes}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="shrink-0 flex items-center gap-1">
        <a
          href={doc.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="View document"
        >
          <ExternalLink className="w-4 h-4" />
        </a>

        {canDelete && onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
            onClick={handleDelete}
            disabled={deleting}
            aria-label="Delete document"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
