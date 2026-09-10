"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/modules/auth"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { FullPageSpinner } from "@/components/common/LoadingSpinner"
import { ErrorBoundary } from "@/components/common/ErrorBoundary"
import { I18nProvider } from "@/lib/i18n/context"
import { BottomNav } from "@/components/layout/BottomNav"

const SETUP_PATH = "/profile/setup"

export default function ClientGroupLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useAuth()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
      } else {
        setChecking(false)
      }
    }
  }, [user, loading, router])

  if (checking || loading) return <FullPageSpinner />

  if (!user) return null

  if (pathname === SETUP_PATH) {
    return <ErrorBoundary>{children}</ErrorBoundary>
  }

  return (
    <I18nProvider>
      <ErrorBoundary>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 pb-20 lg:pb-0">
            {children}
          </main>
          <Footer />
          <BottomNav />
        </div>
      </ErrorBoundary>
    </I18nProvider>
  )
}