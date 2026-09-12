"use client"

import { useCallback, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import type { DocumentResponse, DocType } from "@/modules/portal/types/portal.types"

const BUCKET = "portal-documents"

export function useDocuments() {
  const [isUploading, setIsUploading] = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const uploadDocument = useCallback(async (
    requestId: string,
    userId:    string,
    file:      File,
    docType:   DocType,
  ): Promise<DocumentResponse> => {
    setIsUploading(true)
    setError(null)
    try {
      const path = `${userId}/${Date.now()}_${file.name}`
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file)
      if (uploadError) throw new Error(uploadError.message)

      const { data: signedData } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, 31_536_000)
      if (!signedData?.signedUrl) throw new Error("Failed to generate signed URL")

      const { data: doc, error: insertErr } = await supabase
        .from("portal_documents")
        .insert({
          customer_id: userId,
          request_id: requestId,
          doc_type: docType,
          file_url: signedData.signedUrl,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          status: "uploaded",
        })
        .select()
        .single()
      if (insertErr) throw new Error(insertErr.message)
      return doc as unknown as DocumentResponse
    } catch (err: unknown) {
      const msg = (err as Error)?.message ?? "Upload failed"
      setError(msg)
      throw new Error(msg)
    } finally {
      setIsUploading(false)
    }
  }, [])

  const deleteDocument = useCallback(async (_requestId: string, docId: string) => {
    setError(null)
    try {
      const { error } = await supabase.from("portal_documents").delete().eq("id", docId)
      if (error) throw new Error(error.message)
    } catch (err: unknown) {
      const msg = (err as Error)?.message ?? "Delete failed"
      setError(msg)
      throw new Error(msg)
    }
  }, [])

  return { isUploading, error, uploadDocument, deleteDocument, clearError: () => setError(null) }
}
