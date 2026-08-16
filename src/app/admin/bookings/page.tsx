"use client";

/**
 * /admin/bookings
 * Booking list + detail drawer with payment recording and voucher link.
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface Transaction { id: string; amount_paid: number; remaining_balance: number; payment_method: string; paid_at: string | null; receipt_url: string | null; }
interface Booking {
  id: string; status: string; booking_reference: string | null; voucher_url: string | null;
  created_at: string; completed_at: string | null;
  users: { id: string; email: string; first_name: string | null; last_name: string | null; phone: string | null; } | null;
  quotations: { id: string; total_amount: number; currency: string; status: string; } | null;
  financial_transactions: Transaction[];
  total_paid?: number;
  remaining_balance?: number;
}

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  PENDING_PAYMENT: { label: "بانتظار الدفع", cls: "bg-yellow-100 text-yellow-700" },
  CONFIRMED:       { label: "مؤكد",          cls: "bg-green-100 text-green-700"  },
  COMPLETED:       { label: "مكتمل",         cls: "bg-teal-100 text-teal-700"    },
  CANCELLED:       { label: "ملغي",          cls: "bg-gray-100 text-gray-600"    },
};

const METHODS = ["CASH", "BANK_TRANSFER", "POS", "CREDIT_CARD", "CHEQUE"] as const;
const METHOD_LABELS: Record<string, string> = {
  CASH: "نقداً", BANK_TRANSFER: "تحويل", POS: "POS",
  CREDIT_CARD: "بطاقة ائتمان", CHEQUE: "شيك",
};

function getToken() {
  try {
    const raw = localStorage.getItem("customer_portal_session");
    if (!raw) return "";
    return (JSON.parse(raw) as { session?: { access_token?: string } })?.session?.access_token ?? "";
  } catch { return ""; }
}
async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(path, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}`, ...(opts?.headers ?? {}) },
  });
  return res.json();
}
function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ar-EG", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Booking detail panel ─────────────────────────────────────────────────────
function BookingDetail({ booking, onClose, onUpdated }: {
  booking: Booking;
  onClose: () => void;
  onUpdated: (b: Booking) => void;
}) {
  const [detail, setDetail]     = useState<Booking | null>(null);
  const [loading, setLoading]   = useState(true);
  const [amount, setAmount]     = useState("");
  const [method, setMethod]     = useState<string>("CASH");
  const [receipt, setReceipt]   = useState("");
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/admin/bookings/${booking.id}`).then(res => {
      if (res.success) setDetail(res.data);
      setLoading(false);
    });
  }, [booking.id]);

  async function recordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    setSaving(true);
    const res = await apiFetch(`/api/admin/bookings/${booking.id}/payment`, {
      method: "POST",
      body: JSON.stringify({ amount_paid: Number(amount), payment_method: method, receipt_url: receipt || null }),
    });
    setSaving(false);
    if (res.success) {
      setDetail(res.data);
      onUpdated(res.data);
      setAmount("");
      setReceipt("");
    }
  }

  const iCls = "w-full h-9 px-3 border border-border-light rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-green/50 bg-white";
  const b = detail ?? booking;
  const totalAmount = b.quotations?.total_amount ?? 0;
  const totalPaid   = b.total_paid ?? b.financial_transactions?.reduce((s, t) => s + t.amount_paid, 0) ?? 0;
  const remaining   = b.remaining_balance ?? (totalAmount - totalPaid);

  return (
    <div className="w-80 shrink-0 bg-white rounded-2xl border border-border-light flex flex-col self-start sticky top-6 max-h-[calc(100vh-6rem)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
        <div>
          <p className="font-bold text-sm text-text-primary">{b.booking_reference ?? b.id.slice(0, 12)}</p>
          <p className="text-xs text-text-muted">{b.users ? `${b.users.first_name ?? ""} ${b.users.last_name ?? ""}`.trim() || b.users.email : "—"}</p>
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-brand-green border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="p-4 space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "الإجمالي",   value: `${totalAmount.toLocaleString("ar-EG")} ${b.quotations?.currency ?? ""}`, cls: "" },
              { label: "المدفوع",    value: `${totalPaid.toLocaleString("ar-EG")}`,  cls: "text-green-600" },
              { label: "المتبقي",    value: `${remaining.toLocaleString("ar-EG")}`,  cls: remaining > 0 ? "text-red-500" : "text-green-600" },
            ].map(({ label, value, cls }) => (
              <div key={label} className="bg-bg-alt rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-text-muted">{label}</p>
                <p className={cn("text-xs font-bold mt-0.5", cls)}>{value}</p>
              </div>
            ))}
          </div>

          {/* Status + voucher */}
          <div className="flex items-center justify-between">
            <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", STATUS_CFG[b.status]?.cls ?? "bg-gray-100 text-gray-600")}>
              {STATUS_CFG[b.status]?.label ?? b.status}
            </span>
            {b.voucher_url && (
              <a href={b.voucher_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-green font-semibold flex items-center gap-1 hover:underline">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                تحميل الفاوتشر
              </a>
            )}
          </div>

          {/* Transaction history */}
          {(b.financial_transactions ?? []).length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">سجل المدفوعات</p>
              <div className="space-y-1.5">
                {(b.financial_transactions ?? []).map(t => (
                  <div key={t.id} className="flex items-center justify-between text-xs bg-bg-alt rounded-lg px-3 py-2">
                    <div>
                      <span className="font-semibold text-green-600">{t.amount_paid.toLocaleString("ar-EG")}</span>
                      <span className="text-text-muted mr-1.5">{METHOD_LABELS[t.payment_method] ?? t.payment_method}</span>
                    </div>
                    <span className="text-text-muted">{fmtDate(t.paid_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Record payment */}
          {b.status !== "CANCELLED" && b.status !== "COMPLETED" && (
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">تسجيل دفعة</p>
              <form onSubmit={recordPayment} className="space-y-2">
                <div className="flex gap-2">
                  <input type="number" min={1} value={amount} onChange={e => setAmount(e.target.value)} placeholder="المبلغ" className={cn(iCls, "flex-1")} required />
                  <select value={method} onChange={e => setMethod(e.target.value)} className={cn(iCls, "w-28")}>
                    {METHODS.map(m => <option key={m} value={m}>{METHOD_LABELS[m]}</option>)}
                  </select>
                </div>
                <input value={receipt} onChange={e => setReceipt(e.target.value)} placeholder="رابط الإيصال (اختياري)" className={iCls} dir="ltr" />
                <button type="submit" disabled={saving} className="w-full h-9 bg-brand-green text-white text-xs font-bold rounded-lg hover:bg-brand-green-dark disabled:opacity-40 transition">
                  {saving ? "جاري التسجيل…" : "تسجيل الدفعة"}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminBookingsPage() {
  const [bookings, setBookings]   = useState<Booking[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<Booking | null>(null);
  const [page, setPage]           = useState(1);
  const [total, setTotal]         = useState(0);
  const [filterStatus, setFilterStatus] = useState("");
  const LIMIT = 20;

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
    if (filterStatus) params.set("status", filterStatus);
    const res = await apiFetch(`/api/admin/bookings?${params}`);
    if (res.success) { setBookings(res.data ?? []); setTotal(res.total ?? 0); }
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => { load(1); setPage(1); }, [load]);

  function handleUpdated(updated: Booking) {
    setBookings(p => p.map(b => b.id === updated.id ? { ...b, ...updated } : b));
    setSelected(prev => prev?.id === updated.id ? { ...prev, ...updated } : prev);
  }

  const totalPages = Math.ceil(total / LIMIT);
  const iCls = "h-9 px-3 border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 bg-white";

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-text-primary">الحجوزات</h1>
        <p className="text-sm text-text-muted mt-0.5">{total} حجز</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 bg-white rounded-xl border border-border-light p-3">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={cn(iCls, "w-44")}>
          <option value="">كل الحالات</option>
          {Object.entries(STATUS_CFG).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
        </select>
        <button onClick={() => load(1)} className="h-9 px-4 bg-bg-alt border border-border-light rounded-lg text-sm font-semibold text-text-secondary hover:bg-gray-100 transition">تحديث</button>
      </div>

      <div className="flex gap-4">
        {/* Table */}
        <div className={cn("bg-white rounded-2xl border border-border-light overflow-hidden min-w-0", selected ? "flex-1" : "w-full")}>
          {loading ? (
            <div className="flex justify-center py-14"><div className="w-7 h-7 border-4 border-brand-green border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bg-alt border-b border-border-light text-xs text-text-muted font-semibold">
                    <th className="text-right px-4 py-3">مرجع الحجز</th>
                    <th className="text-right px-4 py-3">العميل</th>
                    <th className="text-right px-4 py-3">الإجمالي</th>
                    <th className="text-right px-4 py-3">الحالة</th>
                    <th className="text-right px-4 py-3 hidden lg:table-cell">التاريخ</th>
                    <th className="text-right px-4 py-3">تفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {bookings.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-text-muted">لا توجد حجوزات</td></tr>
                  ) : (
                    bookings.map(b => {
                      const totalPaid = b.total_paid ?? 0;
                      const totalAmt  = b.quotations?.total_amount ?? 0;
                      const remaining = b.remaining_balance ?? (totalAmt - totalPaid);
                      return (
                        <tr key={b.id} className={cn("hover:bg-bg-alt/40 transition-colors cursor-pointer", selected?.id === b.id && "bg-bg-alt")} onClick={() => setSelected(selected?.id === b.id ? null : b)}>
                          <td className="px-4 py-3">
                            <p className="font-mono text-xs font-semibold text-brand-green">{b.booking_reference ?? b.id.slice(0, 12)}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-text-primary text-sm">
                              {b.users ? `${b.users.first_name ?? ""} ${b.users.last_name ?? ""}`.trim() || b.users.email : "—"}
                            </p>
                            <p className="text-[11px] text-text-muted">{b.users?.phone ?? ""}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-text-primary">{totalAmt.toLocaleString("ar-EG")} {b.quotations?.currency}</p>
                            {remaining > 0 && <p className="text-[11px] text-red-500">متبقي: {remaining.toLocaleString("ar-EG")}</p>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", STATUS_CFG[b.status]?.cls ?? "bg-gray-100 text-gray-600")}>
                              {STATUS_CFG[b.status]?.label ?? b.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell text-xs text-text-muted">{fmtDate(b.created_at)}</td>
                          <td className="px-4 py-3">
                            <button className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border-light hover:bg-bg-alt transition" onClick={e => { e.stopPropagation(); setSelected(selected?.id === b.id ? null : b); }}>
                              تفاصيل
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-border-light flex items-center justify-between">
              <span className="text-xs text-text-muted">صفحة {page} من {totalPages}</span>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => { setPage(p => p - 1); load(page - 1); }} className="h-8 px-3 border border-border-light rounded-lg text-xs disabled:opacity-40 hover:bg-bg-alt transition">السابق</button>
                <button disabled={page === totalPages} onClick={() => { setPage(p => p + 1); load(page + 1); }} className="h-8 px-3 border border-border-light rounded-lg text-xs disabled:opacity-40 hover:bg-bg-alt transition">التالي</button>
              </div>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <BookingDetail
            booking={selected}
            onClose={() => setSelected(null)}
            onUpdated={handleUpdated}
          />
        )}
      </div>
    </div>
  );
}
