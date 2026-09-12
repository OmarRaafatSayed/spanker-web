"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      let query = supabase
        .from("travel_requests")
        .select("*", { count: "exact" })
        .eq("client_user_id", user.id)
        .order("created_at", { ascending: false })

      if (options.status_filter) query = query.eq("booking_status", options.status_filter)
      if (options.limit) query = query.limit(options.limit)
      if (options.offset) query = query.range(options.offset, options.offset + (options.limit ?? 10) - 1)

      const { data, count, error: qErr } = await query
      if (qErr) throw qErr

      setRequests((data as unknown as RequestResponse[]) ?? [])
      setTotal(count ?? 0)
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Failed to load requests")
    } finally {
      setIsLoading(false)
    }
  }, [options.status_filter, options.limit, options.offset]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const createRequest = useCallback(async (body: CreateRequestBody) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")
    const { data, error } = await supabase
      .from("travel_requests")
      .insert({ ...(body as unknown as Record<string, unknown>), client_user_id: user.id } as never)
      .select()
      .single()
    if (error) throw error
    const req = data as unknown as RequestResponse
    setRequests(prev => [req, ...prev])
    setTotal(prev => prev + 1)
    return req
  }, [])

  const updateRequest = useCallback(async (id: string, body: Partial<CreateRequestBody>) => {
    const { data, error } = await supabase
      .from("travel_requests")
      .update(body as never)
      .eq("id", id)
      .select()
      .single()
    if (error) throw error
    const updated = data as unknown as RequestResponse
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
      const { data, error: qErr } = await supabase
        .from("travel_requests")
        .select("*")
        .eq("id", id)
        .single()
      if (qErr) throw qErr
      setRequest(data as unknown as RequestDetailResponse)
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Failed to load request")
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => { fetchRequest() }, [fetchRequest])

  const applyRealtimeUpdate = useCallback((partial: Partial<RequestResponse>) => {
    setRequest(prev => prev ? { ...prev, ...partial } : prev)
  }, [])

  return { request, isLoading, error, refresh: fetchRequest, applyRealtimeUpdate }
}
