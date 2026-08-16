"use client";

/**
 * /admin/customers/[id]
 * Full customer detail — 6 tabs: Profile, Requests, Documents, Quotations, Bookings, Communications
 * Role change (admin only) with confirmation modal.
 */

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Role    = "admin" | "staff" | "customer";
type DocStatus = "uploaded" | "under_review" | "approved" | "rejected" | "expired";
type PortalStatus = "pending_documents" | "documents_review" | "docs_approved" | "in_progress" | "completed" | "cancelled";

interface Profile {
  id: string; user_id: string; full_name: string; phone: string; role: Role;
  created_at: string; updated_at: string; sync_status?: string;
}
interface TravelRequest {
  id: string; destination_country: string; travel_type: string; status: PortalStatus;
  traveler_count: number; departure_date: string | null; created_at: string; documents_completion_percent: number;
}
interface Document { id: string; document_type: string; file_name: string | null; status: DocStatus; created_at: string; }
interface Quotation { id: string; status: string; total_amount: number; currency: string; created_at: string; valid_until: string | null; }
interface Booking   { id: string; booking_reference: string | null; status: string; created_at: string; total_paid?: number; }
interface Comm      { id: string; communication_type: string; subject: string | null; message: string; sent_at: string; }

const STATUS_CFG: Record<PortalStatus, { label: string; cls: string }> = {
  pending_documents: { label: "بانتظار المستندات", cls: "bg-yellow-100 text-yellow-700" },
  documents_review:  { label: "قيد المراجعة",      cls: "bg-blue-100 text-blue-700"   },
  docs_approved:     { label: "مستندات مقبولة",     cls: "bg-indigo-100 text-indigo-700"},
  in_progress:       { label: "جاري التنفيذ",       cls: "bg-purple-100 text-purple-700"},
  completed:         { label: "مكتمل",              cls: "bg-green-100 text-green-700" },
  cancelled:         { label: "ملغي",               cls: "bg-gray-100 text-gray-600"   },
};
const ROLE_CFG: Record<Role, { label: string; cls: string }> = {
  customer: { label: "عميل",   cls: "bg-blue-100 text-blue-700"   },
  staff:    { label: "موظف",   cls: "bg-purple-100 text-purple-700"},
  admin:    { label: "مسؤول",  cls: "bg-red-100 text-red-700"     },
};
const DOC_CFG: Record<DocStatus, { label: string; cls: string }> = {
  uploaded:    { label: "مرفوع",        cls: "bg-blue-100 text-blue-700"   },
  under_review:{ label: "قيد المراجعة", cls: "bg-yellow-100 text-yellow-700"},
  approved:    { label: "موافق",        cls: "bg-green-100 text-green-700" },
  rejected:    { label: "مرفوض",        cls: "bg-red-100 text-red-700"     },
  expired:     { label: "منتهي",        cls: "bg-gray-100 text-gray-500"   },
};
const QUOTE_CFG: Record<string, { label: string; cls: string }> = {
  DRAFT:    { label: "مسودة",   cls: "bg-gray-100 text-gray-600"   },
  SENT:     { label: "مرسل",    cls: "bg-blue-100 text-blue-700"   },
  ACCEPTED: { label: "مقبول",   cls: "bg-green-100 text-green-700" },
  EXPIRED:  { label: "منتهي",   cls: "bg-orange-100 text-orange-600"},
  REJECTED: { label: "مرفوض",   cls: "bg-red-100 text-red-700"     },
  CONVERTED:{ label: "محوّل",   cls: "bg-purple-100 text-purple-700"},
};
const BOOKING_CFG: Record<string, { label: string; cls: string }> = {
  PENDING_PAYMENT: { label: "بانتظار الدفع", cls: "bg-yellow-100 text-yellow-700"},
  CONFIRMED:       { label: "مؤكد",          cls: "bg-green-100 text-green-700" },
  COMPLETED:       { label: "مكتمل",         cls: "bg-teal-100 text-teal-700"   },
  CANCELLED:       { label: "ملغي",          cls: "bg-gray-100 text-gray-600"   },
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
function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ar-EG", { day: "2-digit", month: "short", year: "numeric" });
}

