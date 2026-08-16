"use client";

/**
 * /admin/leads
 * Wired to /api/admin/leads — paginated, live status updates, CRM sync,
 * expandable detail panel with documents, communication log, timeline.
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type PortalStatus = "pending_documents" | "documents_review" | "docs_approved" | "in_progress" | "completed" | "cancelled";
type DocStatus    = "uploaded" | "under_review" | "approved" | "rejected" | "expired";
type CommType     = "email" | "whatsapp" | "sms" | "phone_call" | "system_notification";

interface Lead {
  id: string;
  destination_country: string;
  travel_type: string;
  status: PortalStatus;
  traveler_count: number;
  departure_date: string | null;
  sync_status: string | null;
  customer_notes: string | null;
  staff_notes: string | null;
  assigned_staff_id: string | null;
  created_at: string;
  profiles: { id: string; full_name: string; phone: string; user_id: string } | null;
  assigned_staff: { id: string; full_name: string } | null;
}

interface Document { id: string; document_type: string; file_name: string | null; status: DocStatus; created_at: string; rejection_reason: string | null; }
interface Comm { id: string; communication_type: CommType; subject: string | null; message: string; sent_at: string; }
interface StateEvent { id: string; previous_state: string | null; new_state: string; event_type: string; triggered_by: string | null; created_at: string; }
interface StaffProfile { id: string; user_id: string; full_name: string; role: string; }

// ─── Config maps ──────────────────────────────────────────────────────────────
const STATUS_CFG: Record<PortalStatus, { label: string; cls: string }> = {
  pending_documents: { label: "بانتظار المستندات", cls: "bg-yellow-100 text-yellow-700" },
  documents_review:  { label: "قيد المراجعة",      cls: "bg-blue-100 text-blue-700"   },
  docs_approved:     { label: "مستندات مقبولة",     cls: "bg-indigo-100 text-indigo-700" },
  in_progress:       { label: "جاري التنفيذ",       cls: "bg-purple-100 text-purple-700" },
  completed:         { label: "مكتمل",              cls: "bg-green-100 text-green-700"  },
  cancelled:         { label: "ملغي",               cls: "bg-gray-100 text-gray-600"    },
};

const TRAVEL_LABELS: Record<string, string> = {
  visa_only: "فيزا فقط", visa_flight: "فيزا + طيران",
  visa_hotel: "فيزا + فندق", full_package: "باقة كاملة",
};

const DOC_CFG: Record<DocStatus, { label: string; cls: string }> = {
  uploaded:    { label: "مرفوع",        cls: "bg-blue-100 text-blue-700"   },
  under_review:{ label: "قيد المراجعة", cls: "bg-yellow-100 text-yellow-700"},
  approved:    { label: "موافق",        cls: "bg-green-100 text-green-700" },
  rejected:    { label: "مرفوض",        cls: "bg-red-100 text-red-700"     },
  expired:     { label: "منتهي",        cls: "bg-gray-100 text-gray-500"   },
};

const COMM_ICONS: Record<CommType, string> = {
  email: "📧", whatsapp: "📱", sms: "💬", phone_call: "📞", system_notification: "🔔",
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

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-EG", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
}

// ─── Detail panel ─────────────────────────────────────────────────────────────
function LeadDetailPanel({ lead, staffList, onClose, onUpdated }: {
  lead: Lead;
  staffList: StaffProfile[];
  onClose: () => void;
  onUpdated: (updated: Lead) => void;
}) {
  const [tab, setTab]           = useState<"docs" | "comms" | "timeline">("docs");
  const [docs, setDocs]         = useState<Document[]>([]);
  const [comms, setComms]       = useState<Comm[]>([]);
  const [events, setEvents]     = useState<StateEvent[]>([]);
  const [loadingTab, setLoadingTab] = useState(false);

  // Status change
  const [newStatus, setNewStatus]     = useState<PortalStatus>(lead.status);
  const [savingStatus, setSavingStatus] = useState(false);
  // Staff assign
  const [staffId, setStaffId]         = useState(lead.assigned_staff_id ?? "");
  const [savingStaff, setSavingStaff]  = useState(false);
  // Note
  const [note, setNote]               = useState("");
  const [savingNote, setSavingNote]   = useState(false);
  // CRM sync
  const [syncing, setSyncing]         = useState(false);
  // Comm log
  const [commForm, setCommForm]       = useState({ type: "whatsapp" as CommType, message: "", subject: "" });
  const [savingComm, setSavingComm]   = useState(false);
  // Doc review
  const [rejectingDoc, setRejectingDoc] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const loadTab = useCallback(async (t: typeof tab) => {
    setLoadingTab(true);
    if (t === "docs") {
      const res = await apiFetch(`/api/admin/leads/${lead.id}/documents`);
      if (res.success) setDocs(res.data ?? []);
    } else if (t === "comms") {
      const res = await apiFetch(`/api/admin/leads/${lead.id}`);
      if (res.success) { setComms(res.data.communications ?? []); }
    } else {
      const res = await apiFetch(`/api/admin/leads/${lead.id}`);
      if (res.success) setEvents(res.data.state_history ?? []);
    }
    setLoadingTab(false);
  }, [lead.id]);

  useEffect(() => { loadTab(tab); }, [tab, loadTab]);

  async function changeStatus() {
    if (newStatus === lead.status) return;
    setSavingStatus(true);
    const res = await apiFetch(`/api/admin/leads/${lead.id}/status`, { method: "PATCH", body: JSON.stringify({ status: newStatus }) });
    setSavingStatus(false);
    if (res.success) onUpdated(res.data);
  }

  async function assignStaff() {
    if (!staffId) return;
    setSavingStaff(true);
    const res = await apiFetch(`/api/admin/leads/${lead.id}/assign`, { method: "PATCH", body: JSON.stringify({ staff_id: staffId }) });
    setSavingStaff(false);
    if (res.success) onUpdated(res.data);
  }

  async function addNote() {
    if (!note.trim()) return;
    setSavingNote(true);
    await apiFetch(`/api/admin/leads/${lead.id}/note`, { method: "POST", body: JSON.stringify({ note }) });
    setSavingNote(false);
    setNote("");
  }

  async function syncCrm() {
    setSyncing(true);
    await apiFetch(`/api/admin/leads/${lead.id}/sync-crm`, { method: "POST" });
    setSyncing(false);
    const res = await apiFetch(`/api/admin/leads/${lead.id}`);
    if (res.success) onUpdated(res.data);
  }

  async function reviewDoc(docId: string, status: "approved" | "rejected") {
    const body: Record<string, unknown> = { status };
    if (status === "rejected") body.rejection_reason = rejectReason;
    const res = await apiFetch(`/api/admin/leads/${lead.id}/documents/${docId}`, { method: "PATCH", body: JSON.stringify(body) });
    if (res.success) { setDocs(p => p.map(d => d.id === docId ? res.data : d)); setRejectingDoc(null); setRejectReason(""); }
  }

  async function logComm(e: React.FormEvent) {
    e.preventDefault();
    if (!commForm.message.trim()) return;
    setSavingComm(true);
    await apiFetch(`/api/admin/leads/${lead.id}/communicate`, { method: "POST", body: JSON.stringify({ type: commForm.type, message: commForm.message, subject: commForm.subject || undefined }) });
    setSavingComm(false);
    setCommForm({ type: "whatsapp", message: "", subject: "" });
    loadTab("comms");
  }

  const iCls = "w-full h-9 px-3 border border-border-light rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-green/30 bg-white";
  const TABS = [
    { key: "docs",     label: `المستندات (${docs.length})` },
    { key: "comms",    label: "التواصل"  },
    { key: "timeline", label: "السجل"    },
  ] as const;

  const crm = lead.sync_status;

  return (
    <div className="w-80 shrink-0 bg-white rounded-2xl border border-border-light flex flex-col self-start sticky top-6 max-h-[calc(100vh-6rem)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
        <div>
          <p className="font-bold text-text-primary text-sm">{lead.profiles?.full_name ?? "—"}</p>
          <p className="text-xs text-text-muted">{lead.destination_country} · {TRAVEL_LABELS[lead.travel_type] ?? lead.travel_type}</p>
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Status */}
        <div>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">الحالة</p>
          <div className="flex gap-2">
            <select value={newStatus} onChange={e => setNewStatus(e.target.value as PortalStatus)} className={cn(iCls, "flex-1")}>
              {Object.entries(STATUS_CFG).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
            </select>
            <button onClick={changeStatus} disabled={savingStatus || newStatus === lead.status} className="h-9 px-3 bg-brand-green text-white text-xs font-bold rounded-lg disabled:opacity-40 hover:bg-brand-green-dark transition">
              {savingStatus ? "…" : "حفظ"}
            </button>
          </div>
        </div>

        {/* Assign staff */}
        <div>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">تعيين موظف</p>
          <div className="flex gap-2">
            <select value={staffId} onChange={e => setStaffId(e.target.value)} className={cn(iCls, "flex-1")}>
              <option value="">— اختر موظف —</option>
              {staffList.map(s => <option key={s.user_id} value={s.user_id}>{s.full_name}</option>)}
            </select>
            <button onClick={assignStaff} disabled={savingStaff || !staffId} className="h-9 px-3 bg-brand-green text-white text-xs font-bold rounded-lg disabled:opacity-40 hover:bg-brand-green-dark transition">
              {savingStaff ? "…" : "تعيين"}
            </button>
          </div>
          {lead.assigned_staff && <p className="text-[11px] text-text-muted mt-1">معين حالياً: {lead.assigned_staff.full_name}</p>}
        </div>

        {/* Note */}
        <div>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">إضافة ملاحظة</p>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="اكتب ملاحظة..." className={cn(iCls, "h-auto py-2 resize-none")} />
          <button onClick={addNote} disabled={savingNote || !note.trim()} className="mt-1.5 w-full h-8 bg-bg-alt border border-border-light text-xs font-semibold text-text-secondary rounded-lg hover:bg-gray-100 disabled:opacity-40 transition">
            {savingNote ? "جاري الحفظ…" : "إضافة ملاحظة"}
          </button>
        </div>

        {/* CRM sync */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">CRM</p>
            <p className="text-xs mt-0.5">
              {crm === "synced" ? <span className="text-green-600 font-semibold">✓ مرسل</span>
                : crm === "failed" ? <span className="text-red-500 font-semibold">✗ فشل</span>
                : <span className="text-yellow-600 font-semibold">⏳ معلق</span>}
            </p>
          </div>
          <button onClick={syncCrm} disabled={syncing || crm === "synced"} className="h-8 px-3 bg-brand-yellow text-brand-dark text-xs font-bold rounded-lg disabled:opacity-40 hover:bg-amber-300 transition">
            {syncing ? "جاري…" : "إرسال للـ CRM"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-t border-border-light">
        <div className="flex">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={cn("flex-1 py-2.5 text-xs font-semibold transition",
              tab === t.key ? "border-b-2 border-brand-green text-brand-green" : "text-text-muted hover:text-text-secondary"
            )}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {loadingTab ? (
          <div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-brand-green border-t-transparent rounded-full animate-spin" /></div>
        ) : tab === "docs" ? (
          <div className="space-y-2">
            {docs.length === 0 ? <p className="text-xs text-text-muted text-center py-4">لا توجد مستندات</p> : docs.map(doc => (
              <div key={doc.id} className="border border-border-light rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text-primary truncate">{doc.document_type}</p>
                    {doc.file_name && <p className="text-[10px] text-text-muted truncate">{doc.file_name}</p>}
                    {doc.rejection_reason && <p className="text-[10px] text-red-500 mt-0.5">{doc.rejection_reason}</p>}
                  </div>
                  <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0", DOC_CFG[doc.status].cls)}>
                    {DOC_CFG[doc.status].label}
                  </span>
                </div>
                {doc.status === "uploaded" && (
                  rejectingDoc === doc.id ? (
                    <div className="mt-2 space-y-1.5">
                      <input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="سبب الرفض..." className="w-full h-8 px-2 border border-red-300 rounded text-xs focus:outline-none" />
                      <div className="flex gap-1.5">
                        <button onClick={() => reviewDoc(doc.id, "rejected")} disabled={!rejectReason} className="flex-1 h-7 bg-red-500 text-white text-[11px] font-bold rounded disabled:opacity-40">رفض</button>
                        <button onClick={() => { setRejectingDoc(null); setRejectReason(""); }} className="flex-1 h-7 border border-border-light text-[11px] rounded hover:bg-bg-alt">إلغاء</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-1.5 mt-2">
                      <button onClick={() => reviewDoc(doc.id, "approved")} className="flex-1 h-7 bg-green-500 text-white text-[11px] font-bold rounded hover:bg-green-600 transition">قبول</button>
                      <button onClick={() => setRejectingDoc(doc.id)} className="flex-1 h-7 border border-red-300 text-red-600 text-[11px] font-bold rounded hover:bg-red-50 transition">رفض</button>
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
        ) : tab === "comms" ? (
          <div className="space-y-3">
            <form onSubmit={logComm} className="space-y-2 pb-3 border-b border-border-light">
              <div className="flex gap-2">
                <select value={commForm.type} onChange={e => setCommForm(p => ({ ...p, type: e.target.value as CommType }))} className={cn(iCls, "w-28")}>
                  <option value="whatsapp">واتساب</option><option value="email">إيميل</option>
                  <option value="phone_call">مكالمة</option><option value="sms">SMS</option>
                  <option value="system_notification">تنبيه</option>
                </select>
                <input value={commForm.subject} onChange={e => setCommForm(p => ({ ...p, subject: e.target.value }))} placeholder="الموضوع (اختياري)" className={cn(iCls, "flex-1")} />
              </div>
              <textarea value={commForm.message} onChange={e => setCommForm(p => ({ ...p, message: e.target.value }))} rows={2} placeholder="نص الرسالة..." className={cn(iCls, "h-auto py-2 resize-none")} />
              <button type="submit" disabled={savingComm || !commForm.message.trim()} className="w-full h-8 bg-brand-green text-white text-xs font-bold rounded-lg disabled:opacity-40 hover:bg-brand-green-dark transition">
                {savingComm ? "…" : "تسجيل التواصل"}
              </button>
            </form>
            {comms.length === 0 ? <p className="text-xs text-text-muted text-center py-2">لا يوجد سجل تواصل</p> : comms.map(c => (
              <div key={c.id} className="text-xs border border-border-light rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span>{COMM_ICONS[c.communication_type]}</span>
                  <span className="font-semibold text-text-primary">{c.subject || c.communication_type}</span>
                  <span className="text-text-muted mr-auto">{fmtDate(c.sent_at)} {fmtTime(c.sent_at)}</span>
                </div>
                <p className="text-text-secondary line-clamp-2">{c.message}</p>
              </div>
            ))}
          </div>
        ) : (
          /* Timeline */
          <div className="space-y-3">
            {events.length === 0 ? <p className="text-xs text-text-muted text-center py-4">لا يوجد سجل</p> : events.map((ev, i) => (
              <div key={ev.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-brand-green shrink-0 mt-0.5" />
                  {i < events.length - 1 && <div className="w-px flex-1 bg-border-light mt-1" />}
                </div>
                <div className="pb-3 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {ev.previous_state && <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{ev.previous_state}</span>}
                    {ev.previous_state && <span className="text-[10px] text-text-muted">→</span>}
                    <span className="text-[10px] bg-brand-green/10 text-brand-green font-semibold px-1.5 py-0.5 rounded">{ev.new_state}</span>
                  </div>
                  <p className="text-[10px] text-text-muted mt-0.5">{ev.event_type} · {fmtDate(ev.created_at)}</p>
                  {ev.triggered_by && <p className="text-[10px] text-text-muted">بواسطة: {ev.triggered_by}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminLeadsPage() {
  const [leads, setLeads]           = useState<Lead[]>([]);
  const [staffList, setStaffList]   = useState<StaffProfile[]>([]);
  const [loading, setLoading]       = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [page, setPage]             = useState(1);
  const [total, setTotal]           = useState(0);
  const LIMIT = 20;

  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType]     = useState("");
  const [search, setSearch]             = useState("");
  const [dateFrom, setDateFrom]         = useState("");
  const [dateTo, setDateTo]             = useState("");

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
    if (filterStatus) params.set("status", filterStatus);
    if (filterType)   params.set("travel_type", filterType);
    if (search)       params.set("search", search);
    if (dateFrom)     params.set("date_from", dateFrom);
    if (dateTo)       params.set("date_to", dateTo);
    const res = await apiFetch(`/api/admin/leads?${params}`);
    if (res.success) { setLeads(res.data ?? []); setTotal(res.total ?? 0); }
    setLoading(false);
  }, [filterStatus, filterType, search, dateFrom, dateTo]);

  // Load staff for assign dropdown
  useEffect(() => {
    apiFetch("/api/admin/customers").then(res => {
      if (res.success || res.customers) {
        const all = res.customers ?? res.data ?? [];
        setStaffList(all.filter((c: StaffProfile) => c.role === "staff" || c.role === "admin"));
      }
    });
  }, []);

  useEffect(() => { load(1); setPage(1); }, [load]);

  function handleUpdated(updated: Lead) {
    setLeads(p => p.map(l => l.id === updated.id ? { ...l, ...updated } : l));
    setSelectedLead(prev => prev?.id === updated.id ? { ...prev, ...updated } : prev);
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">العملاء المحتملون</h1>
          <p className="text-sm text-text-muted mt-0.5">{total} إجمالي</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 bg-white rounded-xl border border-border-light p-3">
        <div className="relative">
          <svg className="absolute top-2.5 right-2.5 text-text-muted" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم…" className="h-9 pr-8 ps-3 border border-border-light rounded-lg text-xs focus:outline-none w-40" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-9 px-2 border border-border-light rounded-lg text-xs focus:outline-none bg-white w-40">
          <option value="">كل الحالات</option>
          {Object.entries(STATUS_CFG).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="h-9 px-2 border border-border-light rounded-lg text-xs focus:outline-none bg-white w-36">
          <option value="">كل الأنواع</option>
          {Object.entries(TRAVEL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 px-2 border border-border-light rounded-lg text-xs focus:outline-none bg-white" title="من تاريخ" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 px-2 border border-border-light rounded-lg text-xs focus:outline-none bg-white" title="إلى تاريخ" />
        <button onClick={() => load(1)} className="h-9 px-4 bg-bg-alt border border-border-light rounded-lg text-xs font-semibold text-text-secondary hover:bg-gray-100 transition">تحديث</button>
      </div>

      <div className="flex gap-4">
        {/* Table */}
        <div className={cn("bg-white rounded-2xl border border-border-light overflow-hidden min-w-0", selectedLead ? "flex-1" : "w-full")}>
          {loading ? (
            <div className="flex justify-center py-14"><div className="w-7 h-7 border-4 border-brand-green border-t-transparent rounded-full animate-spin" /></div>
          ) : leads.length === 0 ? (
            <div className="text-center py-14 text-text-muted text-sm">لا توجد نتائج</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bg-alt border-b border-border-light text-xs text-text-muted font-semibold">
                    <th className="text-right px-4 py-3">العميل</th>
                    <th className="text-right px-4 py-3">الوجهة</th>
                    <th className="text-right px-4 py-3">الحالة</th>
                    <th className="text-right px-4 py-3 hidden lg:table-cell">CRM</th>
                    <th className="text-right px-4 py-3 hidden xl:table-cell">التاريخ</th>
                    <th className="text-right px-4 py-3">تفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {leads.map(lead => (
                    <tr key={lead.id} className={cn("hover:bg-bg-alt/40 transition-colors cursor-pointer", selectedLead?.id === lead.id && "bg-bg-alt")} onClick={() => setSelectedLead(selectedLead?.id === lead.id ? null : lead)}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-text-primary">{lead.profiles?.full_name ?? "—"}</p>
                        <p className="text-[11px] text-text-muted">{lead.profiles?.phone ?? ""}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-text-secondary">{lead.destination_country}</p>
                        <p className="text-[11px] text-text-muted">{TRAVEL_LABELS[lead.travel_type] ?? lead.travel_type}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", STATUS_CFG[lead.status]?.cls)}>
                          {STATUS_CFG[lead.status]?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {lead.sync_status === "synced"
                          ? <span className="text-xs font-semibold text-green-600">✓ مرسل</span>
                          : lead.sync_status === "failed"
                          ? <span className="text-xs font-semibold text-red-500">✗ فشل</span>
                          : <span className="text-xs text-yellow-600 font-semibold">⏳ معلق</span>}
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell text-xs text-text-muted">{fmtDate(lead.created_at)}</td>
                      <td className="px-4 py-3">
                        <button className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border-light hover:bg-bg-alt transition" onClick={e => { e.stopPropagation(); setSelectedLead(selectedLead?.id === lead.id ? null : lead); }}>
                          تفاصيل
                        </button>
                      </td>
                    </tr>
                  ))}
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
        {selectedLead && (
          <LeadDetailPanel
            lead={selectedLead}
            staffList={staffList}
            onClose={() => setSelectedLead(null)}
            onUpdated={handleUpdated}
          />
        )}
      </div>
    </div>
  );
}
