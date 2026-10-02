"use client"

import { useState, useCallback, useEffect } from "react"
import type {
  RequestResponse,
  RequestDetailResponse,
  CreateRequestBody,
} from "@/modules/portal/types/portal.types"

interface UseRequestsOptions {
  status_filter?: string
  limit?: number
  page?: number
}

export function useRequests(options: UseRequestsOptions = {}) {
  const { status_filter, page = 1, limit = 10 } = options

  const [requests,  setRequests]  = useState<RequestResponse[]>([])
  const [total,     setTotal]     = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  const fetchRequests = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (status_filter) params.set("status_filter", status_filter)
      params.set("page",  String(page))
      params.set("limit", String(limit))

      const res = await fetch(`/api/v1/travel-requests?${params.toString()}`)
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json?.error ?? `Request failed with status ${res.status}`)
      }
      const json = await res.json()
      setRequests(json.data ?? [])
      setTotal(json.meta?.total ?? json.data?.length ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load requests")
    } finally {
      setIsLoading(false)
    }
  }, [status_filter, page, limit])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const refresh = useCallback(async () => {
    await fetchRequests()
  }, [fetchRequests])

  const createRequest = useCallback(async (body: CreateRequestBody): Promise<RequestResponse> => {
    // Build optimistic record
    const optimisticId = `optimistic-${Date.now()}`
    const optimistic: RequestResponse = {
      id: optimisticId,
      customer_id: "",
      full_name: body.full_name,
      phone: body.phone,
      email: undefined,
      request_type: body.request_type,
      destination: body.destination,
      travel_date: body.travel_date,
      return_date: body.return_date,
      num_travelers: body.num_travelers ?? 1,
      notes: body.notes,
      status: "new",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Optimistic prepend
    setRequests(prev => [optimistic, ...prev])
    setTotal(prev => prev + 1)

    try {
      const res = await fetch("/api/v1/travel-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json?.error ?? `Create failed with status ${res.status}`)
      }

      const json = await res.json()
      const created: RequestResponse = json.data

      // Replace optimistic record with real record
      setRequests(prev => prev.map(r => r.id === optimisticId ? created : r))
      return created
    } catch (err) {
      // Revert optimistic update
      setRequests(prev => prev.filter(r => r.id !== optimisticId))
      setTotal(prev => prev - 1)
      const message = err instanceof Error ? err.message : "Failed to create request"
      setError(message)
      throw err
    }
  }, [])

  const updateRequest = useCallback(async (
    id: string,
    body: Partial<CreateRequestBody>
  ): Promise<RequestResponse> => {
    // Capture current state for revert
    let previousRecord: RequestResponse | undefined

    // Optimistic update
    setRequests(prev => prev.map(r => {
      if (r.id === id) {
        previousRecord = r
        return { ...r, ...body, updated_at: new Date().toISOString() }
      }
      return r
    }))

    try {
      const res = await fetch(`/api/v1/travel-requests/${id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json?.error ?? `Update failed with status ${res.status}`)
      }

      const json = await res.json()
      const updated: RequestResponse = json.data

      // Replace with server-confirmed record
      setRequests(prev => prev.map(r => r.id === id ? updated : r))
      return updated
    } catch (err) {
      // Revert to previous record if we captured it
      if (previousRecord) {
        const snapshot = previousRecord
        setRequests(prev => prev.map(r => r.id === id ? snapshot : r))
      }
      const message = err instanceof Error ? err.message : "Failed to update request"
      setError(message)
      throw err
    }
  }, [])

  return { requests, total, isLoading, error, refresh, createRequest, updateRequest }
}

export function useRequest(id: string) {
  const [request,   setRequest]   = useState<RequestDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  const fetchRequest = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/travel-requests/${id}`)
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json?.error ?? `Request failed with status ${res.status}`)
      }
      const json = await res.json()
      setRequest(json.data ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load request")
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchRequest()
  }, [fetchRequest])

  const refresh = useCallback(async () => {
    await fetchRequest()
  }, [fetchRequest])

  const applyRealtimeUpdate = useCallback((partial: Partial<RequestResponse>) => {
    setRequest(prev => prev ? { ...prev, ...partial } : prev)
  }, [])

  return { request, isLoading, error, refresh, applyRealtimeUpdate }
}
