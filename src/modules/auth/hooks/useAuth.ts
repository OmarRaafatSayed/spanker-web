"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  getMockUser,
  mockSignIn,
  mockSignUp,
  mockSignOut,
  mockOnAuthStateChange,
  type MockUser,
} from "@/lib/mock/auth"

const MOCK_SESSION = {
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  expires_at: Math.floor(Date.now() / 1000) + 3600,
}

export function useAuth() {
  const [user, setUser]       = useState<MockUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router                = useRouter()

  useEffect(() => {
    setUser(getMockUser())
    setLoading(false)

    const { data: { subscription } } = mockOnAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data } = await mockSignIn(email, password)
    setUser(data.user)
    return { user: data.user, session: MOCK_SESSION }
  }

  const signUp = async (email: string, password: string, _metadata?: Record<string, string>) => {
    const { data } = await mockSignUp(email, password)
    setUser(data.user)
    // Return session so callers that destructure { session } work without errors
    return { user: data.user, session: MOCK_SESSION }
  }

  const signOut = async () => {
    await mockSignOut()
    setUser(null)
    router.push("/login")
  }

  return {
    user,
    loading,
    isLoading: loading,
    signIn,
    signUp,
    signOut,
    logout: signOut,
  }
}