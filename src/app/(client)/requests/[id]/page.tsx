"use client"

import { use, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Pencil, X, Check, AlertCircle } from "lucide-react"
import { useRequest }         from "@/modules/portal/hooks/useRequests"
import { usePortalRealtime }  from "@/modules/portal/realtime/usePortalRealtime"
import { RequestTimeline }    from "@/modules/portal/components/RequestTimeline"
import { DocumentCard }       from "@/modules/portal/components/DocumentCard"
import { DocumentUploader }   from "@/modules/portal/components/DocumentUploader"
import { RequestForm }        from "@/modules/portal/components/RequestForm"
import { LoadingSpinner }     from "@/components/common/LoadingSpinner"
import { Button }             from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth }            from "@/modules/auth"
import { supabase }          from "@/lib/supabase/client"
import type { DocumentResponse, RequestResponse } from "@/modules/portal/types/portal.types"

interface PageProps { params: Promise<{ id: string }> }

export default function RequestDetailPage({ params }: PageProps) {
  const { id }    = use(params)
  const { user }  = useAuth()
  const { request, isLoading, error, refresh, applyRealtimeUpdate } = useRequest(id)
  const [editing, setEditing]     = useState(false)
  const [editLoading, setEditL]   = useState(false)
  const [editError,   setEditErr] = useState<string | null>(null)
  const [docs, setDocs] = useState<DocumentResponse[] | null>(null)

  usePortalRealtime(user?.id ?? "", {
    onRequestUpdate: applyRealtimeUpdate,
    onDocumentUpdate: (partial) => {
      setDocs(prev =>
        prev ? prev.map(d => d.id === partial.id ? { ...d, ...partial } : d) : prev
      )
    },
  })

  const documents = docs ?? request?.documents ?? []

  const handleDocUploaded = (doc: DocumentResponse) => {
    setDocs(prev => prev ? [...prev, doc] : [...(request?.documents ?? []), doc])
  }

  const handleDocDelete = async (docId: string) => {
    await supabase.deleteDocument(id, docId)
    setDocs(prev =>
      prev ? prev.filter(d => d.id !== docId) : (request?.documents ?? []).filter(d => d.id !== docId)
    )
  }

  const handleEdit = async (body: Partial<RequestResponse>) => {
    setEditL(true)
    setEditErr(null)
    try {
      await supabase.updateRequest(id, body as Parameters<typeof supabase.updateRequest>[1])
      await refresh()
      setEditing(false)
    } catch (err: unknown) {
      setEditErr((err as Error)?.message ?? "Update failed")
    } finally {
      setEditL(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center p-8">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <p className="text-muted-foreground">{error ?? "Request not found"}</p>
        <Button variant="outline" asChild><Link href="/requests">Back to requests</Link></Button>
      </div>
    )
  }

  const canEdit   = request.status === "new"
  const docRejected = documents.some(d => d.status === "rejected")

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/requests" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold truncate">
          {request.destination} — {request.request_type.charAt(0).toUpperCase() + request.request_type.slice(1)}
        </h1>
      </div>

      {docRejected && (
        <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Some documents were rejected. Please re-upload them.</span>
        </div>
      )}

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Request Details</CardTitle>
          {canEdit && !editing && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="w-4 h-4 mr-1" /> Edit
            </Button>
          )}
          {editing && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {editing ? (
            <RequestForm
              defaultValues={request}
              onSubmit={handleEdit}
              isLoading={editLoading}
              error={editError}
              submitLabel="Save Changes"
            />
          ) : (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div><dt className="text-muted-foreground">Name</dt><dd className="font-medium">{request.full_name}</dd></div>
              <div><dt className="text-muted-foreground">Type</dt><dd className="font-medium capitalize">{request.request_type}</dd></div>
              <div><dt className="text-muted-foreground">Destination</dt><dd className="font-medium">{request.destination}</dd></div>
              <div><dt className="text-muted-foreground">Travelers</dt><dd className="font-medium">{request.num_travelers}</dd></div>
              {request.travel_date && (
                <div><dt className="text-muted-foreground">Travel Date</dt><dd className="font-medium">{new Date(request.travel_date).toLocaleDateString()}</dd></div>
              )}
              {request.return_date && (
                <div><dt className="text-muted-foreground">Return Date</dt><dd className="font-medium">{new Date(request.return_date).toLocaleDateString()}</dd></div>
              )}
              {request.phone && (
                <div><dt className="text-muted-foreground">Phone</dt><dd className="font-medium">{request.phone}</dd></div>
              )}
              {request.notes && (
                <div className="col-span-2"><dt className="text-muted-foreground">Notes</dt><dd className="font-medium">{request.notes}</dd></div>
              )}
            </dl>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Documents ({documents.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {documents.length > 0 ? (
            <div className="space-y-2">
              {documents.map(doc => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  onDelete={handleDocDelete}
                  canDelete={doc.status === "uploaded"}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No documents uploaded yet</p>
          )}

          {user?.id && (
            <DocumentUploader
              requestId={id}
              userId={user.id}
              onUploaded={handleDocUploaded}
            />
          )}
        </CardContent>
      </Card>

      {request.status_log?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Status History</CardTitle>
          </CardHeader>
          <CardContent>
            <RequestTimeline log={request.status_log} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}