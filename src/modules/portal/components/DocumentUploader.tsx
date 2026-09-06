"use client"

// =============================================================================
// DocumentUploader — file picker + type selector that runs the 2-step upload
// =============================================================================

import { useRef, useState } from "react"
import { UploadCloud, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label }  from "@/components/ui/label"
import { cn }     from "@/lib/utils"
import { useDocuments } from "@/modules/portal/hooks/useDocuments"
import type { DocType, DocumentResponse } from "@/modules/portal/types/portal.types"

const DOC_TYPES: { value: DocType; label: string }[] = [
  { value: "PASSPORT",         label: "Passport" },
  { value: "NATIONAL_ID",      label: "National ID" },
  { value: "PHOTO",            label: "Personal Photo" },
  { value: "BANK_STATEMENT",   label: "Bank Statement" },
  { value: "SALARY_SLIP",      label: "Salary Slip" },
  { value: "HOTEL_BOOKING",    label: "Hotel Booking" },
  { value: "FLIGHT_BOOKING",   label: "Flight Booking" },
  { value: "TRAVEL_INSURANCE", label: "Travel Insurance" },
  { value: "OTHER",            label: "Other" },
]

const ACCEPTED = ".pdf,.jpg,.jpeg,.png,.webp"
const MAX_MB   = 10

interface DocumentUploaderProps {
  requestId: string
  userId: string
  onUploaded: (doc: DocumentResponse) => void
}

export function DocumentUploader({ requestId, userId, onUploaded }: DocumentUploaderProps) {
  const fileRef                   = useRef<HTMLInputElement>(null)
  const [docType, setDocType]     = useState<DocType>("PASSPORT")
  const [file,    setFile]        = useState<File | null>(null)
  const [localError, setLocalErr] = useState<string | null>(null)
  const { isUploading, error: uploadError, uploadDocument, clearError } = useDocuments()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalErr(null)
    clearError()
    const picked = e.target.files?.[0] ?? null
    if (!picked) return
    if (picked.size > MAX_MB * 1024 * 1024) {
      setLocalErr(`File is too large. Maximum size is ${MAX_MB} MB.`)
      return
    }
    setFile(picked)
  }

  const handleUpload = async () => {
    if (!file) { setLocalErr("Please select a file first."); return }
    setLocalErr(null)
    clearError()
    try {
      const doc = await uploadDocument(requestId, userId, file, docType)
      onUploaded(doc)
      setFile(null)
      if (fileRef.current) fileRef.current.value = ""
    } catch { /* error already set in hook */ }
  }

  const combinedError = localError ?? uploadError

  return (
    <div className="space-y-4 rounded-lg border border-dashed border-border p-4 bg-muted/20">
      <h4 className="text-sm font-semibold">Upload Document</h4>

      {combinedError && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
          {combinedError}
        </div>
      )}

      {/* Doc type */}
      <div className="space-y-1.5">
        <Label htmlFor="doc_type_select">Document type</Label>
        <select
          id="doc_type_select"
          value={docType}
          onChange={e => setDocType(e.target.value as DocType)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {DOC_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* File picker */}
      <div
        className={cn(
          "relative flex flex-col items-center justify-center rounded-md border-2 border-dashed",
          "border-border bg-background cursor-pointer hover:border-brand-green/50 transition-colors py-6",
          file && "border-brand-green/50 bg-brand-green/5"
        )}
        onClick={() => fileRef.current?.click()}
        onKeyDown={e => e.key === "Enter" && fileRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Choose file"
      >
        <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
        {file ? (
          <p className="text-sm font-medium text-brand-green">{file.name}</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Click to choose a file</p>
            <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, WebP — max {MAX_MB} MB</p>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED}
          className="sr-only"
          onChange={handleFileChange}
        />
      </div>

      <Button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="w-full"
      >
        {isUploading ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading…</>
        ) : (
          "Upload"
        )}
      </Button>
    </div>
  )
}
