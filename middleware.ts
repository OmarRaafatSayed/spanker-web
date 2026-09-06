// =============================================================================
// middleware.ts — route protection for customer portal (client) routes
// =============================================================================

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/** Routes that belong to the customer portal and need an authenticated session */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/requests",
  "/documents",
  "/notifications",
  "/profile",
]

/** Public auth pages — redirect away if already logged in */
const AUTH_PAGES = ["/login", "/register"]

function getTokenFromRequest(req: NextRequest): string | null {
  // Supabase stores the session in a cookie named sb-<ref>-auth-token
  // We check for any cookie whose name starts with "sb-" and contains "auth-token"
  for (const [name, cookie] of req.cookies) {
    if (name.startsWith("sb-") && name.endsWith("-auth-token")) {
      try {
        const parsed = JSON.parse(decodeURIComponent(cookie.value))
        return (parsed as { access_token?: string })?.access_token ?? null
      } catch {
        return cookie.value // raw token fallback
      }
    }
  }
  // Also check Authorization header (for API routes / SSR)
  const auth = req.headers.get("authorization")
  if (auth?.startsWith("Bearer ")) return auth.slice(7)
  return null
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = getTokenFromRequest(req)

  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p))
  const isAuthPage  = AUTH_PAGES.some(p => pathname.startsWith(p))

  if (isProtected && !token) {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  if (isAuthPage && token) {
    const url = req.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/requests/:path*",
    "/documents/:path*",
    "/notifications/:path*",
    "/profile/:path*",
    "/login",
    "/register",
  ],
}
