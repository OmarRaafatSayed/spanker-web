"use client";

/**
 * /dashboard/visa — Visa Applications Page
 *
 * REFACTORED (Task 1):
 *   - Removed local status config / inline if-else chains
 *   - All status labels, colours, and mapping come from @/types/visa-states
 *   - Data fetched via crmAdapter (not raw getMyVisaApplications from api.ts)
 *   - isTerminalStatus() used instead of hardcoded terminal array
 *   - Graceful empty-state + backend-down fallback
 */

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { useVisaApplications } from "@/modules/visa";
import {
  PORTAL_STATUS_LABELS,
  PORTAL_STATUS_VARIANT,
  PORTAL_STATUSES,
  isTerminalStatus,
  type PortalStatus,
} from "@/types/visa-states";
import type { NormalizedVisaApplication } from "@/modules/visa";

// =============================================================================
// Status badge — reads purely from visa-states, no local config
// =============================================================================

const VARIANT_CLS: Record<string, string> = {
  warning:     "bg-yellow-100 text-yellow-700",
  info:        "bg-blue-100 text-blue-700",
  default:     "bg-purple-100 text-purple-700",
  success:     "bg-green-100 text-green-700",
  destructive: "bg-red-100 text-red-700",
};

function StatusBadge({ status, isAr }: { status: PortalStatus; isAr: boolean }) {
  const variant = PORTAL_STATUS_VARIANT[status];
  const label = isAr
    ? AR_STATUS_LABELS[status] ?? PORTAL_STATUS_LABELS[status]
    : PORTAL_STATUS_LABELS[status];
  return (
    <span className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full", VARIANT_CLS[variant])}>
      {label}
    </span>
  );
}

// Arabic overrides for portal status labels
const AR_STATUS_LABELS: Record<PortalStatus, string> = {
  pending_documents: "بانتظار المستندات",
  documents_review:  "قيد مراجعة المستندات",
  docs_approved:     "المستندات مقبولة",
  in_progress:       "جاري التنفيذ",
  completed:         "مكتمل",
  cancelled:         "ملغي / مرفوض",
};

// Steps shown in the timeline (terminal states excluded from active flow)
const ACTIVE_STEPS: PortalStatus[] = [
  "pending_documents",
  "documents_review",
  "docs_approved",
  "in_progress",
  "completed",
];

// =============================================================================
// Visa timeline — step indicator driven by FSM order
// =============================================================================

function VisaTimeline({ status, isAr }: { status: PortalStatus; isAr: boolean }) {
  const isCancelled = status === "cancelled";
  const steps = isCancelled ? [...ACTIVE_STEPS] : ACTIVE_STEPS;
  const currentIdx = steps.indexOf(isCancelled ? "in_progress" : status);

  return (
    <div className="relative mt-4">
      <ol className="flex flex-col gap-0">
        {steps.map((step, idx) => {
          const isPast    = idx < currentIdx;
          const isCurrent = step === status;
          const isFuture  = idx > currentIdx;
          const isLast    = idx === steps.length - 1;
          const variant   = PORTAL_STATUS_VARIANT[step];

          return (
            <li key={step} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0 z-10",
                    isCurrent
                      ? VARIANT_CLS[variant] + " border-current"
                      : isPast
                        ? "bg-brand-green/20 border-brand-green text-brand-green"
                        : "bg-white border-border-light text-text-muted"
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isPast ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>
                {!isLast && (
                  <div className={cn("w-0.5 h-8 my-0.5", isPast ? "bg-brand-green" : "bg-border-light")} />
                )}
              </div>

              <div className="pt-1 pb-4">
                <p className={cn(
                  "text-sm font-semibold",
                  isCurrent ? "text-brand-green" : isPast ? "text-brand-green" : "text-text-muted"
                )}>
                  {isAr ? AR_STATUS_LABELS[step] : PORTAL_STATUS_LABELS[step]}
                </p>
                {isCurrent && (
                  <p className="text-xs text-text-muted mt-0.5">
                    {isAr ? "الحالة الحالية" : "Current status"}
                  </p>
                )}
              </div>
            </li>
          );
        })}

        {/* Cancelled terminal node */}
        {isCancelled && (
          <li className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 bg-gray-100 border-gray-300 text-gray-500">
                ✕
              </div>
            </div>
            <div className="pt-1">
              <p className="text-sm font-semibold text-gray-500">
                {isAr ? AR_STATUS_LABELS.cancelled : PORTAL_STATUS_LABELS.cancelled}
              </p>
              <p className="text-xs text-text-muted mt-0.5">{isAr ? "الحالة الحالية" : "Current status"}</p>
            </div>
          </li>
        )}
      </ol>
    </div>
  );
}

// =============================================================================
// Visa card
// =============================================================================

