"use client";

/**
 * /admin  — Live dashboard overview
 * Replaces hardcoded stats with real data from /api/admin/stats
 * CRM auto-refresh every 60s, recent leads from /api/admin/leads
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface StatsData {
  total_customers:         number;
  leads_this_month:        number;
  pending_leads:           number;
  active_packages:         number;
  active_offers:           number;
  completed_requests:      number;
  total_revenue_month:     number;
  crm_sync_status:         "ok" | "error" | "degraded";
  last_crm_sync:           string | null;
  pending_documents_count: number;
}

interface RecentLead {
  id: string;
  destination_country: string;
  travel_type: string;
  status: string;
  created_at: string;
  profiles: { full_name: string } | null;
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending_documents: { label: "بانتظار المستندات", cls: "bg-yellow-100 text-yellow-700" },
  documents_review:  { label: "قيد المراجعة",      cls: "bg-blue-100 text-blue-700"    },
  docs_approved:     { label: "مستندات مقبولة",     cls: "bg-indigo-100 text-indigo-700"},
  in_progress:       { label: "جاري التنفيذ",       cls: "bg-purple-100 text-purple-700"},
  completed:         { label: "مكتمل",              cls: "bg-green-100 text-green-700"  },
  cancelled:         { label: "ملغي",               cls: "bg-gray-100 text-gray-600"    },
};

const CRM_MAP = {
  ok:       { label: "CRM متصل",     dot: "bg-green-400 animate-pulse",  badge: "bg-green-50 text-green-700 border-green-200"  },
  degraded: { label: "CRM بطيء",     dot: "bg-yellow-400",               badge: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  error:    { label: "CRM غير متصل", dot: "bg-red-400",                  badge: "bg-red-50 text-red-700 border-red-200"          },
};

function getToken() {
  try {
    const raw = localStorage.getItem("customer_portal_session");
    if (!raw) return "";
    return (JSON.parse(raw) as { session?: { access_token?: string } })?.session?.access_token ?? "";
  } catch { return ""; }
}
async function apiFetch(path: string) {
  const res = await fetch(path, { headers: { Authorization: `Bearer ${getToken()}` } });
  return res.json();
}

// ─── Stat card with skeleton ──────────────────────────────────────────────────
function StatCard({ label, value, sub, colorCls, icon, loading }: {
  label: string; value: string | number; sub?: string; colorCls: string;
  icon: React.ReactNode; loading?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-border-light p-5 flex items-start gap-4">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", colorCls)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        {loading ? (
          <>
            <div className="h-7 w-20 bg-gray-100 rounded animate-pulse mb-1" />
            <div className="h-3.5 w-28 bg-gray-100 rounded animate-pulse" />
          </>
        ) : (
          <>
            <p className="text-2xl font-bold text-text-primary">{value}</p>
            <p className="text-sm font-medium text-text-secondary mt-0.5">{label}</p>
            {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Pending action item ──────────────────────────────────────────────────────
function PendingWidget({ count, label, href, colorCls }: {
  count: number; label: string; href: string; colorCls: string;
}) {
  if (count === 0) return null;
  return (
    <Link href={href} className={cn("flex items-center justify-between rounded-xl px-4 py-3 border transition hover:shadow-sm", colorCls)}>
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-lg font-bold">{count}</span>
    </Link>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats]       = useState<StatsData | null>(null);
  const [leads, setLeads]       = useState<RecentLead[]>([]);
  const [loading, setLoading]   = useState(true);
  const [syncing, setSyncing]   = useState(false);

  const loadStats = useCallback(async () => {
    const res = await apiFetch("/api/admin/stats");
    if (res.success) setStats(res.data);
  }, []);

  const loadLeads = useCallback(async () => {
    const res = await apiFetch("/api/admin/leads?limit=10&page=1");
    if (res.success) setLeads(res.data ?? []);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadStats(), loadLeads()]).finally(() => setLoading(false));
    // CRM auto-refresh every 60s
    const id = setInterval(loadStats, 60_000);
    return () => clearInterval(id);
  }, [loadStats, loadLeads]);

  async function triggerSyncAll() {
    setSyncing(true);
    await apiFetch("/api/admin/crm/sync-all");
    setSyncing(false);
    loadStats();
  }

  const crm = stats ? CRM_MAP[stats.crm_sync_status] : CRM_MAP.error;

  const STAT_CARDS = stats ? [
    { label: "العملاء",          value: stats.total_customers.toLocaleString("ar-EG"),          sub: "إجمالي المسجلين",           colorCls: "bg-blue-50 text-blue-600",   icon: <PeopleIcon /> },
    { label: "طلبات هذا الشهر",  value: stats.leads_this_month.toLocaleString("ar-EG"),         sub: "طلب جديد",                  colorCls: "bg-teal-50 text-teal-600",   icon: <RequestIcon /> },
    { label: "طلبات معلقة",      value: stats.pending_leads.toLocaleString("ar-EG"),            sub: "تحتاج متابعة",              colorCls: "bg-yellow-50 text-yellow-600", icon: <PendingIcon /> },
    { label: "باقات نشطة",       value: stats.active_packages.toLocaleString("ar-EG"),          sub: "ظاهرة على الموقع",          colorCls: "bg-green-50 text-green-600", icon: <PackageIcon /> },
    { label: "عروض نشطة",        value: stats.active_offers.toLocaleString("ar-EG"),            sub: "غير منتهية الصلاحية",       colorCls: "bg-orange-50 text-orange-600", icon: <OfferIcon /> },
    { label: "طلبات مكتملة",     value: stats.completed_requests.toLocaleString("ar-EG"),       sub: "إجمالي كل الوقت",           colorCls: "bg-purple-50 text-purple-600", icon: <CheckIcon /> },
    { label: "إيرادات الشهر",    value: `${stats.total_revenue_month.toLocaleString("ar-EG")} ج.م`, sub: "من المدفوعات",          colorCls: "bg-emerald-50 text-emerald-600", icon: <MoneyIcon /> },
    { label: "مستندات للمراجعة", value: stats.pending_documents_count.toLocaleString("ar-EG"), sub: "بانتظار الموافقة",           colorCls: "bg-red-50 text-red-600",     icon: <DocIcon /> },
  ] : [];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary">لوحة التحكم</h1>
          <p className="text-sm text-text-muted mt-0.5">نظرة عامة على النظام وأداء الموقع</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* CRM status pill */}
          <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border", crm.badge)}>
            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", crm.dot)} />
            {crm.label}
          </span>
          {stats?.last_crm_sync && (
            <span className="text-xs text-text-muted hidden sm:block">
              آخر مزامنة: {new Date(stats.last_crm_sync).toLocaleTimeString("ar-EG")}
            </span>
          )}
          <button
            onClick={triggerSyncAll}
            disabled={syncing}
            className="h-8 px-3 text-xs font-semibold border border-border-light rounded-xl hover:bg-bg-alt disabled:opacity-50 transition flex items-center gap-1.5"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={syncing ? "animate-spin" : ""}><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            {syncing ? "جاري المزامنة…" : "مزامنة CRM"}
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <StatCard key={i} label="" value="" colorCls="bg-gray-50 text-gray-300" icon={<span />} loading />
            ))
          : STAT_CARDS.map(c => <StatCard key={c.label} {...c} />)
        }
      </div>

      {/* Pending actions widget */}
      {stats && (stats.pending_leads > 0 || stats.pending_documents_count > 0) && (
        <div>
          <h2 className="font-bold text-text-primary mb-3 text-sm">إجراءات مطلوبة</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <PendingWidget count={stats.pending_leads} label="طلبات بانتظار المستندات" href="/admin/leads?status=pending_documents" colorCls="bg-yellow-50 text-yellow-800 border-yellow-200" />
            <PendingWidget count={stats.pending_documents_count} label="مستندات بانتظار المراجعة" href="/admin/leads" colorCls="bg-red-50 text-red-800 border-red-200" />
          </div>
        </div>
      )}

      {/* Recent leads table */}
      <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
        <div className="px-5 py-4 border-b border-border-light flex items-center justify-between">
          <h2 className="font-bold text-text-primary text-sm">آخر الطلبات</h2>
          <Link href="/admin/leads" className="text-sm text-brand-green font-semibold hover:underline">عرض الكل ←</Link>
        </div>
        {loading ? (
          <div className="divide-y divide-border-light">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-32 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : leads.length === 0 ? (
          <p className="text-center py-10 text-text-muted text-sm">لا توجد طلبات حتى الآن</p>
        ) : (
          <div className="divide-y divide-border-light">
            {leads.map(lead => (
              <div key={lead.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-bg-alt/40 transition">
                <div className="w-9 h-9 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center font-bold text-sm shrink-0">
                  {(lead.profiles?.full_name ?? "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{lead.profiles?.full_name ?? "—"}</p>
                  <p className="text-xs text-text-muted">{lead.destination_country} · {lead.travel_type}</p>
                </div>
                <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap hidden sm:inline-flex", STATUS_MAP[lead.status]?.cls)}>
                  {STATUS_MAP[lead.status]?.label}
                </span>
                <span className="text-xs text-text-muted whitespace-nowrap hidden md:inline">
                  {new Date(lead.created_at).toLocaleDateString("ar-EG", { day: "2-digit", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-bold text-text-primary mb-3 text-sm">إجراءات سريعة</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/admin/packages", label: "إضافة باقة",    icon: "📦", color: "hover:border-green-400"  },
            { href: "/admin/offers",   label: "إضافة عرض",     icon: "🏷️", color: "hover:border-orange-400" },
            { href: "/admin/banners",  label: "إضافة بانر",    icon: "🖼️", color: "hover:border-blue-400"   },
            { href: "/admin/leads",    label: "مراجعة الطلبات", icon: "👥", color: "hover:border-yellow-400" },
          ].map(item => (
            <Link key={item.href} href={item.href} className={cn("bg-white rounded-2xl border border-border-light p-4 flex flex-col items-center gap-2 transition-all hover:shadow-sm text-center", item.color)}>
              <span className="text-2xl">{item.icon}</span>
              <span className="text-sm font-medium text-text-primary">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Inline icons ─────────────────────────────────────────────────────────────
function PeopleIcon()  { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function RequestIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>; }
function PendingIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>; }
function PackageIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>; }
function OfferIcon()   { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>; }
function CheckIcon()   { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>; }
function MoneyIcon()   { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>; }
function DocIcon()     { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>; }
