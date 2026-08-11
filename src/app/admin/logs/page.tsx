"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type LogLevel = "info" | "success" | "warning" | "error";

interface SystemLog {
  id: string;
  level: LogLevel;
  event: string;
  details: string;
  source: "webhook" | "crm" | "cms" | "auth" | "system";
  timestamp: string;
}

const LEVEL_CONFIG: Record<LogLevel, { label: string; cls: string; dot: string }> = {
  info: { label: "معلومة", cls: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  success: { label: "نجاح", cls: "bg-green-50 text-green-700", dot: "bg-green-500" },
  warning: { label: "تحذير", cls: "bg-yellow-50 text-yellow-700", dot: "bg-yellow-500" },
  error: { label: "خطأ", cls: "bg-red-50 text-red-700", dot: "bg-red-500" },
};

const SOURCE_LABELS: Record<string, string> = {
  webhook: "Webhook",
  crm: "CRM",
  cms: "CMS",
  auth: "المصادقة",
  system: "النظام",
};

const MOCK_LOGS: SystemLog[] = [
  { id: "1", level: "success", event: "CRM Webhook Received", details: "تم استقبال تحديث حالة للطلب TRK002 - status: docs_approved", source: "webhook", timestamp: "2026-08-10T09:45:00Z" },
  { id: "2", level: "success", event: "Lead Dispatched to CRM", details: "تم إرسال العميل أحمد محمد (TRK001) إلى CRM بنجاح", source: "crm", timestamp: "2026-08-10T09:30:00Z" },
  { id: "3", level: "info", event: "Package Updated", details: "تم تحديث باقة 'جولة إسطنبول' بواسطة المشرف", source: "cms", timestamp: "2026-08-10T09:15:00Z" },
  { id: "4", level: "warning", event: "CRM Sync Retry", details: "فشلت المحاولة الأولى لإرسال TRK005 - جاري إعادة المحاولة (2/3)", source: "crm", timestamp: "2026-08-10T08:55:00Z" },
  { id: "5", level: "error", event: "Webhook Signature Invalid", details: "رُفض طلب webhook - توقيع HMAC غير صحيح - IP: 192.168.1.100", source: "webhook", timestamp: "2026-08-10T08:30:00Z" },
  { id: "6", level: "success", event: "New Travel Request", details: "طلب جديد من يوسف عبدالله - وجهة: الأردن - تم تعيين ID: TRK005", source: "system", timestamp: "2026-08-10T08:00:00Z" },
  { id: "7", level: "info", event: "Banner Created", details: "تم إنشاء بانر جديد 'عروض الصيف' في موضع hero", source: "cms", timestamp: "2026-08-09T17:20:00Z" },
  { id: "8", level: "success", event: "Document Approved", details: "تم قبول جواز سفر العميل مريم حسن (TRK004)", source: "crm", timestamp: "2026-08-09T16:45:00Z" },
  { id: "9", level: "warning", event: "Document Upload Failed", details: "فشل رفع ملف PDF للعميل TRK003 - حجم الملف أكبر من 5MB", source: "system", timestamp: "2026-08-09T15:00:00Z" },
  { id: "10", level: "success", event: "CRM Status Update", details: "تم تحديث حالة TRK003 إلى 'in_progress' من CRM", source: "webhook", timestamp: "2026-08-09T14:00:00Z" },
];

export default function AdminLogsPage() {
  const [logs] = useState<SystemLog[]>(MOCK_LOGS);
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = logs.filter(l => {
    const matchLevel = filterLevel === "all" || l.level === filterLevel;
    const matchSource = filterSource === "all" || l.source === filterSource;
    return matchLevel && matchSource;
  });

  const counts = {
    error: logs.filter(l => l.level === "error").length,
    warning: logs.filter(l => l.level === "warning").length,
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">سجل النظام</h1>
          <p className="text-sm text-text-muted mt-0.5">{logs.length} حدث · {counts.error} أخطاء · {counts.warning} تحذيرات</p>
        </div>
        <div className="flex items-center gap-2">
          {counts.error > 0 && (
            <span className="text-xs bg-red-100 text-red-700 font-semibold px-2.5 py-1 rounded-full">
              {counts.error} خطأ
            </span>
          )}
          {counts.warning > 0 && (
            <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-2.5 py-1 rounded-full">
              {counts.warning} تحذير
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1.5">
          {[
            { value: "all", label: "كل المستويات" },
            { value: "error", label: "أخطاء" },
            { value: "warning", label: "تحذيرات" },
            { value: "success", label: "نجاح" },
            { value: "info", label: "معلومات" },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilterLevel(f.value)}
              className={cn(
                "text-xs font-semibold px-3 py-1.5 rounded-full transition",
                filterLevel === f.value ? "bg-brand-green text-white" : "bg-white border border-border-light text-text-secondary hover:bg-bg-alt"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 ms-auto">
          {[
            { value: "all", label: "كل المصادر" },
            { value: "webhook", label: "Webhook" },
            { value: "crm", label: "CRM" },
            { value: "cms", label: "CMS" },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilterSource(f.value)}
              className={cn(
                "text-xs font-semibold px-3 py-1.5 rounded-full transition",
                filterSource === f.value ? "bg-brand-dark text-white" : "bg-white border border-border-light text-text-secondary hover:bg-bg-alt"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Logs */}
      <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-text-muted">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 opacity-30">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            لا توجد سجلات مطابقة للفلتر
          </div>
        ) : (
          <div className="divide-y divide-border-light">
            {filtered.map(log => {
              const conf = LEVEL_CONFIG[log.level];
              const isExpanded = expandedId === log.id;
              return (
                <div
                  key={log.id}
                  className="px-5 py-4 hover:bg-bg-alt/40 transition cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                >
                  <div className="flex items-start gap-3">
                    <span className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", conf.dot)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", conf.cls)}>
                          {conf.label}
                        </span>
                        <span className="text-xs bg-bg-alt text-text-muted px-2 py-0.5 rounded-full">
                          {SOURCE_LABELS[log.source]}
                        </span>
                        <span className="font-semibold text-sm text-text-primary">{log.event}</span>
                      </div>
                      {isExpanded && (
                        <p className="text-xs text-text-secondary mt-2 bg-bg-alt rounded-lg px-3 py-2" dir="ltr">
                          {log.details}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-text-muted whitespace-nowrap shrink-0">
                      {new Date(log.timestamp).toLocaleString("ar-EG", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                    </span>
                  </div>
                  {!isExpanded && (
                    <p className="text-xs text-text-muted mt-1.5 ms-5 truncate">{log.details}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
