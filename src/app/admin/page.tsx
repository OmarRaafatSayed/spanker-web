"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Stats {
  total_visits: number;
  pending_leads: number;
  active_packages: number;
  completed_requests: number;
  crm_sync_status: "ok" | "error" | "degraded";
  last_crm_sync: string | null;
}

function StatCard({
  label, value, sub, colorCls, icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  colorCls: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-border-light p-5 flex items-start gap-4">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", colorCls)}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
        <p className="text-sm font-medium text-text-secondary mt-0.5">{label}</p>
        {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function CrmStatusBadge({ status }: { status: "ok" | "error" | "degraded" }) {
  const map = {
    ok: { label: "متصل", cls: "bg-green-100 text-green-700" },
    error: { label: "خطأ في الاتصال", cls: "bg-red-100 text-red-700" },
    degraded: { label: "أداء منخفض", cls: "bg-yellow-100 text-yellow-700" },
  };
  const { label, cls } = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full", cls)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", status === "ok" ? "bg-green-500" : status === "error" ? "bg-red-500" : "bg-yellow-500")} />
      CRM: {label}
    </span>
  );
}

const RECENT_LEADS = [
  { id: "1", name: "أحمد محمد", destination: "الإمارات", type: "فيزا فقط", status: "pending_documents", time: "منذ 5 دقائق" },
  { id: "2", name: "سارة خالد", destination: "تركيا", type: "فيزا + رحلة", status: "docs_approved", time: "منذ 22 دقيقة" },
  { id: "3", name: "عمر إبراهيم", destination: "المجر", type: "باقة كاملة", status: "in_progress", time: "منذ ساعة" },
  { id: "4", name: "مريم حسن", destination: "مصر", type: "فيزا فقط", status: "completed", time: "منذ 3 ساعات" },
];

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending_documents: { label: "بانتظار المستندات", cls: "bg-yellow-100 text-yellow-700" },
  documents_review: { label: "قيد المراجعة", cls: "bg-blue-100 text-blue-700" },
  docs_approved: { label: "مستندات مقبولة", cls: "bg-indigo-100 text-indigo-700" },
  in_progress: { label: "جاري التنفيذ", cls: "bg-purple-100 text-purple-700" },
  completed: { label: "مكتمل", cls: "bg-green-100 text-green-700" },
  cancelled: { label: "ملغي", cls: "bg-gray-100 text-gray-600" },
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    total_visits: 4821,
    pending_leads: 13,
    active_packages: 8,
    completed_requests: 142,
    crm_sync_status: "ok",
    last_crm_sync: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">لوحة التحكم</h1>
          <p className="text-sm text-text-muted mt-0.5">نظرة عامة على النظام وأداء الموقع</p>
        </div>
        <div className="flex items-center gap-3">
          <CrmStatusBadge status={stats.crm_sync_status} />
          {stats.last_crm_sync && (
            <span className="text-xs text-text-muted hidden sm:block">
              آخر مزامنة: {new Date(stats.last_crm_sync).toLocaleTimeString("ar-EG")}
            </span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="زيارات الموقع"
          value={stats.total_visits.toLocaleString("ar-EG")}
          sub="هذا الشهر"
          colorCls="bg-blue-50 text-blue-600"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
          }
        />
        <StatCard
          label="عملاء معلقون"
          value={stats.pending_leads}
          sub="بانتظار إرسال للـ CRM"
          colorCls="bg-yellow-50 text-yellow-600"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          }
        />
        <StatCard
          label="باقات نشطة"
          value={stats.active_packages}
          sub="ظاهرة على الموقع"
          colorCls="bg-green-50 text-green-600"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          }
        />
        <StatCard
          label="طلبات مكتملة"
          value={stats.completed_requests}
          sub="إجمالي كل الوقت"
          colorCls="bg-purple-50 text-purple-600"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          }
        />
      </div>

      {/* Recent leads */}
      <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
        <div className="px-6 py-4 border-b border-border-light flex items-center justify-between">
          <h2 className="font-bold text-text-primary">آخر العملاء المحتملين</h2>
          <a href="/admin/leads" className="text-sm text-brand-green font-semibold hover:underline">
            عرض الكل
          </a>
        </div>
        <div className="divide-y divide-border-light">
          {RECENT_LEADS.map(lead => (
            <div key={lead.id} className="px-6 py-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center font-bold text-sm shrink-0">
                {lead.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary">{lead.name}</p>
                <p className="text-xs text-text-muted">{lead.destination} · {lead.type}</p>
              </div>
              <span className={cn(
                "text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap hidden sm:inline-flex",
                STATUS_MAP[lead.status]?.cls
              )}>
                {STATUS_MAP[lead.status]?.label}
              </span>
              <span className="text-xs text-text-muted whitespace-nowrap">{lead.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-bold text-text-primary mb-3">إجراءات سريعة</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/admin/packages", label: "إضافة باقة", icon: "📦", color: "hover:border-green-400" },
            { href: "/admin/banners", label: "إضافة بانر", icon: "🖼️", color: "hover:border-blue-400" },
            { href: "/admin/leads", label: "مراجعة العملاء", icon: "👥", color: "hover:border-yellow-400" },
            { href: "/admin/logs", label: "سجل النظام", icon: "📋", color: "hover:border-purple-400" },
          ].map(item => (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "bg-white rounded-2xl border border-border-light p-4 flex flex-col items-center gap-2 transition-all hover:shadow-sm text-center",
                item.color
              )}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-sm font-medium text-text-primary">{item.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
