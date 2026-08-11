"use client";

/**
 * /dashboard/travel — Travel Requests List
 *
 * REFACTORED (Task 1):
 *   - Removed local RequestStatus type and STATUS_CONFIG map
 *   - All status labels/colours imported from @/types/visa-states
 *   - Fetches real travel_requests via Supabase RPC (get_my_travel_requests)
 *   - Falls back to empty state on error — no crash
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { supabase } from "@/lib/supabase";
import {
  PORTAL_STATUS_LABELS,
  PORTAL_STATUS_VARIANT,
  normalizeToPortalStatus,
  type PortalStatus,
} from "@/types/visa-states";
import type { TravelRequest } from "@/types";

// =============================================================================
// Status badge — purely from visa-states
// =============================================================================

const VARIANT_CLS: Record<string, string> = {
  warning:     "bg-yellow-100 text-yellow-700",
  info:        "bg-blue-100 text-blue-700",
  default:     "bg-purple-100 text-purple-700",
  success:     "bg-green-100 text-green-700",
  destructive: "bg-red-100 text-red-700",
};

const AR_STATUS_LABELS: Record<PortalStatus, string> = {
  pending_documents: "بانتظار المستندات",
  documents_review:  "قيد المراجعة",
  docs_approved:     "المستندات مقبولة",
  in_progress:       "جاري التنفيذ",
  completed:         "مكتمل",
  cancelled:         "ملغي",
};

function StatusBadge({ status, isAr }: { status: PortalStatus; isAr: boolean }) {
  const variant = PORTAL_STATUS_VARIANT[status];
  const label = isAr ? AR_STATUS_LABELS[status] : PORTAL_STATUS_LABELS[status];
  return (
    <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap", VARIANT_CLS[variant])}>
      {label}
    </span>
  );
}

// =============================================================================
// Travel type labels
// =============================================================================

const TRAVEL_TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  visa_only:    { ar: "فيزا فقط",     en: "Visa Only" },
  visa_flight:  { ar: "فيزا + طيران", en: "Visa + Flight" },
  visa_hotel:   { ar: "فيزا + فندق",  en: "Visa + Hotel" },
  full_package: { ar: "باقة كاملة",   en: "Full Package" },
};

// =============================================================================
// Page
// =============================================================================

export default function TravelRequestsPage() {
  const { locale } = useI18n();
  const isAr = locale === "ar";

  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcErr } = await supabase.rpc("get_my_travel_requests");
      if (rpcErr) throw rpcErr;
      setRequests((data as TravelRequest[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load travel requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            {isAr ? "طلبات السفر" : "Travel Requests"}
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            {isAr
              ? `${requests.length} طلب`
              : `${requests.length} request${requests.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link
          href="/dashboard/travel/new"
          className="flex items-center gap-2 bg-brand-green text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-green-dark transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {isAr ? "طلب جديد" : "New Request"}
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3" aria-busy="true">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse" />)}
        </div>
      )}

      {/* Error — soft, with retry */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center" role="alert">
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <button onClick={load} className="text-xs font-semibold text-red-700 underline">
            {isAr ? "حاول مجدداً" : "Try again"}
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && requests.length === 0 && (
        <div className="bg-white rounded-2xl border border-border-light p-12 text-center">
          <div className="w-16 h-16 bg-bg-alt rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted" aria-hidden="true">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          </div>
          <h3 className="font-bold text-text-primary mb-1">
            {isAr ? "لا توجد طلبات بعد" : "No requests yet"}
          </h3>
          <p className="text-sm text-text-muted mb-4">
            {isAr ? "أنشئ طلب سفر جديد وتابع حالته هنا" : "Create a new travel request and track it here"}
          </p>
          <Link
            href="/dashboard/travel/new"
            className="inline-flex items-center gap-2 bg-brand-green text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-green-dark transition"
          >
            {isAr ? "طلب سفر جديد" : "New Travel Request"}
          </Link>
        </div>
      )}

      {/* Requests list */}
      {!loading && !error && requests.length > 0 && (
        <div className="space-y-3">
          {requests.map(req => {
            // normalizeToPortalStatus handles both string slugs and raw CRM integers
            const portalStatus = normalizeToPortalStatus(req.status);
            const typeLabel = TRAVEL_TYPE_LABELS[req.travel_type] ?? { ar: req.travel_type, en: req.travel_type };

            return (
              <Link
                key={req.id}
                href={`/dashboard/travel/${req.id}`}
                className="block bg-white rounded-2xl border border-border-light p-5 hover:border-brand-green hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-text-primary">{req.destination_country}</span>
                      <span className="text-xs bg-bg-alt text-text-muted px-2 py-0.5 rounded-full">
                        {isAr ? typeLabel.ar : typeLabel.en}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted font-mono">{req.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <StatusBadge status={portalStatus} isAr={isAr} />
                </div>

                {/* Document progress bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text-muted">
                      {isAr ? "اكتمال المستندات" : "Document completion"}
                    </span>
                    <span className="text-xs font-bold text-text-primary">
                      {req.documents_completion_percent}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        req.documents_completion_percent === 100 ? "bg-green-500" : "bg-brand-green"
                      )}
                      style={{ width: `${req.documents_completion_percent}%` }}
                      role="progressbar"
                      aria-valuenow={req.documents_completion_percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                </div>

                {/* Next action callout */}
                {req.next_action_required && (
                  <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-100 rounded-xl px-3 py-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-600 shrink-0 mt-0.5" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p className="text-xs text-yellow-700">{req.next_action_required}</p>
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-light">
                  <span className="text-xs text-text-muted">
                    {isAr ? `${req.traveler_count} مسافر` : `${req.traveler_count} traveler${req.traveler_count !== 1 ? "s" : ""}`}
                    {req.departure_date && ` · ${new Date(req.departure_date).toLocaleDateString(isAr ? "ar-EG" : "en-GB")}`}
                  </span>
                  <span className="text-xs text-brand-green font-semibold flex items-center gap-1" aria-hidden="true">
                    {isAr ? "عرض التفاصيل" : "View details"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
