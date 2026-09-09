"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const STATUS_LABELS: Record<string, { ar: string; color: string }> = {
  draft:     { ar: "مسودة",    color: "bg-gray-100 text-gray-600" },
  pending:   { ar: "قيد الانتظار", color: "bg-yellow-100 text-yellow-700" },
  confirmed: { ar: "مؤكد",    color: "bg-green-100 text-green-700" },
  cancelled: { ar: "ملغي",    color: "bg-red-100 text-red-600" },
  expired:   { ar: "منتهي",   color: "bg-gray-100 text-gray-500" },
  refunded:  { ar: "مسترد",   color: "bg-blue-100 text-blue-600" },
  completed: { ar: "مكتمل",   color: "bg-emerald-100 text-emerald-700" },
};

const VERTICAL_LABELS: Record<string, { ar: string; icon: string }> = {
  flight: { ar: "رحلة طيران", icon: "✈️" },
  hotel:  { ar: "فندق",       icon: "🏨" },
  visa:   { ar: "تأشيرة",     icon: "🛂" },
  trip:   { ar: "رحلة سياحية", icon: "🗺️" },
};

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterVertical, setFilterVertical] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, total_pages: 1 });
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

  useEffect(() => { fetchBookings(); }, [filterStatus, filterVertical, page]);

  async function fetchBookings() {
    setLoading(true); setError(null);
    try {
      const q = new URLSearchParams({ page: String(page), limit: "10" });
      if (filterStatus) q.set("status", filterStatus);
      if (filterVertical) q.set("vertical", filterVertical);
      const res = await fetch(`/api/v1/bookings/my?${q}`);
      if (res.status === 401) { router.push("/login?redirect=/bookings"); return; }
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      setBookings(json.data || []);
      setMeta(json.meta || { total: 0, total_pages: 1 });
    } catch (e: any) { setError(e.message || "فشل تحميل الحجوزات"); }
    finally { setLoading(false); }
  }

  async function handleCancel(bookingId: string) {
    if (!confirm("هل تريد إلغاء هذا الحجز؟")) return;
    setCancellingId(bookingId);
    try {
      const res = await fetch(`/api/v1/bookings/${bookingId}/cancel`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Customer requested cancellation" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      fetchBookings();
      setSelectedBooking(null);
    } catch (e: any) { alert(e.message || "فشل إلغاء الحجز"); }
    finally { setCancellingId(null); }
  }

  function getBookingSummary(b: any) {
    if (b.flight_details) return `${b.flight_details.origin} ← ${b.flight_details.destination} • ${new Date(b.flight_details.departure_at).toLocaleDateString("ar-EG")}`;
    if (b.hotel_details) return `${b.hotel_details.hotel_name}، ${b.hotel_details.city} • ${b.hotel_details.nights} ليلة`;
    if (b.visa_details) return `${b.visa_details.destination_country} — ${b.visa_details.visa_type}`;
    if (b.trip_details) return `${b.trip_details.trip_title} • ${b.trip_details.start_date}`;
    return "—";
  }

  const canCancel = (b: any) => ["pending", "confirmed"].includes(b.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-green/5 to-brand-yellow/5" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-border-light sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-text-primary">حجوزاتي</h1>
          <div className="flex gap-2">
            <Link href="/book/flight" className="px-3 py-2 rounded-xl text-xs font-medium bg-brand-green text-white hover:bg-brand-green-dark transition-all">+ رحلة</Link>
            <Link href="/book/hotel" className="px-3 py-2 rounded-xl text-xs font-medium bg-brand-green/10 text-brand-green hover:bg-brand-green/20 transition-all">+ فندق</Link>
            <Link href="/book/visa" className="px-3 py-2 rounded-xl text-xs font-medium bg-brand-green/10 text-brand-green hover:bg-brand-green/20 transition-all">+ تأشيرة</Link>
            <Link href="/book/trip" className="px-3 py-2 rounded-xl text-xs font-medium bg-brand-green/10 text-brand-green hover:bg-brand-green/20 transition-all">+ رحلة سياحية</Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            className="h-9 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30">
            <option value="">كل الحالات</option>
            {Object.entries(STATUS_LABELS).map(([v, { ar }]) => <option key={v} value={v}>{ar}</option>)}
          </select>
          <select value={filterVertical} onChange={e => { setFilterVertical(e.target.value); setPage(1); }}
            className="h-9 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30">
            <option value="">كل الأنواع</option>
            {Object.entries(VERTICAL_LABELS).map(([v, { ar, icon }]) => <option key={v} value={v}>{icon} {ar}</option>)}
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-border-light p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-2"/>
                <div className="h-3 bg-muted rounded w-2/3"/>
              </div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🗺️</div>
            <p className="text-text-muted text-lg">لا توجد حجوزات بعد</p>
            <Link href="/book/flight" className="mt-4 inline-block px-6 py-2.5 rounded-xl bg-brand-green text-white font-bold hover:bg-brand-green-dark transition-all">
              ابدأ حجزك الأول
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b: any) => {
              const vert = VERTICAL_LABELS[b.vertical];
              const status = STATUS_LABELS[b.status];
              return (
                <div key={b.booking_id}
                  className="bg-white rounded-2xl border border-border-light p-4 hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => setSelectedBooking(selectedBooking?.booking_id === b.booking_id ? null : b)}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{vert?.icon}</span>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium text-text-muted">{vert?.ar}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status?.color}`}>{status?.ar}</span>
                        </div>
                        <p className="font-bold text-text-primary font-mono text-sm">{b.reference}</p>
                        <p className="text-sm text-text-secondary mt-0.5">{getBookingSummary(b)}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-brand-green">{b.total_amount?.toLocaleString()} ج.م</p>
                      <p className="text-xs text-text-muted">{new Date(b.created_at).toLocaleDateString("ar-EG")}</p>
                    </div>
                  </div>

                  {/* Expiry countdown */}
                  {b.expires_at && b.status === "pending" && (
                    <div className="mt-2 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg">
                      ⏳ ينتهي الحجز المؤقت {new Date(b.expires_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  )}

                  {/* Expanded details */}
                  {selectedBooking?.booking_id === b.booking_id && (
                    <div className="mt-4 pt-4 border-t border-border-light">
                      {b.flight_details && (
                        <div className="text-sm text-text-secondary space-y-1">
                          <p><strong>الرحلة:</strong> {b.flight_details.airline} {b.flight_details.flight_number}</p>
                          <p><strong>المسار:</strong> {b.flight_details.origin} ✈ {b.flight_details.destination}</p>
                          <p><strong>الركاب:</strong> {b.flight_details.passengers?.length}</p>
                        </div>
                      )}
                      {b.hotel_details && (
                        <div className="text-sm text-text-secondary space-y-1">
                          <p><strong>الفندق:</strong> {b.hotel_details.hotel_name}</p>
                          <p><strong>الوصول:</strong> {b.hotel_details.checkin_date} — {b.hotel_details.checkout_date}</p>
                          <p><strong>الغرف:</strong> {b.hotel_details.rooms_count} {b.hotel_details.room_type} × {b.hotel_details.nights} ليلة</p>
                        </div>
                      )}
                      {b.visa_details && (
                        <div className="text-sm text-text-secondary space-y-1">
                          <p><strong>الوجهة:</strong> {b.visa_details.destination_country}</p>
                          <p><strong>المتقدم:</strong> {b.visa_details.applicant_name}</p>
                          <p><strong>حالة المراجعة:</strong> {b.visa_details.review_status}</p>
                        </div>
                      )}
                      {b.trip_details && (
                        <div className="text-sm text-text-secondary space-y-1">
                          <p><strong>الرحلة:</strong> {b.trip_details.trip_title}</p>
                          <p><strong>المسافرون:</strong> {b.trip_details.travelers_count}</p>
                          <p><strong>التاريخ:</strong> {b.trip_details.start_date} — {b.trip_details.end_date}</p>
                        </div>
                      )}
                      {canCancel(b) && (
                        <button
                          onClick={e => { e.stopPropagation(); handleCancel(b.booking_id); }}
                          disabled={cancellingId === b.booking_id}
                          className="mt-3 px-4 py-2 rounded-xl text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-all disabled:opacity-50">
                          {cancellingId === b.booking_id ? "جاري الإلغاء..." : "إلغاء الحجز"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {meta.total_pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-xl border border-border-default text-sm disabled:opacity-40 hover:bg-muted transition-all">السابق</button>
            <span className="text-sm text-text-muted">{page} / {meta.total_pages}</span>
            <button onClick={() => setPage(p => Math.min(meta.total_pages, p + 1))} disabled={page === meta.total_pages}
              className="px-3 py-1.5 rounded-xl border border-border-default text-sm disabled:opacity-40 hover:bg-muted transition-all">التالي</button>
          </div>
        )}
      </div>
    </div>
  );
}
