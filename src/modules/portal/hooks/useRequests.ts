"use client"

import { useEffect, useState, useCallback } from "react"
import { portalApi } from "@/lib/portal-api/client"
import type {
  RequestResponse,
  RequestDetailResponse,
  CreateRequestBody,
} from "@/modules/portal/types/portal.types"

interface UseRequestsOptions {
  status_filter?: string
  limit?: number
  offset?: number
}

export function useRequests(options: UseRequestsOptions = {}) {
  const [requests,  setRequests]  = useState<RequestResponse[]>([])
  const [total,     setTotal]     = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  const fetchRequests = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await portalApi.listRequests(options)
      setRequests(res.requests)
      setTotal(res.total)
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Failed to load requests")
    } finally {
      setIsLoading(false)
    }
  }, [options.status_filter, options.limit, options.offset]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const createRequest = useCallback(async (body: CreateRequestBody) => {
    const req = await portalApi.createRequest(body)
    setRequests(prev => [req, ...prev])
    setTotal(prev => prev + 1)
    return req
  }, [])

  const updateRequest = useCallback(async (id: string, body: Partial<CreateRequestBody>) => {
    const updated = await portalApi.updateRequest(id, body)
    setRequests(prev => prev.map(r => r.id === id ? updated : r))
    return updated
  }, [])

  return { requests, total, isLoading, error, refresh: fetchRequests, createRequest, updateRequest }
}

export function useRequest(id: string) {
  const [request,   setRequest]   = useState<RequestDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  const fetchRequest = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await portalApi.getRequest(id)
      setRequest(res)
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Failed to load request")
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => { fetchRequest() }, [fetchRequest])

  /** Merge partial realtime update into local state */
  const applyRealtimeUpdate = useCallback((partial: Partial<RequestResponse>) => {
    setRequest(prev => prev ? { ...prev, ...partial } : prev)
  }, [])

  return { request, isLoading, error, refresh: fetchRequest, applyRealtimeUpdate }
}
