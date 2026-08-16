"use client";

/**
 * /admin/quotations
 * Full quotations management — list, create with line items, send, convert to booking.
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface QuotationItem { type: string; description: string; amount: number; }
interface Quotation {
  id: string; status: string; total_amount: number; currency: string;
  created_at: string; valid_until: string | null; sent_at: string | null;
  accepted_at: string | null;
  users: { id: string; email: string; first_name: string | null; last_name: string | null } | null;
  items: QuotationItem[];
}
interface CrmUser { id: string; email: string; first_name: string | null; last_name: string | null; }

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  DRAFT:    { label: "مسودة",    cls: "bg-gray-100 text-gray-600"    },
  SENT:     { label: "مرسل",     cls: "bg-blue-100 text-blue-700"    },
  ACCEPTED: { label: "مقبول",    cls: "bg-green-100 text-green-700"  },
  EXPIRED:  { label: "منتهي",    cls: "bg-orange-100 text-orange-600"},
  REJECTED: { label: "مرفوض",    cls: "bg-red-100 text-red-700"      },
  CONVERTED:{ label: "محوّل",    cls: "bg-purple-100 text-purple-700"},
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

// ─── Create form ──────────────────────────────────────────────────────────────
function CreateQuotationModal({ onSaved, onClose }: { onSaved: (q: Quotation) => void; onClose: () => void }) {
  const [customers, setCustomers] = useState<CrmUser[]>([]);
  const [userId, setUserId]       = useState("");
  const [currency, setCurrency]   = useState("EGP");
  const [items, setItems]         = useState<QuotationItem[]>([{ type: "SERVICE_FEE", description: "", amount: 0 }]);
  const [saving, setSaving]       = useState(false);
  const [search, setSearch]       = useState("");

  useEffect(() => {
    apiFetch("/api/admin/customers").then(res => {
      const all = res.customers ?? res.data ?? [];
      // Filter only CRM users (those with crm_user_id or direct from users table)
      setCustomers(all.slice(0, 100));
    });
  }, []);

  const total = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  function setItem(idx: number, k: keyof QuotationItem, v: unknown) {
    setItems(p => p.map((item, i) => i === idx ? { ...item, [k]: v } : item));
  }
  function addItem() { setItems(p => [...p, { type: "SERVICE_FEE", description: "", amount: 0 }]); }
  function removeItem(idx: number) { setItems(p => p.filter((_, i) => i !== idx)); }

  const iCls = "h-9 px-2 border border-border-light rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-green/50 bg-white";
  const filtered = customers.filter(c =>
    !search || (c.email + (c.first_name ?? "") + (c.last_name ?? "")).toLowerCase().includes(search.toLowerCase())
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || items.length === 0) return;
    setSaving(true);
    const res = await apiFetch("/api/admin/quotations", {
      method: "POST",
      body: JSON.stringify({ user_id: userId, items, total_amount: total, currency }),
    });
    setSaving(false);
    if (res.success) { onSaved(res.data); onClose(); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" dir="rtl">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border-light px-5 py-4 flex items-center justify-between z-10 rounded-t-2xl">
          <h2 className="font-bold text-text-primary">إنشاء عرض سعر</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          {/* Customer search */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">اختر العميل *</label>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث بالإيميل أو الاسم…" className="w-full h-9 px-3 border border-border-light rounded-lg text-xs focus:outline-none mb-2" />
            <div className="max-h-32 overflow-y-auto border border-border-light rounded-lg divide-y divide-border-light">
              {filtered.slice(0, 20).map(c => (
                <button key={c.id} type="button" onClick={() => setUserId(c.id)}
                  className={cn("w-full text-right px-3 py-2 text-xs hover:bg-bg-alt transition",
                    userId === c.id && "bg-brand-green/10 font-semibold text-brand-green"
                  )}>
                  {c.first_name} {c.last_name} <span className="text-text-muted">({c.email})</span>
                </button>
              ))}
              {filtered.length === 0 && <p className="text-xs text-text-muted text-center py-3">لا توجد نتائج</p>}
            </div>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">العملة</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)} className={cn(iCls, "w-36")}>
              <option value="EGP">EGP</option><option value="USD">USD</option><option value="EUR">EUR</option>
            </select>
          </div>

          {/* Line items */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-2">البنود</label>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select value={item.type} onChange={e => setItem(idx, "type", e.target.value)} className={cn(iCls, "w-32")}>
                    <option value="VISA_FEE">رسوم فيزا</option>
                    <option value="SERVICE_FEE">رسوم خدمة</option>
                    <option value="FLIGHT">طيران</option>
                    <option value="HOTEL">فندق</option>
                    <option value="OTHER">أخرى</option>
                  </select>
                  <input value={item.description} onChange={e => setItem(idx, "description", e.target.value)} placeholder="الوصف" className={cn(iCls, "flex-1")} />
                  <input type="number" min={0} value={item.amount} onChange={e => setItem(idx, "amount", Number(e.target.value))} className={cn(iCls, "w-24")} />
                  <button type="button" onClick={() => removeItem(idx)} disabled={items.length === 1} className="text-red-400 hover:text-red-600 disabled:opacity-30">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addItem} className="mt-2 flex items-center gap-1.5 text-xs text-brand-green font-semibold hover:underline">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              إضافة بند
            </button>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between bg-bg-alt rounded-xl px-4 py-3">
            <span className="text-sm font-semibold text-text-secondary">الإجمالي</span>
            <span className="text-lg font-bold text-text-primary">{total.toLocaleString("ar-EG")} {currency}</span>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving || !userId} className="flex-1 h-11 bg-brand-green text-white font-bold rounded-xl text-sm hover:bg-brand-green-dark disabled:opacity-40 transition">
              {saving ? "جاري الإنشاء…" : "إنشاء العرض"}
            </button>
            <button type="button" onClick={onClose} className="px-5 h-11 border border-border-light rounded-xl text-sm text-text-secondary hover:bg-bg-alt transition">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminQuotationsPage() {
  const [quotes, setQuotes]     = useState<Quotation[]>([]);
  const [loading, setLoading]   = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = filterStatus ? `?status=${filterStatus}` : "";
    const res = await apiFetch(`/api/admin/quotations${params}`);
    if (res.success) setQuotes(res.data ?? []);
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  async function action(id: string, type: "send" | "convert") {
    setActionLoading(id + type);
    const res = await apiFetch(`/api/admin/quotations/${id}/${type}`, { method: "POST" });
    setActionLoading(null);
    if (res.success) load();
  }

  const iCls = "h-9 px-3 border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 bg-white";

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">عروض الأسعار</h1>
          <p className="text-sm text-text-muted mt-0.5">{quotes.length} عرض</p>
        </div>
        <button onClick={() => setFormOpen(true)} className="flex items-center gap-2 bg-brand-green text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-green-dark transition">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          عرض سعر جديد
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 bg-white rounded-xl border border-border-light p-3">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={cn(iCls, "w-40")}>
          <option value="">كل الحالات</option>
          {Object.entries(STATUS_CFG).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
        </select>
        <button onClick={load} className="h-9 px-4 bg-bg-alt border border-border-light rounded-lg text-sm font-semibold text-text-secondary hover:bg-gray-100 transition">تحديث</button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bg-alt border-b border-border-light text-xs text-text-muted font-semibold">
                  <th className="text-right px-4 py-3">العميل</th>
                  <th className="text-right px-4 py-3">الإجمالي</th>
                  <th className="text-right px-4 py-3">الحالة</th>
                  <th className="text-right px-4 py-3">التاريخ</th>
                  <th className="text-right px-4 py-3">صالح حتى</th>
                  <th className="text-right px-4 py-3">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {quotes.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-text-muted">لا توجد عروض</td></tr>
                ) : (
                  quotes.map(q => (
                    <tr key={q.id} className="hover:bg-bg-alt/40 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-text-primary">
                          {q.users ? `${q.users.first_name ?? ""} ${q.users.last_name ?? ""}`.trim() || q.users.email : "—"}
                        </p>
                        <p className="text-[11px] text-text-muted">{q.users?.email}</p>
                      </td>
                      <td className="px-4 py-3 font-bold text-text-primary">
                        {q.total_amount.toLocaleString("ar-EG")} {q.currency}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", STATUS_CFG[q.status]?.cls ?? "bg-gray-100 text-gray-600")}>
                          {STATUS_CFG[q.status]?.label ?? q.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-muted">{fmtDate(q.created_at)}</td>
                      <td className="px-4 py-3 text-xs text-text-muted">{fmtDate(q.valid_until)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {q.status === "DRAFT" && (
                            <button
                              onClick={() => action(q.id, "send")}
                              disabled={actionLoading === q.id + "send"}
                              className="h-8 px-3 text-xs font-bold bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition"
                            >
                              {actionLoading === q.id + "send" ? "…" : "إرسال"}
                            </button>
                          )}
                          {q.status === "SENT" && (
                            <button
                              onClick={() => action(q.id, "convert")}
                              disabled={actionLoading === q.id + "convert"}
                              className="h-8 px-3 text-xs font-bold bg-brand-green text-white rounded-lg hover:bg-brand-green-dark disabled:opacity-50 transition"
                            >
                              {actionLoading === q.id + "convert" ? "…" : "تحويل لحجز"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {formOpen && (
        <CreateQuotationModal
          onSaved={q => setQuotes(p => [q, ...p])}
          onClose={() => setFormOpen(false)}
        />
      )}
    </div>
  );
}
