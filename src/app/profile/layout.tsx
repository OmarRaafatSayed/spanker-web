"use client"

import { AuthGuard } from "@/modules/auth"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { I18nProvider } from "@/lib/i18n/context"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BottomNav } from "@/components/layout/BottomNav"

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AuthGuard>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 pb-20 lg:pb-0">
            {children}
          </main>
          <Footer />
          <BottomNav />
        </div>
      </AuthGuard>
    </I18nProvider>
  )
}