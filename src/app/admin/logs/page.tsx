"use client";

/**
 * /admin/logs
 * Live system logs wired to /api/admin/logs — filters, search,
 * pagination (50/page), CSV export, purge section (admin only).
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

type LogLevel  = "info" | "success" | "warning" | "error";
type LogSource = "webhook" | "crm" | "cms" | "auth" | "system";

interface SystemLog {
  id: string; level: LogLevel; event: string; details: string | null;
  source: LogSource; metadata: Record<string, unknown> | null; created_at: string;
}

const LEVEL_CFG: Record<LogLevel, { label: string; cls: string; dot: string; row: string }> = {
  info:    { label: "معلومة", cls: "bg-blue-50 text-blue-700",    dot: "bg-blue-400",   row: ""                },
  success: { label: "نجاح",   cls: "bg-green-50 text-green-700",  dot: "bg-green-500",  row: ""                },
  warning: { label: "تحذير",  cls: "bg-yellow-50 text-yellow-700",dot: "bg-yellow-500", row: "bg-yellow-50/30" },
  error:   { label: "خطأ",    cls: "bg-red-50 text-red-700",      dot: "bg-red-500",    row: "bg-red-50/30"    },
};

const SOURCE_LABELS: Record<LogSource, string> = {
  webhook: "Webhook", crm: "CRM", cms: "CMS", auth: "Auth", system: "System",
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

function exportCsv(logs: SystemLog[]) {
  const header = ["id", "level", "event", "source", "details", "created_at"].join(",");
  const rows = logs.map(l =>
    [l.id, l.level, `"${l.event}"`, l.source, `"${(l.details ?? "").replace(/"/g, "'")}"`, l.created_at].join(",")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `system-logs-${Date.now()}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

export default function AdminLogsPage() {
  const [logs, setLogs]         = useState<SystemLog[]>([]);
  const [loading, setLoading]   = useState(true);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const LIMIT = 50;

  const [filterLevel,  setFilterLevel]  = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [dateFrom,     setDateFrom]     = useState("");
  const [dateTo,       setDateTo]       = useState("");
  const [search,       setSearch]       = useState("");
  const [expandedId,   setExpandedId]   = useState<string | null>(null);

  // Purge
  const [purgeDays,    setPurgeDays]    = useState("90");
  const [purgeConfirm, setPurgeConfirm] = useState(false);
  const [purging,      setPurging]      = useState(false);
  const [purgeResult,  setPurgeResult]  = useState<string | null>(null);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
    if (filterLevel)  params.set("level",     filterLevel);
    if (filterSource) params.set("source",    filterSource);
    if (dateFrom)     params.set("date_from", dateFrom);
    if (dateTo)       params.set("date_to",   dateTo);
    if (search)       params.set("search",    search);
    const res = await apiFetch(`/api/admin/logs?${params}`);
    if (res.success) { setLogs(res.data ?? []); setTotal(res.total ?? 0); }
    setLoading(false);
  }, [filterLevel, filterSource, dateFrom, dateTo, search]);

  useEffect(() => { load(1); setPage(1); }, [load]);

  async function purge() {
    if (!purgeConfirm) return;
    setPurging(true);
    const res = await apiFetch(`/api/admin/logs?days=${purgeDays}&confirm=true`, { method: "DELETE" });
    setPurging(false);
    if (res.success) {
      setPurgeResult(`تم حذف ${res.data?.purged_count ?? 0} سجل قديم.`);
      setPurgeConfirm(false);
      load(1);
    }
  }

  const totalPages   = Math.ceil(total / LIMIT);
  const errorCount   = logs.filter(l => l.level === "error").length;
  const warningCount = logs.filter(l => l.level === "warning").length;

  const iCls = "h-9 px-3 border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 bg-white";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary">سجل النظام</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {total} سجل
            {errorCount > 0 && <span className="text-red-600 font-semibold mr-2"> · {errorCount} خطأ</span>}
            {warningCount > 0 && <span className="text-yellow-600 font-semibold mr-1"> · {warningCount} تحذير</span>}
          </p>
        </div>
        <button
          onClick={() => exportCsv(logs)}
          disabled={logs.length === 0}
          className="flex items-center gap-2 h-9 px-4 border border-border-light rounded-xl text-sm font-semibold text-text-secondary hover:bg-bg-alt disabled:opacity-40 transition"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          تصدير CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 bg-white rounded-xl border border-border-light p-3">
        {/* Level filter pills */}
        <div className="flex gap-1.5 flex-wrap">
          {[
            { value: "", label: "كل المستويات" },
            { value: "error",   label: "أخطاء"    },
            { value: "warning", label: "تحذيرات"  },
            { value: "success", label: "نجاح"      },
            { value: "info",    label: "معلومات"   },
          ].map(f => (
            <button key={f.value} onClick={() => setFilterLevel(f.value)}
              className={cn("text-xs font-semibold px-3 py-1.5 rounded-full transition",
                filterLevel === f.value ? "bg-brand-green text-white" : "bg-bg-alt border border-border-light text-text-secondary hover:bg-gray-100"
              )}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <select value={filterSource} onChange={e => setFilterSource(e.target.value)} className={cn(iCls, "w-32")}>
            <option value="">كل المصادر</option>
            {Object.entries(SOURCE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <div className="relative">
            <svg className="absolute top-2.5 right-2.5 text-text-muted" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث في الأحداث…" className={cn(iCls, "pr-8 w-44")} />
          </div>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="من" className={cn(iCls, "w-36")} />
          <input type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)}   title="إلى" className={cn(iCls, "w-36")} />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-14"><div className="w-7 h-7 border-4 border-brand-green border-t-transparent rounded-full animate-spin" /></div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-text-muted">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 opacity-30"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
            <p className="font-semibold">لا توجد سجلات</p>
          </div>
        ) : (
          <div className="divide-y divide-border-light">
            {logs.map(log => {
              const cfg = LEVEL_CFG[log.level];
              const isOpen = expandedId === log.id;
              return (
                <div
                  key={log.id}
                  onClick={() => setExpandedId(isOpen ? null : log.id)}
                  className={cn("px-4 py-3.5 hover:bg-bg-alt/40 cursor-pointer transition-colors", cfg.row)}
                >
                  <div className="flex items-start gap-3">
                    <span className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", cfg.dot)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", cfg.cls)}>{cfg.label}</span>
                        <span className="text-[10px] bg-bg-alt text-text-muted px-2 py-0.5 rounded-full">{SOURCE_LABELS[log.source]}</span>
                        <span className="font-semibold text-sm text-text-primary">{log.event}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cn("transition-transform text-text-muted shrink-0", isOpen && "rotate-180")}>
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </div>
                      {isOpen ? (
                        <div className="mt-2 space-y-2">
                          {log.details && (
                            <p className="text-xs text-text-secondary bg-bg-alt rounded-lg px-3 py-2" dir="ltr">
                              {log.details}
                            </p>
                          )}
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <pre className="text-[10px] text-text-muted bg-gray-50 rounded-lg px-3 py-2 overflow-x-auto" dir="ltr">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          )}
                        </div>
                      ) : (
                        log.details && (
                          <p className="text-xs text-text-muted mt-1 truncate">{log.details}</p>
                        )
                      )}
                    </div>
                    <span className="text-[11px] text-text-muted whitespace-nowrap shrink-0">
                      {new Date(log.created_at).toLocaleString("ar-EG", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border-light flex items-center justify-between">
            <span className="text-xs text-text-muted">صفحة {page} من {totalPages} · {total} سجل</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => { const p = page - 1; setPage(p); load(p); }} className="h-8 px-3 border border-border-light rounded-lg text-xs disabled:opacity-40 hover:bg-bg-alt transition">السابق</button>
              <button disabled={page === totalPages} onClick={() => { const p = page + 1; setPage(p); load(p); }} className="h-8 px-3 border border-border-light rounded-lg text-xs disabled:opacity-40 hover:bg-bg-alt transition">التالي</button>
            </div>
          </div>
        )}
      </div>

      {/* Purge section (admin only) */}
      <div className="bg-white rounded-2xl border border-border-light p-5 space-y-4">
        <h3 className="font-bold text-text-primary text-sm flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          حذف السجلات القديمة
        </h3>
        <p className="text-xs text-text-muted">يحذف السجلات الأقدم من عدد محدد من الأيام. لا يمكن التراجع عن هذا الإجراء.</p>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-text-secondary whitespace-nowrap">احذف السجلات الأقدم من</label>
            <input
              type="number" min={7} max={365} value={purgeDays}
              onChange={e => setPurgeDays(e.target.value)}
              className="h-9 w-20 px-3 border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-white"
            />
            <span className="text-xs text-text-secondary">يوم</span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={purgeConfirm} onChange={e => setPurgeConfirm(e.target.checked)} className="accent-red-500 w-4 h-4" />
            <span className="text-xs text-text-secondary">أؤكد رغبتي في الحذف الدائم</span>
          </label>
          <button
            onClick={purge}
            disabled={!purgeConfirm || purging}
            className="h-9 px-4 bg-red-500 text-white text-xs font-bold rounded-xl hover:bg-red-600 disabled:opacity-40 transition"
          >
            {purging ? "جاري الحذف…" : "تنفيذ الحذف"}
          </button>
        </div>
        {purgeResult && (
          <p className="text-xs text-green-700 font-semibold bg-green-50 rounded-lg px-3 py-2">{purgeResult}</p>
        )}
      </div>
    </div>
  );
}
