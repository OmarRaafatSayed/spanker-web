"use client";

// =============================================================================
// Supabase Browser Client (SSR)
// =============================================================================

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder";

/**
 * Creates a Supabase client for use in browser (Client Components).
 * Uses @supabase/ssr for proper cookie handling.
 */
export function createClient() {
  return createBrowserClient<Database>(url, key);
}

/**
 * Singleton browser client instance for use in Client Components.
 * Automatically handles cookie-based session management.
 */
export const supabase = createClient();
