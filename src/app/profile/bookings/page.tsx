"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plane, Hotel, FileCheck, Map, ClipboardList, CheckCircle, Clock, CreditCard, MessageCircle, ChevronUp, ChevronDown, X } from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────

type BookingStatus =
  | "draft"
  | "quoted"
  | "pending_payment"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "expired"
  | "refunded"

type BookingVertical = "flight" | "hotel" | "visa" | "trip"

interface Booking {
  booking_id: string
  reference: string
  vertical: BookingVertical
  booking_status: BookingStatus  // ← Changed from 'status' to match DB field
  total_amount: number
  expires_at?: string
  created_at: string
  flight_details?: {
    airline: string
    flight_number: string
    origin: string
    destination: string
    departure_at: string
    passengers?: any[]
  }
  hotel_details?: {
    hotel_name: string
    city: string
    checkin_date: string
    checkout_date: string
    nights: number
    rooms_count: number
    room_type: string
  }
  visa_details?: {
    destination_country: string
    visa_type: string
    applicant_name: string
    review_status: string
  }
  trip_details?: {
    trip_title: string
    start_date: string
    end_date: string
    travelers_count: number
  }
}

// ── Static metadata ───────────────────────────────────────────────────────────

const STATUS_META: Record<BookingStatus, { label: string; color: string; dot: string }> = {
  draft:           { label: "مسودة",         color: "bg-gray-100 text-gray-600",       dot: "bg-gray-400" },
  quoted:          { label: "عرض سعر",       color: "bg-blue-100 text-blue-600",       dot: "bg-blue-400" },
  pending_payment: { label: "انتظار الدفع",  color: "bg-amber-100 text-amber-700",     dot: "bg-amber-400" },
  confirmed:       { label: "مؤكد",          color: "bg-green-100 text-green-700",     dot: "bg-green-500" },
  completed:       { label: "مكتمل",         color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  cancelled:       { label: "ملغي",          color: "bg-red-100 text-red-600",         dot: "bg-red-400" },
  expired:         { label: "منتهي",         color: "bg-gray-100 text-gray-500",       dot: "bg-gray-300" },
  refunded:        { label: "مسترد",         color: "bg-blue-100 text-blue-600",       dot: "bg-blue-400" },
}

const VERTICAL_META: Record<BookingVertical, { label: string; icon: any }> = {
  flight: { label: "رحلة طيران",   icon: Plane },
  hotel:  { label: "فندق",         icon: Hotel },
  visa:   { label: "تأشيرة",       icon: FileCheck },
  trip:   { label: "رحلة سياحية",  icon: Map },
}

const VISA_TYPE_LABELS: Record<string, string> = {
  tourist:  "سياحية",
  business: "أعمال",
  student:  "طالب",
  work:     "عمل",
  transit:  "عبور",
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function useCountdown(expiresAt?: string) {
  const [remaining, setRemaining] = useState("")

  useEffect(() => {
    if (!expiresAt) return

    function tick() {
      const diff = new Date(expiresAt!).getTime() - Date.now()
      if (diff <= 0) { setRemaining("انتهى"); return }
      const m = Math.floor(diff / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setRemaining(`${m}:${String(s).padStart(2, "0")}`)
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  return remaining
}

function BookingSummaryLine({ booking }: { booking: Booking }) {
  if (booking.flight_details) {
    const f = booking.flight_details
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span className="font-mono font-bold">{f.origin}</span>
        <span className="text-green-600 text-base">✈</span>
        <span className="font-mono font-bold">{f.destination}</span>
        <span className="text-gray-400">•</span>
        <span>{new Date(f.departure_at).toLocaleDateString("ar-EG", { day: "numeric", month: "short" })}</span>
        <span className="text-gray-400 text-xs">({f.airline})</span>
      </div>
    )
  }
  if (booking.hotel_details) {
    const h = booking.hotel_details
    return (
      <div className="text-sm text-gray-600">
        <span className="font-medium">{h.hotel_name}</span>
        <span className="text-gray-400"> • {h.city} • {h.nights} ليلة</span>
      </div>
    )
  }
  if (booking.visa_details) {
    const v = booking.visa_details
    return (
      <div className="text-sm text-gray-600">
        <span className="font-medium">{v.destination_country}</span>
        <span className="text-gray-400"> — {VISA_TYPE_LABELS[v.visa_type] ?? v.visa_type}</span>
      </div>
    )
  }
  if (booking.trip_details) {
    const t = booking.trip_details
    return (
      <div className="text-sm text-gray-600">
        <span className="font-medium">{t.trip_title}</span>
        <span className="text-gray-400"> • {t.start_date}</span>
      </div>
    )
  }
  return <span className="text-sm text-gray-400">—</span>
}

function ExpiryBadge({ expiresAt, booking_status }: { expiresAt?: string; booking_status: BookingStatus }) {
  const remaining = useCountdown(booking_status === "pending_payment" ? expiresAt : undefined)
  if (!expiresAt || booking_status !== "pending_payment" || !remaining) return null
  const isUrgent = remaining !== "انتهى" && parseInt(remaining) < 5
  return (
    <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg font-medium ${isUrgent ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>
      <span>⏳</span>
      <span>{remaining === "انتهى" ? "انتهى الحجز المؤقت" : `ينتهي خلال ${remaining}`}</span>
    </div>
  )
}

function BookingDetailPanel({ booking }: { booking: Booking }) {
  if (booking.flight_details) {
    const f = booking.flight_details
    return (
      <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600 space-y-1.5">
        <div className="grid grid-cols-2 gap-2">
          <p><span className="text-gray-400 text-xs">الرحلة</span><br /><strong>{f.airline} {f.flight_number}</strong></p>
          <p><span className="text-gray-400 text-xs">المسار</span><br /><strong>{f.origin} ✈ {f.destination}</strong></p>
          <p><span className="text-gray-400 text-xs">المغادرة</span><br />{new Date(f.departure_at).toLocaleString("ar-EG", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
          <p><span className="text-gray-400 text-xs">الركاب</span><br />{f.passengers?.length ?? 1}</p>
        </div>
        {f.passengers && f.passengers.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-gray-400 mb-1">قائمة الركاب</p>
            <div className="space-y-0.5">
              {f.passengers.map((p: any, i: number) => (
                <p key={i} className="text-xs">{i + 1}. {p.first_name} {p.last_name}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (booking.hotel_details) {
    const h = booking.hotel_details
    return (
      <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
        <div className="grid grid-cols-2 gap-2">
          <p><span className="text-gray-400 text-xs">الفندق</span><br /><strong>{h.hotel_name}</strong></p>
          <p><span className="text-gray-400 text-xs">المدينة</span><br />{h.city}</p>
          <p><span className="text-gray-400 text-xs">الوصول</span><br />{h.checkin_date}</p>
          <p><span className="text-gray-400 text-xs">المغادرة</span><br />{h.checkout_date}</p>
          <p><span className="text-gray-400 text-xs">الليالي</span><br />{h.nights}</p>
          <p><span className="text-gray-400 text-xs">الغرف</span><br />{h.rooms_count} × {h.room_type}</p>
        </div>
      </div>
    )
  }

  if (booking.visa_details) {
    const v = booking.visa_details
    return (
      <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
        <div className="grid grid-cols-2 gap-2">
          <p><span className="text-gray-400 text-xs">الوجهة</span><br /><strong>{v.destination_country}</strong></p>
          <p><span className="text-gray-400 text-xs">النوع</span><br />{VISA_TYPE_LABELS[v.visa_type] ?? v.visa_type}</p>
          <p><span className="text-gray-400 text-xs">المتقدم</span><br />{v.applicant_name}</p>
          <p><span className="text-gray-400 text-xs">حالة المراجعة</span><br />{v.review_status}</p>
        </div>
      </div>
    )
  }

  if (booking.trip_details) {
    const t = booking.trip_details
    return (
      <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
        <div className="grid grid-cols-2 gap-2">
          <p><span className="text-gray-400 text-xs">الرحلة</span><br /><strong>{t.trip_title}</strong></p>
          <p><span className="text-gray-400 text-xs">المسافرون</span><br />{t.travelers_count}</p>
          <p><span className="text-gray-400 text-xs">الانطلاق</span><br />{t.start_date}</p>
          <p><span className="text-gray-400 text-xs">العودة</span><br />{t.end_date}</p>
        </div>
      </div>
    )
  }

  return null
}

// ── Stats bar ─────────────────────────────────────────────────────────────────

function StatsBar({ bookings }: { bookings: Booking[] }) {
  const total     = bookings.length
  const confirmed = bookings.filter((b) => b.booking_status === "confirmed" || b.booking_status === "completed").length
  const pending   = bookings.filter((b) => b.booking_status === "pending_payment").length
  const spent     = bookings
    .filter((b) => b.booking_status !== "cancelled" && b.booking_status !== "refunded")
    .reduce((sum, b) => sum + (b.total_amount || 0), 0)

  const stats = [
    { label: "إجمالي الحجوزات", value: total, icon: ClipboardList, color: "bg-blue-50 text-blue-600" },
    { label: "مؤكدة", value: confirmed, icon: CheckCircle, color: "bg-green-50 text-green-600" },
    { label: "قيد الانتظار", value: pending, icon: Clock, color: "bg-amber-50 text-amber-600" },
    { label: "إجمالي الإنفاق", value: `${spent.toLocaleString()} ج.م`, icon: CreditCard, color: "bg-purple-50 text-purple-600" },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className={`rounded-xl p-4 ${color}`}>
          <Icon className="w-6 h-6 mb-2" />
          <p className="text-lg font-bold">{value}</p>
          <p className="text-xs opacity-75">{label}</p>
        </div>
      ))}
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  const quickLinks = [
    { label: "حجز طيران", href: "/ar-eg/book-flight", icon: Plane },
    { label: "حجز فندق", href: "/ar-eg/hotel-booking", icon: Hotel },
    { label: "تأشيرة", href: "/ar-eg/visa-application", icon: FileCheck },
    { label: "رحلة سياحية", href: "/ar-eg/tours", icon: Map },
  ]

  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
        <Map className="w-10 h-10 text-brand-green" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">لا توجد حجوزات بعد</h2>
      <p className="text-gray-500 mb-8">ابدأ رحلتك الأولى مع سبانكر</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-2xl mx-auto">
        {quickLinks.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-green-400 hover:shadow-sm transition-all"
          >
            <Icon className="w-6 h-6 text-gray-600" />
            <span className="text-xs font-medium text-gray-700">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ProfileBookingsPage() {
  const router = useRouter()

  const [bookings, setBookings]           = useState<Booking[]>([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [filterStatus, setFilterStatus]   = useState<string>("")
  const [filterVertical, setFilterVertical] = useState<string>("")
  const [page, setPage]                   = useState(1)
  const [meta, setMeta]                   = useState({ total: 0, total_pages: 1 })
  const [expandedId, setExpandedId]       = useState<string | null>(null)
  const [cancellingId, setCancellingId]   = useState<string | null>(null)
  const [activeTab, setActiveTab]         = useState<"all" | "active" | "past">("all")

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const q = new URLSearchParams({ page: String(page), limit: "10" })
      if (filterStatus)   q.set("status",   filterStatus)
      if (filterVertical) q.set("vertical", filterVertical)
      const res  = await fetch(`/api/v1/bookings/my?${q}`)
      if (res.status === 401) {
        router.push("/login?redirect=/profile/bookings")
        return
      }
      const json = await res.json()
      if (!json.success) throw new Error(json.error?.message)

      // Normalize travel_requests rows → Booking shape
      // The API returns travel_requests with: id, booking_reference, booking_status, etc.
      const normalized: Booking[] = (json.data || []).map((row: Record<string, unknown>) => ({
        booking_id:     (row.id as string),
        reference:      (row.booking_reference as string) ?? (row.id as string).slice(0, 8).toUpperCase(),
        vertical:       (row.vertical as BookingVertical) ?? "flight",
        booking_status: (row.booking_status as BookingStatus) ?? (row.status as BookingStatus) ?? "pending_payment",
        total_amount:   (row.total_amount as number) ?? 0,
        expires_at:     row.expires_at as string | undefined,
        created_at:     (row.created_at as string),
        // Detail sub-objects come from the row's contact/data fields if present
        flight_details:  row.flight_details as Booking["flight_details"] | undefined,
        hotel_details:   row.hotel_details  as Booking["hotel_details"]  | undefined,
        visa_details:    row.visa_details   as Booking["visa_details"]   | undefined,
        trip_details:    row.trip_details   as Booking["trip_details"]   | undefined,
      }))

      setBookings(normalized)
      setMeta(json.meta ?? { total: 0, total_pages: 1 })
    } catch (e: unknown) {
      setError((e as Error).message || "فشل تحميل الحجوزات")
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterVertical, page, router])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  async function handleCancel(bookingId: string) {
    if (!confirm("هل تريد إلغاء هذا الحجز؟ لا يمكن التراجع عن هذا الإجراء.")) return
    setCancellingId(bookingId)
    try {
      const res  = await fetch(`/api/v1/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Customer requested cancellation" }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error?.message)
      setExpandedId(null)
      fetchBookings()
    } catch (e: unknown) {
      setError((e as Error).message || "فشل إلغاء الحجز")
    } finally {
      setCancellingId(null)
    }
  }

  const canCancel = (b: Booking) => ["pending_payment", "confirmed"].includes(b.booking_status)

  // Tab filtering
  const ACTIVE_STATUSES: BookingStatus[] = ["pending_payment", "confirmed", "quoted"]
  const PAST_STATUSES:   BookingStatus[] = ["completed", "cancelled", "expired", "refunded"]

  const visibleBookings = bookings.filter((b) => {
    if (activeTab === "active") return ACTIVE_STATUSES.includes(b.booking_status)
    if (activeTab === "past")   return PAST_STATUSES.includes(b.booking_status)
    return true
  })

  return (
    <div className="p-3 sm:p-4 md:p-6" dir="rtl">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">حجوزاتي</h2>
        <p className="text-xs sm:text-sm text-gray-600">إدارة جميع حجوزاتك في مكان واحد</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 sm:gap-2 bg-gray-100 rounded-lg sm:rounded-xl p-1 mb-4 sm:mb-6 max-w-full sm:max-w-md">
        {(["all", "active", "past"] as const).map((tab) => {
          const labels = { all: "الكل", active: "النشطة", past: "السابقة" }
          return (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPage(1) }}
              className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                activeTab === tab
                  ? "bg-white text-green-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {labels[tab]}
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
          className="h-10 px-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 bg-white"
        >
          <option value="">كل الحالات</option>
          {(Object.entries(STATUS_META) as [BookingStatus, typeof STATUS_META[BookingStatus]][]).map(([v, { label }]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
        <select
          value={filterVertical}
          onChange={(e) => { setFilterVertical(e.target.value); setPage(1) }}
          className="h-10 px-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 bg-white"
        >
          <option value="">كل الأنواع</option>
          {(Object.entries(VERTICAL_META) as [BookingVertical, typeof VERTICAL_META[BookingVertical]][]).map(([v, { label }]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
        {(filterStatus || filterVertical) && (
          <button
            onClick={() => { setFilterStatus(""); setFilterVertical(""); setPage(1) }}
            className="flex items-center gap-2 h-10 px-3 rounded-xl border border-gray-300 text-sm text-gray-600 hover:text-gray-900 hover:border-green-400 transition-all bg-white"
          >
            <X className="w-4 h-4" />
            <span>مسح الفلتر</span>
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse bg-gray-100 rounded-xl p-4 h-24" />
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-gray-100 rounded-xl p-5 h-32" />
            ))}
          </div>
        </>
      ) : bookings.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <StatsBar bookings={bookings} />

          {visibleBookings.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-gray-500">لا توجد حجوزات في هذا التصنيف</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleBookings.map((b) => {
                const vert     = VERTICAL_META[b.vertical]
                const status   = STATUS_META[b.booking_status]  // ← FIXED HERE
                const isOpen   = expandedId === b.booking_id

                return (
                  <div
                    key={b.booking_id}
                    className={`bg-gray-50 rounded-xl border transition-all ${
                      isOpen ? "border-green-500 shadow-md" : "border-gray-200 hover:shadow-sm"
                    }`}
                  >
                    <div
                      className="p-4 cursor-pointer select-none"
                      onClick={() => setExpandedId(isOpen ? null : b.booking_id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                          {(() => {
                            const Icon = vert?.icon
                            return Icon ? <Icon className="w-6 h-6 text-brand-green" /> : null
                          })()}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="text-xs font-medium text-gray-500">{vert?.label}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${status.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                              {status.label}
                            </span>
                          </div>
                          <p className="font-bold text-gray-900 font-mono text-sm tracking-wide">
                            {b.reference}
                          </p>
                          <BookingSummaryLine booking={b} />
                        </div>

                        <div className="text-left shrink-0">
                          <p className="font-bold text-green-600 text-base">
                            {b.total_amount?.toLocaleString()} ج.م
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(b.created_at).toLocaleDateString("ar-EG", {
                              day: "numeric",
                              month: "short",
                              year: "2-digit",
                            })}
                          </p>
                          <div className="mt-1 text-gray-400">
                            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>

                      {b.expires_at && b.booking_status === "pending_payment" && (
                        <div className="mt-2">
                          <ExpiryBadge expiresAt={b.expires_at} booking_status={b.booking_status} />
                        </div>
                      )}
                    </div>

                    {isOpen && (
                      <div className="px-4 pb-4">
                        <BookingDetailPanel booking={b} />

                        <div className="mt-4 pt-3 border-t border-gray-200 flex items-center gap-2 flex-wrap">
                          {canCancel(b) && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCancel(b.booking_id) }}
                              disabled={cancellingId === b.booking_id}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-all disabled:opacity-50"
                            >
                              <X className="w-4 h-4" />
                              <span>{cancellingId === b.booking_id ? "جاري الإلغاء..." : "إلغاء الحجز"}</span>
                            </button>
                          )}
                          {b.booking_status === "confirmed" && (
                            <span className="flex items-center gap-2 text-xs text-gray-500 mr-auto">
                              <MessageCircle className="w-4 h-4" />
                              <span>سيتواصل معك فريقنا لتأكيد الدفع</span>
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {meta.total_pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-all"
              >
                السابق
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: meta.total_pages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                      page === p
                        ? "bg-green-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(meta.total_pages, p + 1))}
                disabled={page === meta.total_pages}
                className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-all"
              >
                التالي
              </button>
            </div>
          )}

          <p className="text-center text-xs text-gray-500 mt-4">
            {meta.total} حجز إجمالي
          </p>
        </>
      )}
    </div>
  )
}