function VisaCard({ app, isAr }: { app: NormalizedVisaApplication; isAr: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const terminal = isTerminalStatus(app.status);

  return (
    <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-start p-5 flex items-center gap-4 hover:bg-bg-alt transition"
        aria-expanded={expanded}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-bold text-text-primary">{app.destination_country}</span>
            <StatusBadge status={app.status} isAr={isAr} />
            {terminal && (
              <span className="text-xs text-text-muted">{isAr ? "(نهائي)" : "(terminal)"}</span>
            )}
          </div>
          <p className="text-xs text-text-muted mt-1">
            {isAr ? "جواز السفر:" : "Passport:"} {app.passport_number}
          </p>
          {app.appointment_date && (
            <p className="text-xs text-brand-green font-semibold mt-1">
              {isAr ? "موعد السفارة:" : "Appointment:"}{" "}
              {new Date(app.appointment_date).toLocaleDateString(isAr ? "ar-EG" : "en-GB")}
            </p>
          )}
        </div>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={cn("shrink-0 text-text-muted transition-transform", expanded && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {expanded && (
        <div className="border-t border-border-light px-5 pb-5">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-4 text-sm">
            <div>
              <p className="text-xs text-text-muted">{isAr ? "اسم العميل" : "Client name"}</p>
              <p className="font-medium text-text-primary">{app.client_name}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">{isAr ? "تاريخ التقديم" : "Submitted"}</p>
              <p className="font-medium text-text-primary">
                {new Date(app.created_at).toLocaleDateString(isAr ? "ar-EG" : "en-GB")}
              </p>
            </div>
            {app.appointment_date && (
              <div className="col-span-2">
                <p className="text-xs text-text-muted">{isAr ? "موعد السفارة" : "Embassy appointment"}</p>
                <p className="font-medium text-brand-green">
                  {new Date(app.appointment_date).toLocaleString(isAr ? "ar-EG" : "en-GB")}
                </p>
              </div>
            )}
            {app.notes && (
              <div className="col-span-2">
                <p className="text-xs text-text-muted">{isAr ? "ملاحظات" : "Notes"}</p>
                <p className="font-medium text-text-primary">{app.notes}</p>
              </div>
            )}
          </div>

          <div className="mt-4 border-t border-border-light pt-4">
            <p className="text-xs font-semibold text-text-secondary mb-2">
              {isAr ? "مراحل الطلب" : "Application progress"}
            </p>
            <VisaTimeline status={app.status} isAr={isAr} />
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Page
// =============================================================================

export default function VisaPage() {
  const { locale } = useI18n();
  const isAr = locale === "ar";

  const { applications, isLoading, error, isBackendDown, refetch } = useVisaApplications();

  const [filter, setFilter]   = useState<PortalStatus | "all">("all");
  const [search, setSearch]   = useState("");

  const filtered = applications.filter(a => {
    const matchStatus = filter === "all" || a.status === filter;
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      a.destination_country.toLowerCase().includes(q) ||
      a.passport_number.toLowerCase().includes(q) ||
      a.client_name.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-text-primary">
          {isAr ? "طلبات الفيزا" : "Visa Applications"}
        </h1>
        <p className="text-sm text-text-muted mt-1">
          {isAr ? "تابع حالة طلبات الفيزا الخاصة بك" : "Track the status of your visa applications"}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          placeholder={isAr ? "ابحث بالدولة أو رقم الجواز..." : "Search by country or passport..."}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 h-10 px-4 border border-border-light rounded-xl text-sm focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 bg-white"
          aria-label={isAr ? "بحث" : "Search"}
        />
        <select
          value={filter}
          onChange={e => setFilter(e.target.value as PortalStatus | "all")}
          className="h-10 px-3 border border-border-light rounded-xl text-sm focus:outline-none focus:border-brand-green bg-white text-text-primary"
          aria-label={isAr ? "فلتر الحالة" : "Status filter"}
        >
          <option value="all">{isAr ? "جميع الحالات" : "All statuses"}</option>
          {PORTAL_STATUSES.map(s => (
            <option key={s} value={s}>
              {isAr ? AR_STATUS_LABELS[s] : PORTAL_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {/* Backend-down soft degradation */}
      {isBackendDown && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3" role="status">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500 shrink-0" aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <p className="text-xs text-amber-700">
            {isAr
              ? "الخادم غير متاح مؤقتاً. تعرض البيانات المحفوظة."
              : "Backend temporarily unavailable. Showing cached data."}
          </p>
          <button onClick={refetch} className="ms-auto text-xs font-semibold text-amber-700 underline">
            {isAr ? "إعادة المحاولة" : "Retry"}
          </button>
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-3" aria-label={isAr ? "جاري التحميل" : "Loading"} aria-busy="true">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Error (non-network) */}
      {!isLoading && error && !isBackendDown && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center" role="alert">
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <button onClick={refetch} className="text-xs font-semibold text-red-700 underline">
            {isAr ? "حاول مجدداً" : "Try again"}
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-border-light p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-bg-alt flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted" aria-hidden="true">
              <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <p className="font-semibold text-text-primary">{isAr ? "لا توجد طلبات" : "No applications"}</p>
          <p className="text-sm text-text-muted mt-1">
            {isAr
              ? "لم يتم العثور على طلبات فيزا مرتبطة بحسابك."
              : "No visa applications linked to your account yet."}
          </p>
          <p className="text-xs text-text-muted mt-2">
            {isAr
              ? "إذا قدّمت طلباً مسبقاً، تواصل مع الموظف لربطه بحسابك."
              : "If you've already submitted, contact staff to link it to your account."}
          </p>
        </div>
      )}

      {/* Applications list */}
      {!isLoading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(app => (
            <VisaCard key={app.id} app={app} isAr={isAr} />
          ))}
        </div>
      )}
    </div>
  );
}
