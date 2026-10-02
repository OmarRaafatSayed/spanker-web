"use client"

import { useCallback, useState } from "react"
import type { DocumentResponse, DocType } from "@/modules/portal/types/portal.types"

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
      // Build FormData for multipart/form-data upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('request_id', requestId)
      formData.append('doc_type', docType)

      // POST to /api/v1/documents/upload
      const response = await fetch('/api/v1/documents/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }))
        throw new Error(errorData.message || `Upload failed with status ${response.status}`)
      }

      const result = await response.json()

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Upload failed')
      }

      return result.data as DocumentResponse
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
      // DELETE to /api/v1/documents/[id]
      const response = await fetch(`/api/v1/documents/${docId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Delete failed' }))
        throw new Error(errorData.message || `Delete failed with status ${response.status}`)
      }

      // 204 No Content returns empty body — no need to parse JSON
    } catch (err: unknown) {
      const msg = (err as Error)?.message ?? "Delete failed"
      setError(msg)
      throw new Error(msg)
    }
  }, [])

  return {
    isUploading,
    error,
    uploadDocument,
    deleteDocument,
    clearError: () => setError(null),
  }
}
