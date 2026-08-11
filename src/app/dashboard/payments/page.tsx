"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { crmAdapter } from "@/lib/services/crm-adapter";
import type { PaymentRecord, PaymentStatus } from "@/types/flights";

const STATUS_CONFIG: Record<PaymentStatus, { labelAr: string; labelEn: string; cls: string }> = {
  pending:   { labelAr: "معلّق",     labelEn: "Pending",   cls: "bg-yellow-100 text-yellow-700" },
  partial:   { labelAr: "جزئي",      labelEn: "Partial",   cls: "bg-blue-100 text-blue-700" },
  full:      { labelAr: "مكتمل",     labelEn: "Paid",      cls: "bg-green-100 text-green-700" },
  refunded:  { labelAr: "مسترد",     labelEn: "Refunded",  cls: "bg-gray-100 text-gray-600" },
  cancelled: { labelAr: "ملغي",      labelEn: "Cancelled", cls: "bg-red-100 text-red-700" },
};

const METHOD_CONFIG: Record<string, { labelAr: string; labelEn: string }> = {
  cash:           { labelAr: "نقدي",            labelEn: "Cash" },
  bank_transfer:  { labelAr: "تحويل بنكي",       labelEn: "Bank Transfer" },
  pos:            { labelAr: "POS",              labelEn: "POS" },
  cheque:         { labelAr: "شيك",              labelEn: "Cheque" },
};

function StatusBadge({ status, isAr }: { status: PaymentStatus; isAr: boolean }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap", cfg.cls)}>
      {isAr ? cfg.labelAr : cfg.labelEn}
    </span>
  );
}

function SummaryCard({ label, value, cls }: { label: string; value: string; cls: string }) {
  return (
    <div className={cn("rounded-2xl border p-4", cls)}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  );
}

