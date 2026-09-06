"use client"

// =============================================================================
// useSession — reactive Supabase session watcher
// =============================================================================

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import type { Session } from "@supabase/supabase-js"

export function useSession() {
  const [session, setSession]   = useState<Session | null>(null)
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { session, isLoading, userId: session?.user.id ?? null }
}
