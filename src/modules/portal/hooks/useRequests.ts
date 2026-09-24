"use client"

import { useState, useCallback } from "react"
import { MOCK_REQUESTS, MOCK_DOCUMENTS } from "@/lib/mock/data"
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

let _requests = [...MOCK_REQUESTS]

export function useRequests(options: UseRequestsOptions = {}) {
  const filtered = _requests.filter(r =>
    options.status_filter ? r.status === options.status_filter : true
  )

  const offset = options.offset ?? 0
  const limit  = options.limit  ?? 50
  const page   = filtered.slice(offset, offset + limit)

  const [requests,  setRequests]  = useState<RequestResponse[]>(page)
  const [total,     setTotal]     = useState(filtered.length)
  const [isLoading]               = useState(false)
  const [error]                   = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const f = _requests.filter(r =>
      options.status_filter ? r.status === options.status_filter : true
    )
    setRequests(f.slice(offset, offset + limit))
    setTotal(f.length)
  }, [options.status_filter, offset, limit])

  const createRequest = useCallback(async (body: CreateRequestBody): Promise<RequestResponse> => {
    const newReq: RequestResponse = {
      id: `req-${Date.now()}`,
      customer_id: "mock-user-001",
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
    _requests = [newReq, ..._requests]
    setRequests(prev => [newReq, ...prev])
    setTotal(prev => prev + 1)
    return newReq
  }, [])

  const updateRequest = useCallback(async (
    id: string,
    body: Partial<CreateRequestBody>
  ): Promise<RequestResponse> => {
    _requests = _requests.map(r =>
      r.id === id ? { ...r, ...body, updated_at: new Date().toISOString() } : r
    )
    const updated = _requests.find(r => r.id === id)!
    setRequests(prev => prev.map(r => r.id === id ? updated : r))
    return updated
  }, [])

  return { requests, total, isLoading, error, refresh, createRequest, updateRequest }
}

export function useRequest(id: string) {
  const found = _requests.find(r => r.id === id) ?? null

  const [request, setRequest] = useState<RequestDetailResponse | null>(
    found
      ? {
          ...found,
          documents: MOCK_DOCUMENTS.filter(d => d.request_id === id),
          status_log: [
            {
              id: `log-${id}-1`,
              request_id: id,
              customer_id: "mock-user-001",
              from_status: undefined,
              to_status: "new",
              note: "تم إنشاء الطلب",
              created_at: found.created_at,
            },
            ...(found.status !== "new"
              ? [
                  {
                    id: `log-${id}-2`,
                    request_id: id,
                    customer_id: "mock-user-001",
                    from_status: "new",
                    to_status: found.status,
                    note: "تم تحديث الحالة",
                    created_at: found.updated_at,
                  },
                ]
              : []),
          ],
        }
      : null
  )
  const [isLoading] = useState(false)
  const [error]     = useState<string | null>(null)

  const refresh = useCallback(async () => {}, [])

  const applyRealtimeUpdate = useCallback((partial: Partial<RequestResponse>) => {
    setRequest(prev => prev ? { ...prev, ...partial } : prev)
  }, [])

  return { request, isLoading, error, refresh, applyRealtimeUpdate }
}
