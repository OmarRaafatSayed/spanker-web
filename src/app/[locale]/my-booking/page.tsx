"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

type BookingStatus =
  | "draft"
  | "pending"
  | "confirmed"
  | "cancelled"
  | "expired"
  | "refunded"
  | "completed";

type BookingVertical = "flight" | "hotel" | "visa" | "trip";

interface Booking {
  booking_id: string;
  reference: string;
  vertical: BookingVertical;
  status: BookingStatus;
  total_amount: number;
  expires_at?: string;
  created_at: string;
  flight_details?: {
    airline: string;
    flight_number: string;
    origin: string;
    destination: string;
    departure_at: string;
    passengers?: any[];
  };
  hotel_details?: {
    hotel_name: string;
    city: string;
    checkin_date: string;
    checkout_date: string;
    nights: number;
    rooms_count: number;
    room_type: string;
  };
  visa_details?: {
    destination_country: string;
    visa_type: string;
    applicant_name: string;
    review_status: string;
  };
  trip_details?: {
    trip_title: string;
    start_date: string;
    end_date: string;
    travelers_count: number;
  };
}

// ── Static metadata ───────────────────────────────────────────────────────────

const STATUS_META: Record<BookingStatus, { label: string; color: string; dot: string }> = {
  draft:     { label: "مسودة",         color: "bg-gray-100 text-gray-600",       dot: "bg-gray-400" },
  pending:   { label: "قيد الانتظار",  color: "bg-amber-100 text-amber-700",     dot: "bg-amber-400" },
  confirmed: { label: "مؤكد",          color: "bg-green-100 text-green-700",     dot: "bg-green-500" },
  cancelled: { label: "ملغي",          color: "bg-red-100 text-red-600",         dot: "bg-red-400" },
  expired:   { label: "منتهي",         color: "bg-gray-100 text-gray-500",       dot: "bg-gray-300" },
  refunded:  { label: "مسترد",         color: "bg-blue-100 text-blue-600",       dot: "bg-blue-400" },
  completed: { label: "مكتمل",         color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
};

const VERTICAL_META: Record<BookingVertical, { label: string; icon: string; href: string }> = {
  flight: { label: "رحلة طيران",   icon: "✈️",  href: "book-flight" },
  hotel:  { label: "فندق",         icon: "🏨",  href: "hotel-booking" },
  visa:   { label: "تأشيرة",       icon: "🛂",  href: "visa-application" },
  trip:   { label: "رحلة سياحية",  icon: "🗺️", href: "tours" },
};

const VISA_TYPE_LABELS: Record<string, string> = {
  tourist:  "سياحية",
  business: "أعمال",
  student:  "طالب",
  work:     "عمل",
  transit:  "عبور",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function useCountdown(expiresAt?: string) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    if (!expiresAt) return;

    function tick() {
      const diff = new Date(expiresAt!).getTime() - Date.now();
      if (diff <= 0) { setRemaining("انتهى"); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${m}:${String(s).padStart(2, "0")}`);
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return remaining;
}

function BookingSummaryLine({ booking }: { booking: Booking }) {
  if (booking.flight_details) {
    const f = booking.flight_details;
    return (
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <span className="font-mono font-bold">{f.origin}</span>
        <span className="text-brand-green text-base">✈</span>
        <span className="font-mono font-bold">{f.destination}</span>
        <span className="text-text-muted">•</span>
        <span>{new Date(f.departure_at).toLocaleDateString("ar-EG", { day: "numeric", month: "short" })}</span>
        <span className="text-text-muted text-xs">({f.airline})</span>
      </div>
    );
  }
  if (booking.hotel_details) {
    const h = booking.hotel_details;
    return (
      <div className="text-sm text-text-secondary">
        <span className="font-medium">{h.hotel_name}</span>
        <span className="text-text-muted"> • {h.city} • {h.nights} ليلة</span>
      </div>
    );
  }
  if (booking.visa_details) {
    const v = booking.visa_details;
    return (
      <div className="text-sm text-text-secondary">
        <span className="font-medium">{v.destination_country}</span>
        <span className="text-text-muted"> — {VISA_TYPE_LABELS[v.visa_type] ?? v.visa_type}</span>
      </div>
    );
  }
  if (booking.trip_details) {
    const t = booking.trip_details;
    return (
      <div className="text-sm text-text-secondary">
        <span className="font-medium">{t.trip_title}</span>
        <span className="text-text-muted"> • {t.start_date}</span>
      </div>
    );
  }
  return <span className="text-sm text-text-muted">—</span>;
}

function ExpiryBadge({ expiresAt, status }: { expiresAt?: string; status: BookingStatus }) {
  const remaining = useCountdown(status === "pending" ? expiresAt : undefined);
  if (!expiresAt || status !== "pending" || !remaining) return null;
  const isUrgent = remaining !== "انتهى" && parseInt(remaining) < 5;
  return (
    <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg font-medium ${isUrgent ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>
      <span>⏳</span>
      <span>{remaining === "انتهى" ? "انتهى الحجز المؤقت" : `ينتهي خلال ${remaining}`}</span>
    </div>
  );
}

function BookingDetailPanel({ booking, locale }: { booking: Booking; locale: string }) {
  if (booking.flight_details) {
    const f = booking.flight_details;
    return (
      <div className="mt-4 pt-4 border-t border-border-light text-sm text-text-secondary space-y-1.5">
        <div className="grid grid-cols-2 gap-2">
          <p><span className="text-text-muted text-xs">الرحلة</span><br /><strong>{f.airline} {f.flight_number}</strong></p>
          <p><span className="text-text-muted text-xs">المسار</span><br /><strong>{f.origin} ✈ {f.destination}</strong></p>
          <p><span className="text-text-muted text-xs">المغادرة</span><br />{new Date(f.departure_at).toLocaleString("ar-EG", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
          <p><span className="text-text-muted text-xs">الركاب</span><br />{f.passengers?.length ?? 1}</p>
        </div>
        {f.passengers && f.passengers.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-text-muted mb-1">قائمة الركاب</p>
            <div className="space-y-0.5">
              {f.passengers.map((p: any, i: number) => (
                <p key={i} className="text-xs">{i + 1}. {p.first_name} {p.last_name}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (booking.hotel_details) {
    const h = booking.hotel_details;
    return (
      <div className="mt-4 pt-4 border-t border-border-light text-sm text-text-secondary">
        <div className="grid grid-cols-2 gap-2">
          <p><span className="text-text-muted text-xs">الفندق</span><br /><strong>{h.hotel_name}</strong></p>
          <p><span className="text-text-muted text-xs">المدينة</span><br />{h.city}</p>
          <p><span className="text-text-muted text-xs">الوصول</span><br />{h.checkin_date}</p>
          <p><span className="text-text-muted text-xs">المغادرة</span><br />{h.checkout_date}</p>
          <p><span className="text-text-muted text-xs">الليالي</span><br />{h.nights}</p>
          <p><span className="text-text-muted text-xs">الغرف</span><br />{h.rooms_count} × {h.room_type}</p>
        </div>
      </div>
    );
  }

  if (booking.visa_details) {
    const v = booking.visa_details;
    return (
      <div className="mt-4 pt-4 border-t border-border-light text-sm text-text-secondary">
        <div className="grid grid-cols-2 gap-2">
          <p><span className="text-text-muted text-xs">الوجهة</span><br /><strong>{v.destination_country}</strong></p>
          <p><span className="text-text-muted text-xs">النوع</span><br />{VISA_TYPE_LABELS[v.visa_type] ?? v.visa_type}</p>
          <p><span className="text-text-muted text-xs">المتقدم</span><br />{v.applicant_name}</p>
          <p><span className="text-text-muted text-xs">حالة المراجعة</span><br />{v.review_status}</p>
        </div>
      </div>
    );
  }

  if (booking.trip_details) {
    const t = booking.trip_details;
    return (
      <div className="mt-4 pt-4 border-t border-border-light text-sm text-text-secondary">
        <div className="grid grid-cols-2 gap-2">
          <p><span className="text-text-muted text-xs">الرحلة</span><br /><strong>{t.trip_title}</strong></p>
          <p><span className="text-text-muted text-xs">المسافرون</span><br />{t.travelers_count}</p>
          <p><span className="text-text-muted text-xs">الانطلاق</span><br />{t.start_date}</p>
          <p><span className="text-text-muted text-xs">العودة</span><br />{t.end_date}</p>
        </div>
      </div>
    );
  }

  return null;
}

// ── Stats bar ─────────────────────────────────────────────────────────────────

function StatsBar({ bookings }: { bookings: Booking[] }) {
  const total     = bookings.length;
  const confirmed = bookings.filter((b) => b.status === "confirmed" || b.status === "completed").length;
  const pending   = bookings.filter((b) => b.status === "pending").length;
  const spent     = bookings
    .filter((b) => b.status !== "cancelled" && b.status !== "refunded")
    .reduce((sum, b) => sum + (b.total_amount || 0), 0);

  const stats = [
    { label: "إجمالي الحجوزات", value: total,                      icon: "📋" },
    { label: "مؤكدة",           value: confirmed,                   icon: "✅" },
    { label: "قيد الانتظار",    value: pending,                     icon: "⏳" },
    { label: "إجمالي الإنفاق",  value: `${spent.toLocaleString()} ج.م`, icon: "💳" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {stats.map(({ label, value, icon }) => (
        <div key={label} className="bg-white rounded-2xl border border-border-light p-3 text-center">
          <div className="text-2xl mb-1">{icon}</div>
          <p className="text-lg font-bold text-text-primary">{value}</p>
          <p className="text-xs text-text-muted">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ locale }: { locale: string }) {
  const quickLinks = [
    { label: "حجز طيران",      href: `/${locale}/book-flight`,      icon: "✈️" },
    { label: "حجز فندق",       href: `/${locale}/hotel-booking`,     icon: "🏨" },
    { label: "تأشيرة",         href: `/${locale}/visa-application`,  icon: "🛂" },
    { label: "رحلة سياحية",    href: `/${locale}/tours`,             icon: "🗺️" },
  ];

  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 rounded-full bg-brand-green/10 flex items-center justify-center mx-auto mb-4">
        <span className="text-4xl">🗺️</span>
      </div>
      <h2 className="text-xl font-bold text-text-primary mb-2">لا توجد حجوزات بعد</h2>
      <p className="text-text-muted mb-8">ابدأ رحلتك الأولى مع سبانكر</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-md mx-auto">
        {quickLinks.map(({ label, href, icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-border-light hover:border-brand-green/40 hover:shadow-sm transition-all"
          >
            <span className="text-2xl">{icon}</span>
            <span className="text-xs font-medium text-text-secondary">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MyBookingPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "ar";

  const [bookings, setBookings]           = useState<Booking[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [filterStatus, setFilterStatus]   = useState<string>("");
  const [filterVertical, setFilterVertical] = useState<string>("");
  const [page, setPage]                   = useState(1);
  const [meta, setMeta]                   = useState({ total: 0, total_pages: 1 });
  const [expandedId, setExpandedId]       = useState<string | null>(null);
  const [cancellingId, setCancellingId]   = useState<string | null>(null);
  const [activeTab, setActiveTab]         = useState<"all" | "active" | "past">("all");

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({ page: String(page), limit: "10" });
      if (filterStatus)   q.set("status",   filterStatus);
      if (filterVertical) q.set("vertical", filterVertical);
      const res  = await fetch(`/api/v1/bookings/my?${q}`);
      if (res.status === 401) {
        router.push(`/${locale}/login?redirect=/${locale}/my-booking`);
        return;
      }
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      setBookings(json.data || []);
      setMeta(json.meta ?? { total: 0, total_pages: 1 });
    } catch (e: any) {
      setError(e.message || "فشل تحميل الحجوزات");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterVertical, page, locale, router]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  async function handleCancel(bookingId: string) {
    if (!confirm("هل تريد إلغاء هذا الحجز؟ لا يمكن التراجع عن هذا الإجراء.")) return;
    setCancellingId(bookingId);
    try {
      const res  = await fetch(`/api/v1/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Customer requested cancellation" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      setExpandedId(null);
      fetchBookings();
    } catch (e: any) {
      setError(e.message || "فشل إلغاء الحجز");
    } finally {
      setCancellingId(null);
    }
  }

  const canCancel = (b: Booking) => ["pending", "confirmed"].includes(b.status);

  // Tab filtering (client-side on top of server filters)
  const ACTIVE_STATUSES: BookingStatus[] = ["pending", "confirmed"];
  const PAST_STATUSES:   BookingStatus[] = ["completed", "cancelled", "expired", "refunded"];

  const visibleBookings = bookings.filter((b) => {
    if (activeTab === "active") return ACTIVE_STATUSES.includes(b.status);
    if (activeTab === "past")   return PAST_STATUSES.includes(b.status);
    return true;
  });

  const quickLinks = [
    { label: "✈️ رحلة",        href: `/${locale}/book-flight` },
    { label: "🏨 فندق",         href: `/${locale}/hotel-booking` },
    { label: "🛂 تأشيرة",       href: `/${locale}/visa-application` },
    { label: "🗺️ رحلة سياحية", href: `/${locale}/tours` },
  ];

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-brand-green/5 to-brand-yellow/5"
      dir="rtl"
    >
      {/* ── Sticky header ── */}
      <div className="bg-white border-b border-border-light sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-text-primary">حجوزاتي</h1>
            <div className="flex flex-wrap gap-1.5">
              {quickLinks.map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-brand-green/10 text-brand-green hover:bg-brand-green/20 transition-all whitespace-nowrap"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-muted rounded-xl p-1">
            {(["all", "active", "past"] as const).map((tab) => {
              const labels = { all: "الكل", active: "النشطة", past: "السابقة" };
              return (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setPage(1); }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === tab
                      ? "bg-white text-brand-green shadow-sm"
                      : "text-text-muted hover:text-text-secondary"
                  }`}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* ── Filters ── */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="h-9 px-3 rounded-xl border border-border-default text-xs focus:outline-none focus:ring-2 focus:ring-brand-green/30 bg-white"
          >
            <option value="">كل الحالات</option>
            {(Object.entries(STATUS_META) as [BookingStatus, typeof STATUS_META[BookingStatus]][]).map(([v, { label }]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </select>
          <select
            value={filterVertical}
            onChange={(e) => { setFilterVertical(e.target.value); setPage(1); }}
            className="h-9 px-3 rounded-xl border border-border-default text-xs focus:outline-none focus:ring-2 focus:ring-brand-green/30 bg-white"
          >
            <option value="">كل الأنواع</option>
            {(Object.entries(VERTICAL_META) as [BookingVertical, typeof VERTICAL_META[BookingVertical]][]).map(([v, { label, icon }]) => (
              <option key={v} value={v}>{icon} {label}</option>
            ))}
          </select>
          {(filterStatus || filterVertical) && (
            <button
              onClick={() => { setFilterStatus(""); setFilterVertical(""); setPage(1); }}
              className="h-9 px-3 rounded-xl border border-border-default text-xs text-text-muted hover:text-text-primary hover:border-brand-green/40 transition-all bg-white"
            >
              ✕ مسح الفلتر
            </button>
          )}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* ── Loading skeletons ── */}
        {loading ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse bg-white rounded-2xl border border-border-light p-3 h-20" />
              ))}
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-white rounded-2xl border border-border-light p-5">
                  <div className="flex gap-3 items-start">
                    <div className="w-10 h-10 bg-muted rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                    <div className="space-y-1">
                      <div className="h-4 bg-muted rounded w-20" />
                      <div className="h-3 bg-muted rounded w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : bookings.length === 0 ? (
          <EmptyState locale={locale} />
        ) : (
          <>
            <StatsBar bookings={bookings} />

            {visibleBookings.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-border-light">
                <p className="text-text-muted">لا توجد حجوزات في هذا التصنيف</p>
              </div>
            ) : (
              <div className="space-y-3">
                {visibleBookings.map((b) => {
                  const vert     = VERTICAL_META[b.vertical];
                  const status   = STATUS_META[b.status];
                  const isOpen   = expandedId === b.booking_id;

                  return (
                    <div
                      key={b.booking_id}
                      className={`bg-white rounded-2xl border transition-all ${
                        isOpen ? "border-brand-green shadow-md" : "border-border-light hover:shadow-sm"
                      }`}
                    >
                      {/* ── Card header (clickable) ── */}
                      <div
                        className="p-4 cursor-pointer select-none"
                        onClick={() => setExpandedId(isOpen ? null : b.booking_id)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className="w-11 h-11 rounded-xl bg-brand-green/8 flex items-center justify-center text-2xl shrink-0">
                            {vert?.icon}
                          </div>

                          {/* Main info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <span className="text-xs font-medium text-text-muted">{vert?.label}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${status.color}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                {status.label}
                              </span>
                            </div>
                            <p className="font-bold text-text-primary font-mono text-sm tracking-wide">
                              {b.reference}
                            </p>
                            <BookingSummaryLine booking={b} />
                          </div>

                          {/* Amount + date */}
                          <div className="text-left shrink-0">
                            <p className="font-bold text-brand-green text-base">
                              {b.total_amount?.toLocaleString()} ج.م
                            </p>
                            <p className="text-xs text-text-muted">
                              {new Date(b.created_at).toLocaleDateString("ar-EG", {
                                day: "numeric",
                                month: "short",
                                year: "2-digit",
                              })}
                            </p>
                            <div className="mt-1 text-text-muted">
                              <span className="text-xs">{isOpen ? "▲" : "▼"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Expiry countdown */}
                        {b.expires_at && b.status === "pending" && (
                          <div className="mt-2">
                            <ExpiryBadge expiresAt={b.expires_at} status={b.status} />
                          </div>
                        )}
                      </div>

                      {/* ── Expanded detail panel ── */}
                      {isOpen && (
                        <div className="px-4 pb-4">
                          <BookingDetailPanel booking={b} locale={locale} />

                          {/* Actions */}
                          <div className="mt-4 pt-3 border-t border-border-light flex items-center gap-2 flex-wrap">
                            {canCancel(b) && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCancel(b.booking_id); }}
                                disabled={cancellingId === b.booking_id}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-all disabled:opacity-50 flex items-center gap-1.5"
                              >
                                {cancellingId === b.booking_id ? (
                                  <>
                                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                    جاري الإلغاء...
                                  </>
                                ) : (
                                  <>✕ إلغاء الحجز</>
                                )}
                              </button>
                            )}
                            {vert && (
                              <Link
                                href={`/${locale}/${vert.href}`}
                                className="px-4 py-2 rounded-xl text-sm font-medium bg-brand-green/10 text-brand-green hover:bg-brand-green/20 transition-all"
                              >
                                حجز جديد {vert.icon}
                              </Link>
                            )}
                            {b.status === "confirmed" && (
                              <span className="text-xs text-text-muted mr-auto">
                                💬 سيتواصل معك فريقنا لتأكيد الدفع
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Pagination ── */}
            {meta.total_pages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-xl border border-border-default text-sm font-medium disabled:opacity-40 hover:bg-muted transition-all"
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
                          ? "bg-brand-green text-white"
                          : "text-text-muted hover:bg-muted"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(meta.total_pages, p + 1))}
                  disabled={page === meta.total_pages}
                  className="px-4 py-2 rounded-xl border border-border-default text-sm font-medium disabled:opacity-40 hover:bg-muted transition-all"
                >
                  التالي
                </button>
              </div>
            )}

            <p className="text-center text-xs text-text-muted mt-4">
              {meta.total} حجز إجمالي
            </p>
          </>
        )}
      </div>
    </div>
  );
}
