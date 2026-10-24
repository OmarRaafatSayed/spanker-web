"use client";

import { useEffect, useState } from "react";
import { BulkActions } from "@/components/admin/BulkActions";
import { AdvancedFilters, FilterValues } from "@/components/admin/AdvancedFilters";
import { ExportButton } from "@/components/admin/ExportButton";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Wifi, WifiOff } from "lucide-react";
import { useRealtimeBookings } from "@/hooks/useRealtimeBookings";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { toast } from "sonner";

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
  const [filters, setFilters] = useState<FilterValues>({ status: "" });  // empty = show all statuses
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, total_pages: 1 });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [staffMembers, setStaffMembers] = useState<{ id: string; name: string }[]>([]);
  const [quickSearch, setQuickSearch] = useState("");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    payment_id: "", method: "cash", transfer_reference: "", transfer_date: "", bank_name: "", notes: "",
  });

  useEffect(() => { fetchBookings(); fetchStaff(); }, [filters, page]);

  const { isConnected } = useRealtimeBookings({
    onInsert: () => { toast.info("حجز جديد تم إضافته"); fetchBookings(); },
    onUpdate: (b) => setBookings(prev => prev.map(x => x.booking_id === b.id ? { ...x, ...b } : x)),
    onDelete: (b) => setBookings(prev => prev.filter(x => x.booking_id !== b.id)),
  });

  async function fetchStaff() {
    try {
      const res = await fetch("/api/admin/staff");
      if (res.ok) { const j = await res.json(); setStaffMembers(j.data || []); }
    } catch { /* ignore */ }
  }

  async function fetchBookings() {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        page: String(page), limit: "20",
        ...(filters.status && { status: filters.status }),
        ...(filters.vertical && { vertical: filters.vertical }),
        ...(filters.date_from && { date_from: filters.date_from }),
        ...(filters.date_to && { date_to: filters.date_to }),
        ...(filters.amount_min && { amount_min: filters.amount_min }),
        ...(filters.amount_max && { amount_max: filters.amount_max }),
        ...(filters.assigned_to && { assigned_to: filters.assigned_to }),
        ...(filters.search && { search: filters.search }),
      });
      const res = await fetch(`/api/admin/bookings?${q}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      // Normalize travel_requests rows → shape the page expects
      const normalized = (json.data || []).map((row: any) => ({
        ...row,
        booking_id: row.id,
        reference:  row.booking_reference ?? row.id?.slice(0, 8).toUpperCase(),
        status:     row.booking_status ?? row.status,
      }));
      setBookings(normalized);
      setMeta(json.meta || { total: 0, total_pages: 1 });
    } catch (e: any) { console.error(e); }
    finally { setLoading(false); }
  }

  function handleFiltersChange(f: FilterValues) { setFilters(f); setPage(1); }
  function handleQuickSearch(e: React.FormEvent) {
    e.preventDefault(); setFilters({ ...filters, search: quickSearch }); setPage(1);
  }

  async function confirmBooking(id: string) {
    setActionLoading(true); setActionError(null); setActionSuccess(null);
    try {
      const res = await fetch(`/api/v1/bookings/${id}/confirm`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Confirmed by staff" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      setActionSuccess("تم تأكيد الحجز بنجاح"); fetchBookings();
    } catch (e: any) { setActionError(e.message); }
    finally { setActionLoading(false); }
  }

  async function cancelBooking(id: string) {
    if (!confirm("تأكيد إلغاء الحجز؟")) return;
    setActionLoading(true); setActionError(null); setActionSuccess(null);
    try {
      const res = await fetch(`/api/v1/bookings/${id}/cancel`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Cancelled by staff" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      setActionSuccess(`تم الإلغاء`); fetchBookings();
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
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      setActionSuccess("تم تأكيد الدفع بنجاح"); setShowPaymentDialog(false); fetchBookings();
    } catch (e: any) { setActionError(e.message); }
    finally { setActionLoading(false); }
  }

  function openPaymentDialog(b: any) {
    setPaymentForm({ payment_id: b.payment_id || "", method: "cash", transfer_reference: "", transfer_date: "", bank_name: "", notes: "" });
    setShowPaymentDialog(true); setActionError(null);
  }

  function getSummary(b: any) {
    if (b.flight_details) return `${b.flight_details.airline} ${b.flight_details.flight_number} | ${b.flight_details.origin} → ${b.flight_details.destination}`;
    if (b.hotel_details) return `${b.hotel_details.hotel_name} | ${b.hotel_details.checkin_date}`;
    if (b.visa_details) return `${b.visa_details.destination_country} | ${b.visa_details.applicant_name}`;
    if (b.trip_details) return `${b.trip_details.trip_title}`;
    return "—";
  }

  function toggleSelectAll() {
    setSelectedIds(selectedIds.length === bookings.length ? [] : bookings.map(b => b.booking_id));
  }
  function toggleSelect(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }
  function handleBulkComplete() { setSelectedIds([]); fetchBookings(); }

  useKeyboardShortcuts([
    { key: "f", ctrl: true, description: "Focus search", action: () => { (document.querySelector('input[type="text"]') as HTMLInputElement)?.focus(); } },
    { key: "r", ctrl: true, description: "Refresh", action: () => { fetchBookings(); toast.info("تم التحديث"); } },
  ]);

  // ── JSX ──────────────────────────────────────────────────────────────────

  const ActionButtons = ({ b }: { b: any }) => (
    <div className="flex gap-1.5">
      {b.status === "pending" && (
        <button onClick={() => confirmBooking(b.booking_id)} disabled={actionLoading}
          className="px-2.5 py-1 rounded-lg bg-brand-green text-white text-xs font-medium disabled:opacity-50">
          تأكيد
        </button>
      )}
      {["pending", "confirmed"].includes(b.status) && (
        <button onClick={() => cancelBooking(b.booking_id)} disabled={actionLoading}
          className="px-2.5 py-1 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 disabled:opacity-50">
          إلغاء
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-text-primary">إدارة الحجوزات</h1>
            <p className="text-sm text-text-muted mt-0.5">إجمالي: {meta.total} حجز</p>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted text-xs">
            {isConnected
              ? <><Wifi className="h-3 w-3 text-green-600" /><span className="text-green-600">متصل</span></>
              : <><WifiOff className="h-3 w-3 text-gray-400" /><span className="text-gray-400">غير متصل</span></>
            }
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ExportButton filters={filters} disabled={loading || bookings.length === 0} />
          {actionSuccess && (
            <span className="text-xs bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-xl">✓ {actionSuccess}</span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 flex-wrap items-stretch sm:items-center">
        <form onSubmit={handleQuickSearch} className="w-full sm:flex-1 sm:max-w-xs">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text" placeholder="بحث سريع..."
              value={quickSearch} onChange={e => setQuickSearch(e.target.value)}
              className="h-9 w-full pr-10 pl-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 bg-white"
            />
          </div>
        </form>
        <div className="flex gap-2 flex-wrap">
          <select value={filters.status || ""} onChange={e => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}
            className="h-9 px-3 rounded-xl border border-border-default text-sm bg-white">
            <option value="">كل الحالات</option>
            {Object.entries(STATUS_LABELS).map(([v, { ar }]) => <option key={v} value={v}>{ar}</option>)}
          </select>
          <select value={filters.vertical || ""} onChange={e => { setFilters({ ...filters, vertical: e.target.value }); setPage(1); }}
            className="h-9 px-3 rounded-xl border border-border-default text-sm bg-white">
            <option value="">كل الأنواع</option>
            <option value="flight">✈️ رحلات</option>
            <option value="hotel">🏨 فنادق</option>
            <option value="visa">🛂 تأشيرات</option>
            <option value="trip">🗺️ رحلات سياحية</option>
          </select>
          <AdvancedFilters filters={filters} onFiltersChange={handleFiltersChange} staffMembers={staffMembers} />
          <button onClick={fetchBookings} className="h-9 px-3 rounded-xl border border-border-default text-sm hover:bg-muted transition-all">
            تحديث
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <BulkActions selectedIds={selectedIds} onActionComplete={handleBulkComplete} staffMembers={staffMembers} />
      )}

      {/* ── MOBILE: cards ── */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />)
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 text-text-muted">لا توجد حجوزات</div>
        ) : bookings.map((b: any) => {
          const status = STATUS_LABELS[b.status];
          return (
            <div key={b.booking_id}
              className={`bg-white rounded-2xl border p-4 space-y-2.5 ${selectedIds.includes(b.booking_id) ? "border-brand-green" : "border-border-light"}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Checkbox checked={selectedIds.includes(b.booking_id)} onCheckedChange={() => toggleSelect(b.booking_id)} />
                  <a href={`/admin/bookings/${b.booking_id}`} className="font-mono font-bold text-xs text-brand-green hover:underline">
                    {b.reference}
                  </a>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${status?.color}`}>{status?.ar}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">{VERTICAL_ICONS[b.vertical]} {b.vertical}</span>
                <span className="font-bold">{b.total_amount?.toLocaleString()} ج.م</span>
              </div>
              <p className="text-xs text-text-muted truncate">{getSummary(b)}</p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-text-muted">{new Date(b.created_at).toLocaleDateString("ar-EG")}</span>
                <ActionButtons b={b} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── DESKTOP: table ── */}
      <div className="hidden sm:block bg-white rounded-2xl border border-border-light overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light bg-muted/50">
                <th className="text-right px-4 py-3 w-10">
                  <Checkbox
                    checked={bookings.length > 0 && selectedIds.length === bookings.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
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
                    {Array.from({ length: 8 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded" /></td>)}
                  </tr>
                ))
              ) : bookings.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-text-muted">لا توجد حجوزات</td></tr>
              ) : bookings.map((b: any) => {
                const status = STATUS_LABELS[b.status];
                return (
                  <tr key={b.booking_id}
                    className={`border-b border-border-light hover:bg-muted/30 transition-colors ${selectedIds.includes(b.booking_id) ? "bg-blue-50" : ""}`}>
                    <td className="px-4 py-3">
                      <Checkbox checked={selectedIds.includes(b.booking_id)} onCheckedChange={() => toggleSelect(b.booking_id)} />
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-xs text-brand-green">
                      <a href={`/admin/bookings/${b.booking_id}`} className="hover:underline">{b.reference}</a>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{VERTICAL_ICONS[b.vertical]} {b.vertical}</td>
                    <td className="px-4 py-3 text-text-secondary max-w-[180px] truncate">{getSummary(b)}</td>
                    <td className="px-4 py-3 font-bold whitespace-nowrap">{b.total_amount?.toLocaleString()} ج.م</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status?.color}`}>{status?.ar}</span>
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">{new Date(b.created_at).toLocaleDateString("ar-EG")}</td>
                    <td className="px-4 py-3"><ActionButtons b={b} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {meta.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 rounded-xl border border-border-default text-sm disabled:opacity-40 hover:bg-muted">السابق</button>
          <span className="text-sm text-text-muted">{page} / {meta.total_pages}</span>
          <button onClick={() => setPage(p => Math.min(meta.total_pages, p + 1))} disabled={page === meta.total_pages}
            className="px-3 py-1.5 rounded-xl border border-border-default text-sm disabled:opacity-40 hover:bg-muted">التالي</button>
        </div>
      )}

      {/* Payment Dialog */}
      {showPaymentDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">تأكيد الدفع</h3>
              <button onClick={() => setShowPaymentDialog(false)} className="text-text-muted hover:text-text-primary">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">طريقة الدفع</label>
                <select value={paymentForm.method} onChange={e => setPaymentForm(f => ({ ...f, method: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-border-default text-sm">
                  <option value="cash">كاش</option>
                  <option value="bank_transfer">تحويل بنكي</option>
                </select>
              </div>
              {paymentForm.method === "bank_transfer" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">رقم التحويل *</label>
                    <input value={paymentForm.transfer_reference} onChange={e => setPaymentForm(f => ({ ...f, transfer_reference: e.target.value }))}
                      className="w-full h-10 px-3 rounded-xl border border-border-default text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">تاريخ التحويل *</label>
                    <input type="date" value={paymentForm.transfer_date} onChange={e => setPaymentForm(f => ({ ...f, transfer_date: e.target.value }))}
                      className="w-full h-10 px-3 rounded-xl border border-border-default text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">اسم البنك</label>
                    <input value={paymentForm.bank_name} onChange={e => setPaymentForm(f => ({ ...f, bank_name: e.target.value }))}
                      className="w-full h-10 px-3 rounded-xl border border-border-default text-sm" />
                  </div>
                </>
              )}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">ملاحظات</label>
                <textarea rows={2} value={paymentForm.notes} onChange={e => setPaymentForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-border-default text-sm resize-none" />
              </div>
              {actionError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{actionError}</p>}
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowPaymentDialog(false)}
                className="flex-1 py-2.5 rounded-xl border border-border-default text-sm text-text-secondary hover:bg-muted">إلغاء</button>
              <button onClick={confirmPayment} disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-brand-green text-white text-sm font-bold disabled:opacity-60">
                {actionLoading ? "جاري التأكيد..." : "تأكيد الدفع"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
