"use client";

/**
 * /my-requests — All requests for the logged-in customer
 * Shows hotel, flight, and visa requests with live status badges.
 * Called from the hotel-booking success screen "تابع طلبك" button.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n/context";
import { supabase } from "@/lib/supabase";
import { normalizeToPortalStatus, type PortalStatus } from "@/types/visa-states";
import type { TravelRequest } from "@/types";

// ─── Travel type metadata ──────────────────────────────────────────────────────

const TRAVEL_TYPE_META: Record<string, { ar: string; en: string; icon: string }> = {
  visa_only:    { ar: "فيزا فقط",       en: "Visa Only",     icon: "🛂" },
  visa_flight:  { ar: "فيزا + طيران",   en: "Visa + Flight", icon: "✈️" },
  visa_hotel:   { ar: "فندق",           en: "Hotel",         icon: "🏨" },
  full_package: { ar: "باقة كاملة",     en: "Full Package",  icon: "🌍" },
};

// ─── Status badge config ──────────────────────────────────────────────────────

type StatusConfig = { labelAr: string; labelEn: string; cls: string };

const STATUS_CONFIG: Record<PortalStatus, StatusConfig> = {
  pending_documents: { labelAr: "بانتظار المستندات", labelEn: "Pending Documents", cls: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  documents_review:  { labelAr: "قيد المراجعة",      labelEn: "Under Review",      cls: "bg-blue-100 text-blue-700 border-blue-200" },
  docs_approved:     { labelAr: "المستندات مقبولة",   labelEn: "Docs Approved",     cls: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  in_progress:       { labelAr: "جاري التنفيذ",       labelEn: "In Progress",       cls: "bg-purple-100 text-purple-700 border-purple-200" },
  completed:         { labelAr: "مكتمل",              labelEn: "Completed",         cls: "bg-green-100 text-green-700 border-green-200" },
  cancelled:         { labelAr: "ملغي",               labelEn: "Cancelled",         cls: "bg-red-100 text-red-600 border-red-200" },
};

function StatusBadge({ status, isAr }: { status: PortalStatus; isAr: boolean }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full border whitespace-nowrap", cfg.cls)}>
      {isAr ? cfg.labelAr : cfg.labelEn}
    </span>
  );
}

// ─── Request card ─────────────────────────────────────────────────────────────

function RequestCard({ req, isAr }: { req: TravelRequest; isAr: boolean }) {
  const status = normalizeToPortalStatus(req.status);
  const typeMeta = TRAVEL_TYPE_META[req.travel_type] ?? { ar: req.travel_type, en: req.travel_type, icon: "📋" };
  const trackingCode = req.id.slice(0, 8).toUpperCase();

  const depDate = req.departure_date
    ? new Date(req.departure_date).toLocaleDateString(isAr ? "ar-EG" : "en-GB", {
        day: "numeric", month: "short", year: "numeric",
      })
    : null;

  return (
    <Link
      href={`/dashboard/travel/${req.id}`}
      className="block bg-white rounded-2xl border border-border-light p-5 hover:border-brand-green hover:shadow-md transition-all duration-200 active:scale-[0.99]"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-bg-alt flex items-center justify-center text-xl shrink-0" aria-hidden="true">
            {typeMeta.icon}
          </div>
          <div>
            <h2 className="font-bold text-text-primary text-sm leading-tight">{req.destination_country}</h2>
            <span className="text-xs text-text-muted">{isAr ? typeMeta.ar : typeMeta.en}</span>
          </div>
        </div>
        <StatusBadge status={status} isAr={isAr} />
      </div>

      {/* Document progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5 text-xs">
          <span className="text-text-muted">{isAr ? "اكتمال المستندات" : "Documents"}</span>
          <span className="font-bold text-text-primary">{req.documents_completion_percent ?? 0}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              (req.documents_completion_percent ?? 0) === 100 ? "bg-green-500" : "bg-brand-green"
            )}
            style={{ width: `${req.documents_completion_percent ?? 0}%` }}
            role="progressbar"
            aria-valuenow={req.documents_completion_percent ?? 0}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* Next action */}
      {req.next_action_required && (
        <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-100 rounded-xl px-3 py-2 mb-3">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className="text-yellow-600 shrink-0 mt-px" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-xs text-yellow-700 leading-snug">{req.next_action_required}</p>
        </div>
      )}

      {/* Footer row */}
      <div className="flex items-center justify-between pt-3 border-t border-border-light text-xs text-text-muted">
        <div className="flex items-center gap-3">
          <span className="font-mono font-bold text-text-secondary">{trackingCode}</span>
          {depDate && <span>{depDate}</span>}
          <span>
            {req.traveler_count} {isAr
              ? (req.traveler_count === 1 ? "مسافر" : "مسافرين")
              : (req.traveler_count === 1 ? "traveler" : "travelers")}
          </span>
        </div>
        <span className="text-brand-green font-semibold flex items-center gap-1" aria-hidden="true">
          {isAr ? "التفاصيل" : "Details"}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points={isAr ? "15 18 9 12 15 6" : "9 18 15 12 9 6"} />
          </svg>
        </span>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyRequestsPage() {
  const { user, logout } = useAuth();
  const { locale } = useI18n();
  const router = useRouter();
  const isAr = locale === "ar";

  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use the RPC which is SECURITY INVOKER and uses auth.uid() server-side.
      // This avoids the 406 that direct .select().single() causes when RLS
      // returns 0 rows — the RPC always returns a set (empty array is valid).
      const { data, error: rpcErr } = await supabase.rpc("get_my_travel_requests");
      if (rpcErr) throw rpcErr;
      const normalised = ((data as TravelRequest[]) ?? []).map(req => ({
        ...req,
        status: normalizeToPortalStatus(req.status) as TravelRequest["status"],
      }));
      // Most recent first
      normalised.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRequests(normalised);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-bg-alt">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-border-light shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1.5 rounded-lg text-text-muted hover:bg-bg-alt hover:text-text-primary transition"
              aria-label={isAr ? "رجوع" : "Go back"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <polyline points={isAr ? "9 18 15 12 9 6" : "15 18 9 12 15 6"} />
              </svg>
            </button>
            <Link href="/" className="flex items-center gap-2">
              <img src="/assets/brand/icone-LOGO.png" alt="Spanker" className="w-7 h-7 object-contain" />
              <span className="font-bold text-brand-dark text-sm hidden sm:block">سبانكر</span>
            </Link>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-red-600 transition px-3 py-1.5 rounded-lg hover:bg-red-50 border border-border-light"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {isAr ? "خروج" : "Logout"}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-text-primary">
            {isAr ? "طلباتي" : "My Requests"}
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            {isAr
              ? "كل طلبات السفر والفنادق والفيزا الخاصة بك"
              : "All your travel, hotel, and visa requests"}
          </p>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { href: "/hotel-booking",    icon: "🏨", labelAr: "احجز فندق",    labelEn: "Book Hotel" },
            { href: "/visa-application", icon: "🛂", labelAr: "طلب فيزا",     labelEn: "Visa" },
            { href: "/dashboard",        icon: "📊", labelAr: "لوحة التحكم",  labelEn: "Dashboard" },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1.5 p-3 bg-white rounded-2xl border border-border-light text-center hover:border-brand-green hover:shadow-sm transition-all"
            >
              <span className="text-2xl" aria-hidden="true">{item.icon}</span>
              <span className="text-xs font-semibold text-text-secondary">{isAr ? item.labelAr : item.labelEn}</span>
            </Link>
          ))}
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-3" aria-busy="true" aria-label={isAr ? "جاري التحميل" : "Loading"}>
            {[1, 2, 3].map(i => (
              <div key={i} className="h-36 bg-white rounded-2xl border border-border-light animate-pulse" />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center" role="alert">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className="text-red-400 mx-auto mb-3" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p className="text-sm text-red-600 mb-3">{error}</p>
            <button
              onClick={load}
              className="text-xs font-bold text-red-700 underline underline-offset-2"
            >
              {isAr ? "حاول مجدداً" : "Try again"}
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && requests.length === 0 && (
          <div className="bg-white rounded-2xl border border-border-light p-12 text-center">
            <div className="w-16 h-16 bg-bg-alt rounded-full flex items-center justify-center mx-auto mb-4 text-3xl" aria-hidden="true">
              📋
            </div>
            <h3 className="font-bold text-text-primary mb-1">
              {isAr ? "لا توجد طلبات بعد" : "No requests yet"}
            </h3>
            <p className="text-sm text-text-muted mb-5">
              {isAr ? "ابدأ بحجز فندق أو تقديم طلب فيزا" : "Start by booking a hotel or submitting a visa application"}
            </p>
            <Link
              href="/hotel-booking"
              className="inline-flex items-center gap-2 bg-brand-green text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-brand-green-dark transition"
            >
              🏨 {isAr ? "احجز فندق" : "Book Hotel"}
            </Link>
          </div>
        )}

        {/* Requests grouped by status relevance */}
        {!loading && !error && requests.length > 0 && (
          <>
            <p className="text-xs text-text-muted mb-3 font-medium">
              {isAr
                ? `${requests.length} طلب — مرتب من الأحدث`
                : `${requests.length} request${requests.length !== 1 ? "s" : ""} — newest first`}
            </p>
            <div className="space-y-3">
              {requests.map(req => (
                <RequestCard key={req.id} req={req} isAr={isAr} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
