"use client"

// =============================================================================
// useAuth — portal-specific auth hook backed by Supabase + portalApi
// =============================================================================

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/modules/auth/services/authService"
import { portalApi } from "@/lib/portal-api/client"
import { useAuthStore } from "@/modules/auth/store/authStore"
import type { LoginCredentials, RegisterCredentials } from "@/modules/auth/types/auth.types"

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const router = useRouter()
  const { user, profile, setUser, setProfile, logout: storeLogout } = useAuthStore()

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async ({ email, password }: LoginCredentials) => {
    setIsLoading(true)
    setError(null)
    try {
      const { user: authUser } = await authService.login(email, password)
      setUser({ id: authUser.id, email: authUser.email, role: "customer", created_at: "", updated_at: "" })

      // Check if profile exists → if not, go to setup
      try {
        const p = await portalApi.getProfile()
        setProfile({
          id: p.id,
          user_id: p.user_id,
          full_name: [p.first_name, p.last_name].filter(Boolean).join(" "),
          phone: p.phone ?? "",
          role: (p.role as "admin" | "staff" | "customer") ?? "customer",
          created_at: p.created_at ?? "",
          updated_at: p.updated_at ?? "",
        })
        router.replace("/dashboard")
      } catch (profileErr: unknown) {
        // 404 / "Not authenticated" before profile exists
        const msg = (profileErr as Error)?.message ?? ""
        if (msg.includes("404") || msg.includes("not found") || msg.toLowerCase().includes("no profile")) {
          router.replace("/profile/setup")
        } else {
          // Profile fetch failed for another reason — still send to dashboard
          router.replace("/dashboard")
        }
      }
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Login failed")
    } finally {
      setIsLoading(false)
    }
  }, [router, setUser, setProfile])

  // ── Register ───────────────────────────────────────────────────────────────
  const register = useCallback(async ({ email, password, first_name, last_name, phone }: RegisterCredentials) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await authService.register(email, password, first_name, last_name, phone)
      if (result.email_confirmation_required) {
        return { email_confirmation_required: true }
      }
      setUser({ id: result.user.id, email: result.user.email, role: "customer", created_at: "", updated_at: "" })
      router.replace("/profile/setup")
      return { email_confirmation_required: false }
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Registration failed")
      return { email_confirmation_required: false }
    } finally {
      setIsLoading(false)
    }
  }, [router, setUser])

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await authService.logout()
    storeLogout()
    router.replace("/login")
  }, [router, storeLogout])

  return { user, profile, isLoading, error, login, register, logout, clearError: () => setError(null) }
}
