"use client";

import { useEffect, useState } from "react";

const STATUS_LABELS: Record<string, { ar: string; color: string }> = {
  draft:     { ar: "مسودة",        color: "bg-gray-100 text-gray-600" },
  pending:   { ar: "قيد الانتظار", color: "bg-yellow-100 text-yellow-700" },
  confirmed: { ar: "مؤكد",        color: "bg-green-100 text-green-700" },
  cancelled: { ar: "ملغي",        color: "bg-red-100 text-red-600" },
  expired:   { ar: "منتهي",       color: "bg-gray-100 text-gray-500" },
  refunded:  { ar: "مسترد",       color: "bg-blue-100 text-blue-600" },
  completed: { ar: "مكتمل",       color: "bg-emerald-100 text-emerald-700" },
};

const VERTICAL_ICONS: Record<string, string> = {
  flight: "✈️", hotel: "🏨", visa: "🛂", trip: "🗺️",
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [filterVertical, setFilterVertical] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, total_pages: 1 });
  const [selected, setSelected] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  // Payment confirm dialog
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    payment_id: "", method: "cash", transfer_reference: "", transfer_date: "", bank_name: "", notes: "",
  });

  useEffect(() => { fetchBookings(); }, [filterStatus, filterVertical, page]);

  async function fetchBookings() {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: String(page), limit: "20" });
      if (filterStatus) q.set("status", filterStatus);
      if (filterVertical) q.set("vertical", filterVertical);
      // Staff view: use admin query (no customer_id filter)
      const res = await fetch(`/api/v1/bookings/my?${q}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      setBookings(json.data || []);
      setMeta(json.meta || { total: 0, total_pages: 1 });
    } catch (e: any) { console.error(e); }
    finally { setLoading(false); }
  }

  async function confirmBooking(bookingId: string) {
    setActionLoading(true); setActionError(null); setActionSuccess(null);
    try {
      const res = await fetch(`/api/v1/bookings/${bookingId}/confirm`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Confirmed by staff" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      setActionSuccess("تم تأكيد الحجز بنجاح");
      setSelected(null); fetchBookings();
    } catch (e: any) { setActionError(e.message); }
    finally { setActionLoading(false); }
  }

  async function cancelBooking(bookingId: string) {
    if (!confirm("تأكيد إلغاء الحجز؟")) return;
    setActionLoading(true); setActionError(null); setActionSuccess(null);
    try {
      const res = await fetch(`/api/v1/bookings/${bookingId}/cancel`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Cancelled by staff" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      setActionSuccess(`تم الإلغاء — مبلغ الاسترداد: ${json.data?.refund_amount?.toLocaleString() ?? 0} ج.م`);
      setSelected(null); fetchBookings();
    } catch (e: any) { setActionError(e.message); }
    finally { setActionLoading(false); }
  }

  async function confirmPayment() {
    setActionLoading(true); setActionError(null);
    try {
      const body: any = { payment_id: paymentForm.payment_id, notes: paymentForm.notes || undefined };
      if (paymentForm.method === "bank_transfer") {
        body.bank_transfer_details = {
          transfer_reference: paymentForm.transfer_reference,
          transfer_date: paymentForm.transfer_date,
          bank_name: paymentForm.bank_name || undefined,
        };
      }
      const res = await fetch("/api/v1/payments/confirm", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      setActionSuccess("تم تأكيد الدفع بنجاح");
      setShowPaymentDialog(false); setSelected(null); fetchBookings();
    } catch (e: any) { setActionError(e.message); }
    finally { setActionLoading(false); }
  }

  function openPaymentDialog(b: any) {
    setPaymentForm({ payment_id: b.payment_id || "", method: "cash", transfer_reference: "", transfer_date: "", bank_name: "", notes: "" });
    setShowPaymentDialog(true);
    setActionError(null);
  }

  function getBookingSummary(b: any) {
    if (b.flight_details) return `${b.flight_details.airline} ${b.flight_details.flight_number} | ${b.flight_details.origin} → ${b.flight_details.destination}`;
    if (b.hotel_details) return `${b.hotel_details.hotel_name} | ${b.hotel_details.checkin_date} → ${b.hotel_details.checkout_date}`;
    if (b.visa_details) return `${b.visa_details.destination_country} ${b.visa_details.visa_type} | ${b.visa_details.applicant_name}`;
    if (b.trip_details) return `${b.trip_details.trip_title} | ${b.trip_details.start_date}`;
    return "—";
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">إدارة الحجوزات</h1>
          <p className="text-sm text-text-muted mt-0.5">إجمالي: {meta.total} حجز</p>
        </div>
        {actionSuccess && (
          <div className="text-sm bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-xl">✓ {actionSuccess}</div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 bg-white">
          <option value="">كل الحالات</option>
          {Object.entries(STATUS_LABELS).map(([v, { ar }]) => <option key={v} value={v}>{ar}</option>)}
        </select>
        <select value={filterVertical} onChange={e => { setFilterVertical(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 bg-white">
          <option value="">كل الأنواع</option>
          <option value="flight">✈️ رحلات</option>
          <option value="hotel">🏨 فنادق</option>
          <option value="visa">🛂 تأشيرات</option>
          <option value="trip">🗺️ رحلات سياحية</option>
        </select>
        <button onClick={() => fetchBookings()} className="h-9 px-4 rounded-xl border border-border-default text-sm hover:bg-muted transition-all">تحديث</button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light bg-muted/50">
                <th className="text-right px-4 py-3 font-semibold text-text-secondary">المرجع</th>
                <th className="text-right px-4 py-3 font-semibold text-text-secondary">النوع</th>
                <th className="text-right px-4 py-3 font-semibold text-text-secondary">التفاصيل</th>
                <th className="text-right px-4 py-3 font-semibold text-text-secondary">المبلغ</th>
                <th className="text-right px-4 py-3 font-semibold text-text-secondary">الحالة</th>
                <th className="text-right px-4 py-3 font-semibold text-text-secondary">التاريخ</th>
                <th className="text-right px-4 py-3 font-semibold text-text-secondary">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border-light animate-pulse">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : bookings.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-text-muted">لا توجد حجوزات</td></tr>
              ) : bookings.map((b: any) => {
                const status = STATUS_LABELS[b.status];
                return (
                  <tr key={b.booking_id} className={`border-b border-border-light hover:bg-muted/30 transition-colors cursor-pointer ${selected?.booking_id === b.booking_id ? "bg-brand-green/5" : ""}`}
                    onClick={() => setSelected(selected?.booking_id === b.booking_id ? null : b)}>
                    <td className="px-4 py-3 font-mono font-bold text-xs text-brand-green">{b.reference}</td>
                    <td className="px-4 py-3">{VERTICAL_ICONS[b.vertical]} {b.vertical}</td>
                    <td className="px-4 py-3 text-text-secondary max-w-[200px] truncate">{getBookingSummary(b)}</td>
                    <td className="px-4 py-3 font-bold">{b.total_amount?.toLocaleString()} ج.م</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${status?.color}`}>{status?.ar}</span></td>
                    <td className="px-4 py-3 text-text-muted text-xs">{new Date(b.created_at).toLocaleDateString("ar-EG")}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                        {b.status === "pending" && (
                          <>
                            <button onClick={() => confirmBooking(b.booking_id)} disabled={actionLoading}
                              className="px-2.5 py-1 rounded-lg bg-brand-green text-white text-xs font-medium hover:bg-brand-green-dark transition-all disabled:opacity-50">
                              تأكيد
                            </button>
                            {b.payment_id && (
                              <button onClick={() => openPaymentDialog(b)} disabled={actionLoading}
                                className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-all disabled:opacity-50">
                                دفع
                              </button>
                            )}
                          </>
                        )}
                        {["pending", "confirmed"].includes(b.status) && (
                          <button onClick={() => cancelBooking(b.booking_id)} disabled={actionLoading}
                            className="px-2.5 py-1 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-all disabled:opacity-50">
                            إلغاء
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Expanded row details */}
        {selected && (
          <div className="border-t border-border-light p-4 bg-brand-green/5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-bold text-text-primary mb-2">تفاصيل الحجز</p>
                {selected.flight_details && <>
                  <p><strong>الرحلة:</strong> {selected.flight_details.airline} {selected.flight_details.flight_number}</p>
                  <p><strong>المسار:</strong> {selected.flight_details.origin} → {selected.flight_details.destination}</p>
                  <p><strong>الركاب:</strong> {selected.flight_details.passengers?.length}</p>
                </>}
                {selected.hotel_details && <>
                  <p><strong>الفندق:</strong> {selected.hotel_details.hotel_name}</p>
                  <p><strong>الإقامة:</strong> {selected.hotel_details.nights} ليلة</p>
                  <p><strong>الغرفة:</strong> {selected.hotel_details.room_type} × {selected.hotel_details.rooms_count}</p>
                </>}
                {selected.visa_details && <>
                  <p><strong>المتقدم:</strong> {selected.visa_details.applicant_name}</p>
                  <p><strong>الجواز:</strong> {selected.visa_details.passport_number}</p>
                  <p><strong>حالة المراجعة:</strong> {selected.visa_details.review_status}</p>
                </>}
                {selected.trip_details && <>
                  <p><strong>الرحلة:</strong> {selected.trip_details.trip_title}</p>
                  <p><strong>المسافرون:</strong> {selected.trip_details.travelers_count}</p>
                </>}
              </div>
              <div>
                <p className="font-bold text-text-primary mb-2">بيانات التواصل</p>
                <p><strong>البريد:</strong> {selected.contact?.email}</p>
                <p><strong>الهاتف:</strong> {selected.contact?.phone}</p>
                {selected.expires_at && <p className="text-yellow-600 mt-2">⏳ ينتهي: {new Date(selected.expires_at).toLocaleString("ar-EG")}</p>}
              </div>
            </div>
            {actionError && <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{actionError}</p>}
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 rounded-xl border border-border-default text-sm disabled:opacity-40 hover:bg-muted transition-all">السابق</button>
          <span className="text-sm text-text-muted">{page} / {meta.total_pages}</span>
          <button onClick={() => setPage(p => Math.min(meta.total_pages, p + 1))} disabled={page === meta.total_pages}
            className="px-3 py-1.5 rounded-xl border border-border-default text-sm disabled:opacity-40 hover:bg-muted transition-all">التالي</button>
        </div>
      )}

      {/* Payment Confirm Dialog */}
      {showPaymentDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text-primary">تأكيد الدفع</h3>
              <button onClick={() => setShowPaymentDialog(false)} className="text-text-muted hover:text-text-primary">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">طريقة الدفع</label>
                <select value={paymentForm.method} onChange={e => setPaymentForm(f => ({ ...f, method: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30">
                  <option value="cash">كاش</option>
                  <option value="bank_transfer">تحويل بنكي</option>
                </select>
              </div>
              {paymentForm.method === "bank_transfer" && (<>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">رقم التحويل *</label>
                  <input value={paymentForm.transfer_reference} onChange={e => setPaymentForm(f => ({ ...f, transfer_reference: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">تاريخ التحويل *</label>
                  <input type="date" value={paymentForm.transfer_date} onChange={e => setPaymentForm(f => ({ ...f, transfer_date: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">اسم البنك</label>
                  <input value={paymentForm.bank_name} onChange={e => setPaymentForm(f => ({ ...f, bank_name: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30" />
                </div>
              </>)}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">ملاحظات</label>
                <textarea rows={2} value={paymentForm.notes} onChange={e => setPaymentForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 resize-none" />
              </div>
              {actionError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{actionError}</p>}
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowPaymentDialog(false)}
                className="flex-1 py-2.5 rounded-xl border border-border-default text-sm text-text-secondary hover:bg-muted transition-all">إلغاء</button>
              <button onClick={confirmPayment} disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-brand-green text-white text-sm font-bold hover:bg-brand-green-dark transition-all disabled:opacity-60">
                {actionLoading ? "جاري التأكيد..." : "تأكيد الدفع"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
