// =============================================================================
// Supabase Server Client (for Server Components / Route Handlers)
// =============================================================================

import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "https://placeholder.supabase.co"
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder"

/**
 * Creates a fresh server-side Supabase client.
 * Call this inside Server Components and API Route Handlers.
 * Pass the Bearer token if you need to act as a specific user.
 */
export function createServerClient(accessToken?: string) {
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  })
}
