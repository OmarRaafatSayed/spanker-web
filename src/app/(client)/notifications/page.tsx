"use client"

import { useAuth } from "@/modules/auth"
import { useNotifications } from "@/modules/portal/hooks/useNotifications"
import { useState } from "react"
import { cn } from "@/lib/utils"

const TYPE_ICONS: Record<string, string> = {
  status_update: "📋",
  document_approved: "✅",
  document_rejected: "❌",
  payment_due: "💳",
  payment_confirmed: "🎉",
  message: "💬",
  info: "ℹ️",
}

const TYPE_COLORS: Record<string, string> = {
  status_update: "bg-blue-50 border-blue-200",
  document_approved: "bg-green-50 border-green-200",
  document_rejected: "bg-red-50 border-red-200",
  payment_due: "bg-amber-50 border-amber-200",
  payment_confirmed: "bg-emerald-50 border-emerald-200",
  message: "bg-purple-50 border-purple-200",
  info: "bg-gray-50 border-gray-200",
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "الآن"
  if (mins < 60) return `منذ ${mins} دقيقة`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `منذ ${hours} ساعة`
  const days = Math.floor(hours / 24)
  return `منذ ${days} يوم`
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const [filter, setFilter] = useState<"all" | "unread">("all")
  
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    error, 
    markRead, 
    markAllRead,
    refresh 
  } = useNotifications(filter === "unread")

  const handleMarkRead = async (id: string) => {
    await markRead(id)
    if (filter === "unread") {
      refresh()
    }
  }

  const errorMessage = error 
    ? (typeof error === 'string' ? error : 'حدث خطأ أثناء تحميل الإشعارات')
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20 sm:pt-24 pb-4 px-3 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                الإشعارات
              </h1>
              {!isLoading && !errorMessage && (
                <p className="text-sm text-gray-600 mt-1">
                  {unreadCount > 0 ? `${unreadCount} غير مقروءة` : "لا توجد إشعارات جديدة"}
                </p>
              )}
            </div>

            {!isLoading && !errorMessage && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setFilter("all")}
                    className={cn(
                      "px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-semibold transition-all",
                      filter === "all"
                        ? "bg-white text-green-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    الكل
                  </button>
                  <button
                    onClick={() => setFilter("unread")}
                    className={cn(
                      "px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-semibold transition-all",
                      filter === "unread"
                        ? "bg-white text-green-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    غير مقروءة
                  </button>
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    تعيين الكل كمقروء
                  </button>
                )}
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-600 mb-4" />
              <p className="text-gray-600 font-medium">جاري التحميل...</p>
            </div>
          ) : errorMessage ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <p className="text-red-600 font-semibold text-center">{errorMessage}</p>
              <button
                onClick={refresh}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 mb-1">
                  {filter === "unread" ? "لا توجد إشعارات غير مقروءة" : "لا توجد إشعارات"}
                </p>
                <p className="text-sm text-gray-600">
                  {filter === "unread" 
                    ? "جميع إشعاراتك مقروءة" 
                    : "سنعلمك عند وجود تحديثات جديدة"}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={cn(
                    "relative p-4 sm:p-5 rounded-xl border-2 transition-all hover:shadow-md",
                    TYPE_COLORS[notification.type] || "bg-gray-50 border-gray-200",
                    !notification.is_read && "ring-2 ring-green-500/20"
                  )}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="text-2xl sm:text-3xl shrink-0 mt-1">
                      {TYPE_ICONS[notification.type] ?? "🔔"}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className={cn(
                          "text-base sm:text-lg font-bold text-gray-900",
                          !notification.is_read && "text-green-600"
                        )}>
                          {notification.title}
                        </h3>
                        {!notification.is_read && (
                          <span className="h-2.5 w-2.5 bg-green-500 rounded-full shrink-0 mt-2" />
                        )}
                      </div>
                      
                      {notification.body && (
                        <p className="text-sm sm:text-base text-gray-700 mb-3 leading-relaxed">
                          {notification.body}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <span className="text-xs sm:text-sm text-gray-500 font-medium">
                          {timeAgo(notification.created_at)}
                        </span>
                        
                        {!notification.is_read && (
                          <button
                            onClick={() => handleMarkRead(notification.id)}
                            className="text-xs sm:text-sm font-semibold text-green-600 hover:text-green-700 hover:underline"
                          >
                            تعيين كمقروء
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}