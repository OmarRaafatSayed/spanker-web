// =============================================================================
// authService.ts — Supabase Auth calls for the customer portal
// =============================================================================

import { supabase } from "@/lib/supabase/client"
import type { AuthUser, AuthResult } from "@/modules/auth/types/auth.types"

export const authService = {
  /**
   * Sign in with email + password via Supabase Auth.
   * Returns AuthResult on success; throws on failure.
   */
  async login(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    if (!data.session || !data.user) throw new Error("Login failed — no session returned")

    const user: AuthUser = {
      id: data.user.id,
      email: data.user.email ?? email,
      first_name: (data.user.user_metadata?.first_name as string) ?? undefined,
      last_name:  (data.user.user_metadata?.last_name  as string) ?? undefined,
      phone:      (data.user.user_metadata?.phone       as string) ?? undefined,
    }

    return {
      user,
      session: {
        access_token:  data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at:    data.session.expires_at,
      },
    }
  },

  /**
   * Create a new account via Supabase Auth.
   * email_confirmation_required is true when the Supabase project requires it.
   */
  async register(
    email: string,
    password: string,
    first_name: string,
    last_name: string,
    phone?: string,
  ): Promise<AuthResult & { email_confirmation_required?: boolean }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name, last_name, phone } },
    })
    if (error) throw new Error(error.message)
    if (!data.user) throw new Error("Registration failed")

    // Email confirmation required — no session yet
    if (!data.session) {
      return {
        email_confirmation_required: true,
        user: { id: data.user.id, email, first_name, last_name, phone },
        session: { access_token: "" },
      }
    }

    const user: AuthUser = { id: data.user.id, email, first_name, last_name, phone }
    return {
      user,
      session: {
        access_token:  data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at:    data.session.expires_at,
      },
    }
  },

  async logout(): Promise<void> {
    await supabase.auth.signOut()
  },

  async getSession() {
    const { data } = await supabase.auth.getSession()
    return data.session
  },

  /** Subscribe to auth state changes. Returns the unsubscribe function. */
  onAuthStateChange(callback: (event: string, session: unknown) => void) {
    const { data } = supabase.auth.onAuthStateChange(callback)
    return () => data.subscription.unsubscribe()
  },
}
