"use client"

// =============================================================================
// /documents — all documents across all requests
// =============================================================================

import { useEffect, useState } from "react"
import { portalApi }        from "@/lib/portal-api/client"
import { DocumentCard }     from "@/modules/portal/components/DocumentCard"
import { LoadingSpinner }   from "@/components/common/LoadingSpinner"
import { Button }           from "@/components/ui/button"
import { AlertCircle, FolderOpen } from "lucide-react"
import type { DocumentResponse, DocStatus } from "@/modules/portal/types/portal.types"

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "",             label: "All" },
  { value: "uploaded",     label: "Uploaded" },
  { value: "under_review", label: "Under Review" },
  { value: "approved",     label: "Approved" },
  { value: "rejected",     label: "Rejected" },
  { value: "expired",      label: "Expired" },
]

export default function DocumentsPage() {
  const [allDocs,    setAllDocs]    = useState<DocumentResponse[]>([])
  const [isLoading,  setIsLoading]  = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [filter,     setFilter]     = useState<string>("")

  const load = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Documents live on requests — fetch all requests then aggregate their docs
      // The simplest approach: get the dashboard (has request count) then
      // fetch requests with large limit to collect all documents.
      const { requests } = await portalApi.listRequests({ limit: 100 })
      const details = await Promise.all(requests.map(r => portalApi.getRequest(r.id)))
      const docs = details.flatMap(d => d.documents ?? [])
      // Deduplicate by id
      const unique = docs.filter((d, i, arr) => arr.findIndex(x => x.id === d.id) === i)
      setAllDocs(unique)
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Failed to load documents")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = filter
    ? allDocs.filter(d => d.status === filter)
    : allDocs

  const handleDelete = async (docId: string) => {
    // Find the request that owns this doc
    const doc = allDocs.find(d => d.id === docId)
    if (!doc?.request_id) return
    await portalApi.deleteDocument(doc.request_id, docId)
    setAllDocs(prev => prev.filter(d => d.id !== docId))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Documents</h1>
        {!isLoading && (
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} document{filtered.length !== 1 ? "s" : ""}
            {filter ? ` · ${filter}` : ""}
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filter === f.value
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
          <Button variant="outline" onClick={load}>Retry</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            {filter ? `No ${filter} documents` : "No documents uploaded yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(doc => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onDelete={handleDelete}
              canDelete={doc.status === "uploaded"}
            />
          ))}
        </div>
      )}
    </div>
  )
}
