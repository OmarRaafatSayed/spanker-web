"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type RequestStatus = "pending_documents" | "documents_review" | "docs_approved" | "in_progress" | "completed" | "cancelled";

interface Lead {
  id: string;
  tracking_id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  destination_country: string;
  travel_type: string;
  status: RequestStatus;
  traveler_count: number;
  departure_date?: string;
  crm_synced: boolean;
  created_at: string;
  assigned_staff?: string;
}

const STATUS_CONFIG: Record<RequestStatus, { label: string; cls: string }> = {
  pending_documents: { label: "بانتظار المستندات", cls: "bg-yellow-100 text-yellow-700" },
  documents_review: { label: "قيد المراجعة", cls: "bg-blue-100 text-blue-700" },
  docs_approved: { label: "مستندات مقبولة", cls: "bg-indigo-100 text-indigo-700" },
  in_progress: { label: "جاري التنفيذ", cls: "bg-purple-100 text-purple-700" },
  completed: { label: "مكتمل", cls: "bg-green-100 text-green-700" },
  cancelled: { label: "ملغي", cls: "bg-gray-100 text-gray-600" },
};

const TRAVEL_TYPE_LABELS: Record<string, string> = {
  visa_only: "فيزا فقط",
  visa_flight: "فيزا + طيران",
  visa_hotel: "فيزا + فندق",
  full_package: "باقة كاملة",
};

