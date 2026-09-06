"use client"

// =============================================================================
// Navbar — portal navigation bar
// =============================================================================

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, FolderOpen, User, LogOut, Menu, X } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { NotificationBell } from "@/modules/portal/components/NotificationBell"
import { useNotifications } from "@/modules/portal/hooks/useNotifications"
import { usePortalRealtime } from "@/modules/portal/realtime/usePortalRealtime"
import { useAuthStore } from "@/modules/auth/store/authStore"
import { authService } from "@/modules/auth/services/authService"
import { useRouter } from "next/navigation"

const NAV_LINKS = [
  { href: "/dashboard",      label: "Dashboard",      icon: LayoutDashboard },
  { href: "/requests",       label: "My Requests",    icon: FileText },
  { href: "/documents",      label: "Documents",      icon: FolderOpen },
]

export function Navbar() {
  const pathname  = usePathname()
  const router    = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useAuthStore()

  const { notifications, unreadCount, markRead, markAllRead, pushNotification } = useNotifications()

  usePortalRealtime(user?.id ?? "", {
    onNotification: pushNotification,
  })

  const handleLogout = async () => {
    await authService.logout()
    logout()
    router.replace("/login")
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <Image src="/width-logo.png" alt="Spanker" width={120} height={36} className="h-8 w-auto object-contain" priority />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith(href)
                  ? "bg-brand-green/10 text-brand-green"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkRead={markRead}
            onMarkAllRead={markAllRead}
          />

          <Link
            href="/profile"
            className={cn(
              "hidden md:inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith("/profile")
                ? "bg-brand-green/10 text-brand-green"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <User className="w-4 h-4" />
            Profile
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="hidden md:inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 pb-4">
          <nav className="flex flex-col gap-1 pt-2" aria-label="Mobile navigation">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname.startsWith(href)
                    ? "bg-brand-green/10 text-brand-green"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
            <Link
              href="/profile"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <User className="w-4 h-4" />
              Profile
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors text-left"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </nav>
        </div>
      )}
    </header>
  )
}
