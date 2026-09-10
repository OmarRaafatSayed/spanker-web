"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../lib/client"

interface User {
  id: string
  email: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email! } : null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email! } : null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    setUser({ id: data.user.id, email: data.user.email! })
    return data
  }

  const signUp = async (email: string, password: string, metadata?: Record<string, string>) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push("/login")
  }

  return { user, loading, signIn, signUp, signOut }
}