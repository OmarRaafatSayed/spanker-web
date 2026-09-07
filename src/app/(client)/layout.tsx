"use client"

// =============================================================================
// (client) route group layout
// Guards all child routes and wraps them with the portal Navbar + Footer.
// Redirect to /login if no Supabase session.
// =============================================================================

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase }     from "@/lib/supabase/client"
import { PortalNavbar } from "@/components/layout/PortalNavbar"
import { PortalFooter } from "@/components/layout/PortalFooter"
import { FullPageSpinner } from "@/components/common/LoadingSpinner"
import { ErrorBoundary } from "@/components/common/ErrorBoundary"

/** Profile setup is inside (client) but must be accessible before profile exists */
const SETUP_PATH = "/profile/setup"

export default function ClientGroupLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
      } else {
        setChecking(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.replace("/login")
      }
    })

    return () => subscription.unsubscribe()
  }, [router, pathname])

  if (checking) return <FullPageSpinner />

  // Profile setup page — no Navbar/Footer to keep the focus
  if (pathname === SETUP_PATH) {
    return <ErrorBoundary>{children}</ErrorBoundary>
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-background">
        <PortalNavbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          {children}
        </main>
        <PortalFooter />
      </div>
    </ErrorBoundary>
  )
}
