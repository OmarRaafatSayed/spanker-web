"use client"

import { useCallback, useState } from "react"
import { supabase }   from "@/lib/supabase/client"
import { portalApi }  from "@/lib/portal-api/client"
import type { DocumentResponse, DocType } from "@/modules/portal/types/portal.types"

const BUCKET = "portal-documents"

export function useDocuments() {
  const [isUploading, setIsUploading] = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  /**
   * Full 2-step upload:
   * 1. Upload file to Supabase Storage under {userId}/{timestamp}_{filename}
   * 2. Register the document with the backend
   */
  const uploadDocument = useCallback(async (
    requestId: string,
    userId:    string,
    file:      File,
    docType:   DocType,
  ): Promise<DocumentResponse> => {
    setIsUploading(true)
    setError(null)
    try {
      // Step 1 — Supabase Storage
      const path = `${userId}/${Date.now()}_${file.name}`
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file)
      if (uploadError) throw new Error(uploadError.message)

      const { data: signedData } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, 31_536_000) // 1 year
      if (!signedData?.signedUrl) throw new Error("Failed to generate signed URL")

      // Step 2 — Register with FastAPI backend
      const doc = await portalApi.registerDocument(requestId, {
        doc_type:  docType,
        file_url:  signedData.signedUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      })
      return doc
    } catch (err: unknown) {
      const msg = (err as Error)?.message ?? "Upload failed"
      setError(msg)
      throw new Error(msg)
    } finally {
      setIsUploading(false)
    }
  }, [])

  const deleteDocument = useCallback(async (requestId: string, docId: string) => {
    setError(null)
    try {
      await portalApi.deleteDocument(requestId, docId)
    } catch (err: unknown) {
      const msg = (err as Error)?.message ?? "Delete failed"
      setError(msg)
      throw new Error(msg)
    }
  }, [])

  return { isUploading, error, uploadDocument, deleteDocument, clearError: () => setError(null) }
}
