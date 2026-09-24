"use client"

import { useCallback, useState } from "react"
import { MOCK_DOCUMENTS } from "@/lib/mock/data"
import type { DocumentResponse, DocType } from "@/modules/portal/types/portal.types"

let _documents = [...MOCK_DOCUMENTS]

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

    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 800))

    try {
      const newDoc: DocumentResponse = {
        id: `doc-${Date.now()}`,
        customer_id: userId,
        request_id: requestId,
        doc_type: docType,
        file_url: URL.createObjectURL(file),
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        status: "uploaded",
        created_at: new Date().toISOString(),
      }
      _documents = [newDoc, ..._documents]
      return newDoc
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
    await new Promise(resolve => setTimeout(resolve, 400))
    _documents = _documents.filter(d => d.id !== docId)
  }, [])

  return {
    isUploading,
    error,
    uploadDocument,
    deleteDocument,
    clearError: () => setError(null),
  }
}