const MOCK_LEADS: Lead[] = [
  { id: "1", tracking_id: "TRK001", client_name: "أحمد محمد علي", client_email: "ahmed@example.com", client_phone: "01012345678", destination_country: "الإمارات", travel_type: "visa_only", status: "pending_documents", traveler_count: 2, crm_synced: true, created_at: "2026-08-10T09:00:00Z" },
  { id: "2", tracking_id: "TRK002", client_name: "سارة خالد", client_email: "sara@example.com", client_phone: "01123456789", destination_country: "تركيا", travel_type: "visa_flight", status: "docs_approved", traveler_count: 1, departure_date: "2026-09-15", crm_synced: true, created_at: "2026-08-09T14:30:00Z", assigned_staff: "محمد سالم" },
  { id: "3", tracking_id: "TRK003", client_name: "عمر إبراهيم", client_email: "omar@example.com", client_phone: "01234567890", destination_country: "المجر", travel_type: "full_package", status: "in_progress", traveler_count: 4, departure_date: "2026-10-01", crm_synced: true, created_at: "2026-08-08T11:00:00Z", assigned_staff: "نور أحمد" },
  { id: "4", tracking_id: "TRK004", client_name: "مريم حسن", client_email: "mariam@example.com", client_phone: "01098765432", destination_country: "مصر", travel_type: "visa_only", status: "completed", traveler_count: 1, crm_synced: true, created_at: "2026-08-07T16:00:00Z" },
  { id: "5", tracking_id: "TRK005", client_name: "يوسف عبدالله", client_email: "yousef@example.com", client_phone: "01187654321", destination_country: "الأردن", travel_type: "visa_hotel", status: "documents_review", traveler_count: 3, crm_synced: false, created_at: "2026-08-10T08:00:00Z" },
];

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState<string | null>(null);

  const filtered = leads.filter(l => {
    const matchStatus = filterStatus === "all" || l.status === filterStatus;
    const matchSearch = !search || l.client_name.includes(search) || l.tracking_id.includes(search) || l.destination_country.includes(search);
    return matchStatus && matchSearch;
  });

  async function syncToCrm(lead: Lead) {
    setSyncing(lead.id);
    await new Promise(r => setTimeout(r, 1500));
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, crm_synced: true } : l));
    setSyncing(null);
  }

  function updateStatus(id: string, status: RequestStatus) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    if (selectedLead?.id === id) setSelectedLead(prev => prev ? { ...prev, status } : null);
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-xl font-bold text-text-primary">العملاء المحتملون</h1>
        <p className="text-sm text-text-muted mt-0.5">
          {leads.length} إجمالي · {leads.filter(l => !l.crm_synced).length} غير مرسل للـ CRM
        </p>
      </div>

      {/* Unsent CRM alert */}
      {leads.filter(l => !l.crm_synced).length > 0 && (
        <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-600 shrink-0 mt-0.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div>
            <p className="text-sm font-semibold text-yellow-800">
              {leads.filter(l => !l.crm_synced).length} عميل لم يُرسل للـ CRM بعد
            </p>
            <p className="text-xs text-yellow-700 mt-0.5">راجع العملاء وأرسلهم يدوياً أو انتظر المزامنة التلقائية</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute top-3 right-3 text-text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو رقم التتبع أو الوجهة..."
            className="w-full h-10 pe-4 ps-10 border border-border-light rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 bg-white"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: "all", label: "الكل" },
            { value: "pending_documents", label: "بانتظار المستندات" },
            { value: "in_progress", label: "قيد التنفيذ" },
            { value: "completed", label: "مكتمل" },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilterStatus(f.value)}
              className={cn(
                "text-xs font-semibold px-3 py-2 rounded-xl transition whitespace-nowrap",
                filterStatus === f.value ? "bg-brand-green text-white" : "bg-white border border-border-light text-text-secondary hover:bg-bg-alt"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        {/* Leads Table */}
        <div className={cn("bg-white rounded-2xl border border-border-light overflow-hidden", selectedLead ? "flex-1" : "w-full")}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light bg-bg-alt">
                  <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted">العميل</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted">الوجهة</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted">الحالة</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted hidden lg:table-cell">CRM</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-text-muted">لا توجد نتائج</td></tr>
                ) : (
                  filtered.map(lead => (
                    <tr
                      key={lead.id}
                      className={cn(
                        "hover:bg-bg-alt/50 transition-colors cursor-pointer",
                        selectedLead?.id === lead.id && "bg-bg-alt"
                      )}
                      onClick={() => setSelectedLead(lead)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-text-primary">{lead.client_name}</p>
                        <p className="text-xs text-text-muted">{lead.tracking_id}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-text-secondary">{lead.destination_country}</p>
                        <p className="text-xs text-text-muted">{TRAVEL_TYPE_LABELS[lead.travel_type]}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", STATUS_CONFIG[lead.status].cls)}>
                          {STATUS_CONFIG[lead.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {lead.crm_synced ? (
                          <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            مرسل
                          </span>
                        ) : (
                          <button
                            onClick={e => { e.stopPropagation(); syncToCrm(lead); }}
                            disabled={syncing === lead.id}
                            className="text-xs bg-brand-yellow text-brand-dark font-semibold px-2.5 py-1 rounded-full hover:bg-brand-yellow-dark transition disabled:opacity-50"
                          >
                            {syncing === lead.id ? "جاري الإرسال..." : "إرسال للـ CRM"}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={e => { e.stopPropagation(); setSelectedLead(selectedLead?.id === lead.id ? null : lead); }}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border-light hover:bg-bg-alt transition"
                        >
                          تفاصيل
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lead Detail Panel */}
        {selectedLead && (
          <div className="w-72 shrink-0 bg-white rounded-2xl border border-border-light p-5 self-start sticky top-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-text-primary text-sm">تفاصيل الطلب</h3>
              <button onClick={() => setSelectedLead(null)} className="text-text-muted hover:text-text-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">رقم التتبع</span>
                <span className="font-mono font-bold text-brand-green">{selectedLead.tracking_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">الاسم</span>
                <span className="font-semibold text-text-primary">{selectedLead.client_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">الوجهة</span>
                <span className="text-text-secondary">{selectedLead.destination_country}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">نوع السفر</span>
                <span className="text-text-secondary">{TRAVEL_TYPE_LABELS[selectedLead.travel_type]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">عدد المسافرين</span>
                <span className="text-text-secondary">{selectedLead.traveler_count}</span>
              </div>
              {selectedLead.departure_date && (
                <div className="flex justify-between">
                  <span className="text-text-muted">تاريخ السفر</span>
                  <span className="text-text-secondary">{new Date(selectedLead.departure_date).toLocaleDateString("ar-EG")}</span>
                </div>
              )}
            </div>

            <div className="border-t border-border-light pt-3">
              <p className="text-xs font-semibold text-text-secondary mb-2">التواصل</p>
              <a href={`mailto:${selectedLead.client_email}`} className="flex items-center gap-2 text-xs text-blue-600 hover:underline mb-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                {selectedLead.client_email}
              </a>
              <a href={`tel:${selectedLead.client_phone}`} className="flex items-center gap-2 text-xs text-green-600 hover:underline">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1 19.79 19.79 0 0 1 1.61 4.48 2 2 0 0 1 3.58 2.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6 6l1.27-.9a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                {selectedLead.client_phone}
              </a>
            </div>

            <div className="border-t border-border-light pt-3">
              <p className="text-xs font-semibold text-text-secondary mb-2">تحديث الحالة</p>
              <select
                value={selectedLead.status}
                onChange={e => updateStatus(selectedLead.id, e.target.value as RequestStatus)}
                className="w-full h-9 px-2 border border-border-light rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-green/30 bg-white"
              >
                {Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {!selectedLead.crm_synced && (
              <button
                onClick={() => syncToCrm(selectedLead)}
                disabled={syncing === selectedLead.id}
                className="w-full h-10 bg-brand-yellow text-brand-dark font-bold text-sm rounded-xl hover:bg-brand-yellow-dark transition disabled:opacity-50"
              >
                {syncing === selectedLead.id ? "جاري الإرسال..." : "إرسال للـ CRM"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