const COMM_ICONS: Record<string, string> = {
  email: "📧", whatsapp: "📱", sms: "💬", phone_call: "📞", system_notification: "🔔",
};

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData]       = useState<{
    profile: Profile;
    travel_requests: TravelRequest[];
    documents: Document[];
    quotations: Quotation[];
    bookings: Booking[];
    communications: Comm[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<"profile" | "requests" | "docs" | "quotes" | "bookings" | "comms">("profile");

  // Role change
  const [roleModal, setRoleModal]   = useState(false);
  const [newRole, setNewRole]       = useState<Role>("customer");
  const [savingRole, setSavingRole] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/admin/customers/${id}`).then(res => {
      if (res.success) setData(res.data);
      setLoading(false);
    });
  }, [id]);

  async function changeRole() {
    if (!data) return;
    setSavingRole(true);
    const res = await apiFetch(`/api/admin/customers/${id}/role`, { method: "PATCH", body: JSON.stringify({ role: newRole }) });
    setSavingRole(false);
    if (res.success) { setData(p => p ? { ...p, profile: res.data } : p); setRoleModal(false); }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin" /></div>;

  if (!data) return (
    <div className="text-center py-20 text-text-muted">
      <p className="font-semibold">العميل غير موجود</p>
      <Link href="/admin/customers" className="text-brand-green text-sm hover:underline mt-2 inline-block">← العودة للعملاء</Link>
    </div>
  );

  const { profile, travel_requests, documents, quotations, bookings, communications } = data;
  const tabs = [
    { key: "profile",  label: "الملف الشخصي",     count: null },
    { key: "requests", label: "الطلبات",           count: travel_requests.length },
    { key: "docs",     label: "المستندات",         count: documents.length },
    { key: "quotes",   label: "عروض الأسعار",      count: quotations.length },
    { key: "bookings", label: "الحجوزات",          count: bookings.length },
    { key: "comms",    label: "التواصل",           count: communications.length },
  ] as const;

  const iCls = "w-full h-10 px-3 border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 bg-white";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Link href="/admin/customers" className="hover:text-brand-green transition">العملاء</Link>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        <span className="text-text-primary font-semibold">{profile.full_name}</span>
      </div>

      {/* Profile header card */}
      <div className="bg-white rounded-2xl border border-border-light p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center text-2xl font-bold shrink-0">
            {profile.full_name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">{profile.full_name}</h1>
            <p className="text-sm text-text-muted">{profile.phone}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full", ROLE_CFG[profile.role].cls)}>
                {ROLE_CFG[profile.role].label}
              </span>
              <span className="text-xs text-text-muted">انضم {fmtDate(profile.created_at)}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => { setNewRole(profile.role); setRoleModal(true); }}
          className="h-9 px-4 text-xs font-semibold border border-border-light rounded-xl hover:bg-bg-alt transition shrink-0"
        >
          تغيير الدور
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
        <div className="flex border-b border-border-light overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
              className={cn("flex-shrink-0 px-4 py-3 text-sm font-semibold transition flex items-center gap-1.5",
                tab === t.key ? "border-b-2 border-brand-green text-brand-green" : "text-text-muted hover:text-text-secondary"
              )}>
              {t.label}
              {t.count !== null && t.count > 0 && (
                <span className="text-xs bg-bg-alt text-text-muted px-1.5 py-0.5 rounded-full">{t.count}</span>
              )}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* ── Profile tab ── */}
          {tab === "profile" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              {[
                { label: "الاسم الكامل",    value: profile.full_name },
                { label: "الهاتف",          value: profile.phone },
                { label: "الدور",           value: ROLE_CFG[profile.role].label },
                { label: "معرف المستخدم",   value: profile.user_id.slice(0, 16) + "…" },
                { label: "تاريخ الانضمام",  value: fmtDate(profile.created_at) },
                { label: "آخر تحديث",       value: fmtDate(profile.updated_at) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-bg-alt rounded-xl p-3">
                  <p className="text-xs text-text-muted mb-0.5">{label}</p>
                  <p className="font-semibold text-text-primary text-sm">{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* ── Requests tab ── */}
          {tab === "requests" && (
            travel_requests.length === 0 ? (
              <p className="text-center py-8 text-text-muted text-sm">لا توجد طلبات سفر</p>
            ) : (
              <div className="space-y-3">
                {travel_requests.map(r => (
                  <div key={r.id} className="border border-border-light rounded-xl p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-text-primary">{r.destination_country}</p>
                        <p className="text-xs text-text-muted">{r.travel_type} · {r.traveler_count} مسافرين</p>
                        {r.departure_date && <p className="text-xs text-text-muted">المغادرة: {fmtDate(r.departure_date)}</p>}
                      </div>
                      <div className="text-left space-y-1.5 shrink-0">
                        <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full block text-center", STATUS_CFG[r.status]?.cls)}>
                          {STATUS_CFG[r.status]?.label}
                        </span>
                        <div className="w-28">
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-green transition-all" style={{ width: `${r.documents_completion_percent}%` }} />
                          </div>
                          <p className="text-[10px] text-text-muted mt-0.5 text-center">{r.documents_completion_percent}% مستندات</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ── Documents tab ── */}
          {tab === "docs" && (
            documents.length === 0 ? (
              <p className="text-center py-8 text-text-muted text-sm">لا توجد مستندات</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-text-muted font-semibold border-b border-border-light">
                      <th className="text-right pb-2">نوع المستند</th>
                      <th className="text-right pb-2">الملف</th>
                      <th className="text-right pb-2">الحالة</th>
                      <th className="text-right pb-2">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {documents.map(d => (
                      <tr key={d.id} className="text-sm">
                        <td className="py-2.5 font-medium text-text-primary">{d.document_type}</td>
                        <td className="py-2.5 text-text-muted text-xs">{d.file_name ?? "—"}</td>
                        <td className="py-2.5">
                          <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", DOC_CFG[d.status].cls)}>
                            {DOC_CFG[d.status].label}
                          </span>
                        </td>
                        <td className="py-2.5 text-xs text-text-muted">{fmtDate(d.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* ── Quotations tab ── */}
          {tab === "quotes" && (
            quotations.length === 0 ? (
              <p className="text-center py-8 text-text-muted text-sm">لا توجد عروض أسعار</p>
            ) : (
              <div className="space-y-3">
                {quotations.map(q => (
                  <div key={q.id} className="flex items-center justify-between border border-border-light rounded-xl p-4">
                    <div>
                      <p className="font-semibold text-text-primary">{q.total_amount.toLocaleString("ar-EG")} {q.currency}</p>
                      <p className="text-xs text-text-muted">{fmtDate(q.created_at)}{q.valid_until ? ` · صالح حتى ${fmtDate(q.valid_until)}` : ""}</p>
                    </div>
                    <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", QUOTE_CFG[q.status]?.cls ?? "bg-gray-100 text-gray-600")}>
                      {QUOTE_CFG[q.status]?.label ?? q.status}
                    </span>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ── Bookings tab ── */}
          {tab === "bookings" && (
            bookings.length === 0 ? (
              <p className="text-center py-8 text-text-muted text-sm">لا توجد حجوزات</p>
            ) : (
              <div className="space-y-3">
                {bookings.map(b => (
                  <div key={b.id} className="flex items-center justify-between border border-border-light rounded-xl p-4">
                    <div>
                      <p className="font-semibold text-text-primary">{b.booking_reference ?? b.id.slice(0, 12)}</p>
                      <p className="text-xs text-text-muted">{fmtDate(b.created_at)}</p>
                    </div>
                    <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", BOOKING_CFG[b.status]?.cls ?? "bg-gray-100 text-gray-600")}>
                      {BOOKING_CFG[b.status]?.label ?? b.status}
                    </span>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ── Communications tab ── */}
          {tab === "comms" && (
            communications.length === 0 ? (
              <p className="text-center py-8 text-text-muted text-sm">لا يوجد سجل تواصل</p>
            ) : (
              <div className="space-y-3">
                {communications.map(c => (
                  <div key={c.id} className="border border-border-light rounded-xl p-3 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{COMM_ICONS[c.communication_type] ?? "📩"}</span>
                      <span className="font-semibold text-text-primary">{c.subject ?? c.communication_type}</span>
                      <span className="text-xs text-text-muted mr-auto">{fmtDate(c.sent_at)}</span>
                    </div>
                    <p className="text-xs text-text-secondary line-clamp-2">{c.message}</p>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Role change modal */}
      {roleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" dir="rtl">
          <div className="bg-white rounded-2xl p-6 w-80 space-y-4 shadow-xl">
            <h3 className="font-bold text-text-primary">تغيير دور المستخدم</h3>
            <p className="text-xs text-text-muted">الدور الحالي: <strong>{ROLE_CFG[profile.role].label}</strong></p>
            <select value={newRole} onChange={e => setNewRole(e.target.value as Role)} className={iCls}>
              <option value="customer">عميل</option>
              <option value="staff">موظف</option>
              <option value="admin">مسؤول</option>
            </select>
            <p className="text-xs text-yellow-700 bg-yellow-50 rounded-lg px-3 py-2">⚠️ هذا الإجراء مسجّل في سجل النظام ولا يمكن التراجع عنه بسهولة.</p>
            <div className="flex gap-3">
              <button onClick={changeRole} disabled={savingRole || newRole === profile.role} className="flex-1 h-10 bg-brand-green text-white text-sm font-bold rounded-xl hover:bg-brand-green-dark disabled:opacity-40 transition">
                {savingRole ? "…" : "تأكيد"}
              </button>
              <button onClick={() => setRoleModal(false)} className="flex-1 h-10 border border-border-light text-sm rounded-xl hover:bg-bg-alt transition">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
