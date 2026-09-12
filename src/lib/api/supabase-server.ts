/**
 * Supabase Server Client for API Routes
 * 
 * Creates authenticated Supabase client for use in Next.js API routes
 * Uses cookies for session management
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

/**
 * Create Supabase client for API routes
 * Automatically handles cookie-based auth
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle cookies() error in Server Components
            // This happens when called from a Server Component during initial render
            console.warn('Failed to set cookie:', name);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            console.warn('Failed to remove cookie:', name);
          }
        },
      },
    }
  );
}

/**
 * Create Supabase admin client (bypasses RLS)
 * Use ONLY for admin operations where RLS should be bypassed
 * Requires SUPABASE_SERVICE_ROLE_KEY environment variable
 */
export async function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin client');
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, serviceRoleKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch (error) {
          console.warn('Failed to set cookie:', name);
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch (error) {
          console.warn('Failed to remove cookie:', name);
        }
      },
    },
  });
}

