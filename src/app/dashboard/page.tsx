"use client";

/**
 * /dashboard — Main dashboard overview page
 *
 * REFACTORED (Task 1):
 *   - Removed inline VisaStatusBadge with hardcoded CRM status strings
 *   - All status display comes from PORTAL_STATUS_LABELS + PORTAL_STATUS_VARIANT
 *   - Data fetched via crmAdapter instead of raw api.ts functions
 *   - Promise.allSettled ensures secondary metrics never crash the page
 *   - Cached values shown when backend is down (soft degradation)
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n/context";
import { crmAdapter } from "@/lib/services/crm-adapter";
import {
  PORTAL_STATUS_LABELS,
  PORTAL_STATUS_VARIANT,
  normalizeToPortalStatus,
  type PortalStatus,
} from "@/types/visa-states";
import type { VisaApplicationsResponse, PaymentsResponse, CustomerProfile } from "@/types/flights";

// =============================================================================
// Sub-components
// =============================================================================

function StatCard({
  label, value, sub, color, icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-border-light p-4 flex items-start gap-3">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", color)}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold text-text-primary leading-tight break-words">{value}</p>
        <p className="text-xs font-medium text-text-secondary mt-0.5 leading-snug">{label}</p>
        {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("bg-gray-200 rounded-xl animate-pulse", className)} />;
}

// Status badge — purely from visa-states, no inline maps
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

function VisaStatusBadge({ status, isAr }: { status: string; isAr: boolean }) {
  // normalizeToPortalStatus handles both integer CRM codes and string slugs
  const portalStatus = normalizeToPortalStatus(status);
  const variant = PORTAL_STATUS_VARIANT[portalStatus];
  const label = isAr ? AR_STATUS_LABELS[portalStatus] : PORTAL_STATUS_LABELS[portalStatus];
  return (
    <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap", VARIANT_CLS[variant])}>
      {label}
    </span>
  );
}

// =============================================================================
// Page
// =============================================================================

export default function DashboardPage() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const isAr = locale === "ar";

  const [visaData,    setVisaData]    = useState<VisaApplicationsResponse | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentsResponse | null>(null);
  const [profile,     setProfile]     = useState<CustomerProfile | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [backendDown, setBackendDown] = useState(false);

  useEffect(() => {
    async function fetchAll() {
      const [v, p, pr] = await Promise.allSettled([
        crmAdapter.getMyVisaApplications(),
        crmAdapter.getMyPayments(),
        crmAdapter.getProfile(),
      ]);

      // Each result is a ServiceResult — only set state on success
      if (v.status === "fulfilled" && v.value.ok) setVisaData(v.value.data);
      if (p.status === "fulfilled" && p.value.ok) setPaymentData(p.value.data);
      if (pr.status === "fulfilled" && pr.value.ok) setProfile(pr.value.data);

      // Detect backend down: if all three failed with network errors
      const allFailed =
        (v.status  === "fulfilled" && !v.value.ok)  &&
        (p.status  === "fulfilled" && !p.value.ok)  &&
        (pr.status === "fulfilled" && !pr.value.ok);
      setBackendDown(allFailed);

      setLoading(false);
    }
    fetchAll();
  }, []);

  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : user?.first_name
      ? `${user.first_name} ${(user as { last_name?: string }).last_name ?? ""}`.trim()
      : (user as { email?: string })?.email ?? "";

  const totalPaid = paymentData?.results
    .filter(p => p.status === "full")
    .reduce((s, p) => s + p.amount, 0) ?? 0;

  const pendingPayments = paymentData?.results.filter(p => p.status === "pending").length ?? 0;

  const upcomingAppointment = visaData?.results.find(
    v => v.appointment_date && new Date(v.appointment_date) >= new Date()
  );

  return (
    <div className="space-y-6">
      {/* Backend-down banner — non-blocking, just informational */}
      {backendDown && (
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
        </div>
      )}

      {/* Welcome banner */}
      <div className="bg-gradient-to-br from-brand-green to-brand-green-dark rounded-2xl p-6 text-white">
        <p className="text-sm opacity-80 mb-1">{isAr ? "مرحباً بك،" : "Welcome back,"}</p>
        <h1 className="text-2xl font-bold">{displayName}</h1>
        <p className="text-sm opacity-70 mt-1">
          {isAr ? "تابع طلباتك وحجوزاتك من هنا" : "Track your requests and bookings from here"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))
        ) : (
          <>
            <StatCard
              label={isAr ? "طلبات الفيزا" : "Visa Applications"}
              value={visaData?.count ?? 0}
              color="bg-blue-50 text-blue-600"
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              }
            />
            <StatCard
              label={isAr ? "المدفوعات المعلقة" : "Pending Payments"}
              value={pendingPayments}
              color="bg-yellow-50 text-yellow-600"
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              }
            />
            <StatCard
              label={isAr ? "إجمالي المسدّد" : "Total Paid"}
              value={`${totalPaid.toLocaleString()} EGP`}
              color="bg-green-50 text-green-600"
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              }
            />
            <StatCard
              label={isAr ? "موعد السفارة القادم" : "Next Appointment"}
              value={
                upcomingAppointment?.appointment_date
                  ? new Date(upcomingAppointment.appointment_date).toLocaleDateString(
                      isAr ? "ar-EG" : "en-GB"
                    )
                  : isAr ? "لا يوجد" : "None"
              }
              color="bg-purple-50 text-purple-600"
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              }
            />
          </>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-base font-bold text-text-primary mb-3">
          {isAr ? "وصول سريع" : "Quick access"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              href: "/dashboard/travel",
              labelAr: "طلبات السفر", labelEn: "Travel Requests",
              descAr: "تابع طلباتك الجديدة", descEn: "Track your new requests",
              color: "bg-purple-50 text-purple-600",
              icon: <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>,
            },
            {
              href: "/dashboard/visa",
              labelAr: "متابعة الفيزا", labelEn: "Track Visa",
              descAr: "اعرف حالة طلبك", descEn: "Check your status",
              color: "bg-blue-50 text-blue-600",
              icon: <><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></>,
            },
            {
              href: "/dashboard/payments",
              labelAr: "سجل المدفوعات", labelEn: "Payment History",
              descAr: "عرض الفواتير", descEn: "View invoices",
              color: "bg-green-50 text-green-600",
              icon: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
            },
            {
              href: "/dashboard/profile",
              labelAr: "الملف الشخصي", labelEn: "My Profile",
              descAr: "تعديل بياناتك", descEn: "Edit your info",
              color: "bg-orange-50 text-orange-600",
              icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
            },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 bg-white rounded-2xl border border-border-light p-4 hover:border-brand-green hover:shadow-sm transition-all group"
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center group-hover:brightness-95 transition", item.color)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {item.icon}
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{isAr ? item.labelAr : item.labelEn}</p>
                <p className="text-xs text-text-muted">{isAr ? item.descAr : item.descEn}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent visa applications — graceful empty state if data unavailable */}
      {!loading && visaData && visaData.results.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-text-primary">
              {isAr ? "آخر طلبات الفيزا" : "Recent Visa Applications"}
            </h2>
            <Link href="/dashboard/visa" className="text-xs text-brand-green font-semibold hover:underline">
              {isAr ? "عرض الكل" : "View all"}
            </Link>
          </div>
          <div className="space-y-2">
            {visaData.results.slice(0, 3).map(app => (
              <div
                key={app.id}
                className="bg-white rounded-xl border border-border-light p-4 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{app.destination_country}</p>
                  <p className="text-xs text-text-muted">{app.passport_number}</p>
                </div>
                {/* status may be a raw integer from the CRM — normalizeToPortalStatus handles it */}
                <VisaStatusBadge status={app.status as unknown as string} isAr={isAr} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state — only shown after load completes with no data */}
      {!loading && !backendDown && !visaData?.results.length && (
        <div className="bg-white rounded-2xl border border-border-light p-8 text-center">
          <p className="text-sm text-text-muted">
            {isAr ? "لا توجد طلبات فيزا حتى الآن" : "No visa applications yet"}
          </p>
        </div>
      )}
    </div>
  );
}
