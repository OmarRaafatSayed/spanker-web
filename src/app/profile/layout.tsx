"use client"

import { useAuth } from "@/modules/auth"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { User, Plane, Bell, FileText, Lock, Home, LogOut, Menu, X } from "lucide-react"

interface ProfileLayoutProps {
  children: React.ReactNode
}

const NAV_ITEMS = [
  {
    id: "account",
    label: "معلومات الحساب",
    href: "/profile",
    icon: User,
    description: "تحديث بياناتك الشخصية"
  },
  {
    id: "bookings",
    label: "حجوزاتي",
    href: "/profile/bookings",
    icon: Plane,
    description: "عرض وإدارة حجوزاتك"
  },
  {
    id: "notifications",
    label: "الإشعارات",
    href: "/profile/notifications",
    icon: Bell,
    description: "رسائل وتحديثات مهمة"
  },
  {
    id: "documents",
    label: "المستندات",
    href: "/profile/documents",
    icon: FileText,
    description: "جواز السفر والوثائق"
  },
  {
    id: "security",
    label: "الأمان والخصوصية",
    href: "/profile/security",
    icon: Lock,
    description: "كلمة المرور والإعدادات"
  },
]


export default function ProfileLayout({ children }: ProfileLayoutProps) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/login?redirect=/profile")
    } else {
      setLoading(false)
    }
  }, [user, router])

  const handleLogout = async () => {
    await signOut()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/20">
        <div className="text-center px-4">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-full border-4 border-brand-green/20" />
            <div className="absolute inset-0 rounded-full border-4 border-brand-green border-t-transparent animate-spin" />
          </div>
          <p className="text-gray-600 font-semibold">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  const userName = (user as { first_name?: string; email?: string } | null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/20" dir="rtl">
      {/* Top Header with Logo */}
      <div className="bg-brand-dark border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <Link href="/" className="shrink-0 hover:opacity-85 transition-opacity">
              <Image
                src="/width-logo.png"
                alt="Spanker"
                width={100}
                height={34}
                priority
                className="h-8 w-auto object-contain"
              />
            </Link>
            
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="hidden sm:flex items-center gap-2 h-9 px-4 text-sm font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <Home className="w-4 h-4" />
                <span>الرئيسية</span>
              </Link>
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-2 h-9 px-4 text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-white/10 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </button>
              
              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                aria-label="القائمة"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Header */}
      <div className="bg-gradient-to-br from-brand-dark to-brand-green-dark border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <User className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
                {userName?.first_name ? `مرحباً، ${userName.first_name}` : 'حسابي'}
              </h1>
              <p className="text-sm text-white/70 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div
        className={cn(
          "sm:hidden bg-white border-b border-gray-200 shadow-md transition-all duration-200 overflow-hidden",
          mobileMenuOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 rounded-xl transition-all",
                    isActive
                      ? "bg-gradient-to-l from-brand-green/10 to-emerald-50 border border-brand-green/30"
                      : "hover:bg-gray-50"
                  )}
                >
                  <Icon className={cn("w-5 h-5 mt-0.5", isActive ? "text-brand-green" : "text-gray-600")} />
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-bold mb-0.5",
                      isActive ? "text-brand-green" : "text-gray-900"
                    )}>
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-green mt-2" />
                  )}
                </Link>
              )
            })}
            <div className="pt-3 border-t border-gray-100 space-y-1 mt-3">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-all"
              >
                <Home className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-semibold text-gray-700">العودة للرئيسية</span>
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleLogout()
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition-all"
              >
                <LogOut className="w-5 h-5 text-red-600" />
                <span className="text-sm font-semibold text-red-600">تسجيل الخروج</span>
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 pb-20 sm:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Desktop Sidebar Navigation */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden sticky top-24">
              <div className="bg-gradient-to-br from-gray-50 to-white p-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">القائمة</h3>
              </div>
              <nav className="p-2">
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={cn(
                        "group flex items-start gap-3 px-3 py-3 rounded-xl transition-all mb-1",
                        isActive
                          ? "bg-gradient-to-l from-brand-green/10 to-emerald-50 border border-brand-green/30 shadow-sm"
                          : "hover:bg-gray-50"
                      )}
                    >
                      <Icon className={cn(
                        "w-5 h-5 mt-0.5 transition-transform group-hover:scale-110",
                        isActive ? "text-brand-green" : "text-gray-600"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-bold mb-0.5",
                          isActive ? "text-brand-green" : "text-gray-900"
                        )}>
                          {item.label}
                        </p>
                        <p className="text-xs text-gray-500 leading-tight">{item.description}</p>
                      </div>
                      {isActive && (
                        <div className="w-2 h-2 rounded-full bg-brand-green mt-1.5 shadow-sm shadow-brand-green/50" />
                      )}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3 w-full">
            <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm min-h-[400px] sm:min-h-[600px] overflow-hidden">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 safe-area-inset-bottom">
        <div className="grid grid-cols-5 gap-0.5 px-2 py-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all",
                  isActive
                    ? "text-brand-green bg-brand-green/5"
                    : "text-gray-600 active:bg-gray-100"
                )}
              >
                <Icon className={cn("w-5 h-5 mb-1", isActive && "scale-110")} />
                <span className="text-[10px] font-medium leading-tight text-center">{item.label}</span>
                {isActive && (
                  <div className="w-1 h-1 rounded-full bg-brand-green mt-0.5" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
