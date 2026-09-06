"use client"

// =============================================================================
// /requests/new — create a new travel request
// =============================================================================

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { RequestForm }  from "@/modules/portal/components/RequestForm"
import { useRequests }  from "@/modules/portal/hooks/useRequests"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CreateRequestBody } from "@/modules/portal/types/portal.types"

export default function NewRequestPage() {
  const router = useRouter()
  const { createRequest } = useRequests()
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const handleSubmit = async (body: CreateRequestBody) => {
    setIsLoading(true)
    setError(null)
    try {
      const req = await createRequest(body)
      router.push(`/requests/${req.id}`)
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Failed to create request")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/requests" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">New Request</h1>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Tell us about your trip</CardTitle>
        </CardHeader>
        <CardContent>
          <RequestForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            submitLabel="Submit Request"
          />
        </CardContent>
      </Card>
    </div>
  )
}