export default function PaymentsPage() {
  const { locale } = useI18n();
  const isAr = locale === "ar";

  const [records,      setRecords]      = useState<PaymentRecord[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [isBackendDown,setIsBackendDown] = useState(false);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await crmAdapter.getMyPayments();
    if (!result.ok) {
      setError(result.error);
      if (!result.status || result.status >= 500) setIsBackendDown(true);
      setLoading(false);
      return;
    }
    setIsBackendDown(false);
    setRecords(result.data.results ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = statusFilter === "all"
    ? records
    : records.filter((r) => r.status === statusFilter);

  const totalPaid = records
    .filter((r) => r.status === "full")
    .reduce((s, r) => s + r.amount, 0);

  const totalPending = records
    .filter((r) => r.status === "pending")
    .reduce((s, r) => s + r.amount, 0);

  const totalRefunded = records
    .filter((r) => r.status === "refunded")
    .reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-text-primary">{isAr ? "سجل المدفوعات" : "Payment History"}</h1>
        <p className="text-sm text-text-muted mt-1">
          {isAr
            ? "عرض فقط — جميع المدفوعات يتم تسجيلها يدوياً من قِبل الموظفين"
            : "Read-only — all payments are recorded manually by staff"}
        </p>
      </div>

      {/* Backend-down soft degradation */}
      {isBackendDown && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3" role="status">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500 shrink-0" aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <p className="text-xs text-amber-700 flex-1">
            {isAr ? "الخادم غير متاح مؤقتاً." : "Backend temporarily unavailable."}
          </p>
          <button onClick={load} className="text-xs font-semibold text-amber-700 underline">
            {isAr ? "إعادة المحاولة" : "Retry"}
          </button>
        </div>
      )}

      {/* Non-network error */}
      {!loading && error && !isBackendDown && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center" role="alert">
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <button onClick={load} className="text-xs font-semibold text-red-700 underline">
            {isAr ? "حاول مجدداً" : "Try again"}
          </button>
        </div>
      )}

      {/* Info note — only show when there are records */}
      {!loading && records.length > 0 && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500 mt-0.5 shrink-0" aria-hidden="true">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-xs text-blue-700">
            {isAr
              ? "المدفوعات في هذه المرحلة نقدية/يدوية فقط (كاش، تحويل بنكي، POS، شيك). لا يوجد دفع إلكتروني حالياً."
              : "Payments are offline only (cash, bank transfer, POS, cheque). No online payment in this phase."}
          </p>
        </div>
      )}

      {/* Summary cards */}
      {!loading && records.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard
            label={isAr ? "إجمالي المسدّد" : "Total Paid"}
            value={`${totalPaid.toLocaleString()} EGP`}
            cls="bg-green-50 border-green-200 text-green-800"
          />
          <SummaryCard
            label={isAr ? "قيد الانتظار" : "Pending"}
            value={`${totalPending.toLocaleString()} EGP`}
            cls="bg-yellow-50 border-yellow-200 text-yellow-800"
          />
          <SummaryCard
            label={isAr ? "مسترد" : "Refunded"}
            value={`${totalRefunded.toLocaleString()} EGP`}
            cls="bg-gray-50 border-gray-200 text-gray-700"
          />
        </div>
      )}

      {/* Filter — only when records exist */}
      {!loading && records.length > 0 && (
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | "all")}
            className="h-10 px-3 border border-border-light rounded-xl text-sm focus:outline-none focus:border-brand-green bg-white text-text-primary"
          >
            <option value="all">{isAr ? "جميع الحالات" : "All statuses"}</option>
            {(Object.keys(STATUS_CONFIG) as PaymentStatus[]).map((s) => (
              <option key={s} value={s}>
                {isAr ? STATUS_CONFIG[s].labelAr : STATUS_CONFIG[s].labelEn}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-border-light p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-bg-alt flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            {isAr
              ? "لم تطلب أي خدمة من عندنا بعد، وبالتالي لا توجد مدفوعات مسجّلة على حسابك."
              : "You haven't requested any services yet, so there are no payments recorded on your account."}
          </p>
        </div>
      )}

      {/* Table — desktop */}
      {!loading && filtered.length > 0 && (
        <>
          {/* Desktop */}
          <div className="hidden sm:block bg-white rounded-2xl border border-border-light overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-bg-alt border-b border-border-light">
                <tr>
                  {[
                    isAr ? "التاريخ" : "Date",
                    isAr ? "مرجع الحجز" : "Booking Ref",
                    isAr ? "المبلغ" : "Amount",
                    isAr ? "طريقة الدفع" : "Method",
                    isAr ? "الحالة" : "Status",
                  ].map((h) => (
                    <th key={h} className="px-5 py-3 text-start text-xs font-semibold text-text-secondary">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {filtered.map((rec) => (
                  <tr key={rec.id} className="hover:bg-bg-alt transition">
                    <td className="px-5 py-4 text-text-secondary whitespace-nowrap">
                      {new Date(rec.created_at).toLocaleDateString(isAr ? "ar-EG" : "en-GB")}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-text-primary">
                      {rec.booking_reference ?? "—"}
                    </td>
                    <td className="px-5 py-4 font-bold text-text-primary whitespace-nowrap">
                      {rec.amount.toLocaleString()} {rec.currency ?? "EGP"}
                    </td>
                    <td className="px-5 py-4 text-text-secondary">
                      {isAr
                        ? (METHOD_CONFIG[rec.method]?.labelAr ?? rec.method)
                        : (METHOD_CONFIG[rec.method]?.labelEn ?? rec.method)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={rec.status} isAr={isAr} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {filtered.map((rec) => (
              <div key={rec.id} className="bg-white rounded-2xl border border-border-light p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-text-primary">
                    {rec.amount.toLocaleString()} {rec.currency ?? "EGP"}
                  </span>
                  <StatusBadge status={rec.status} isAr={isAr} />
                </div>
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>{new Date(rec.created_at).toLocaleDateString(isAr ? "ar-EG" : "en-GB")}</span>
                  <span>
                    {isAr
                      ? (METHOD_CONFIG[rec.method]?.labelAr ?? rec.method)
                      : (METHOD_CONFIG[rec.method]?.labelEn ?? rec.method)}
                  </span>
                </div>
                {rec.booking_reference && (
                  <p className="text-xs text-text-muted font-mono">{rec.booking_reference}</p>
                )}
                {rec.notes && <p className="text-xs text-text-secondary">{rec.notes}</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
