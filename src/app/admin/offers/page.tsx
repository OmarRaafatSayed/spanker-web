"use client";

/**
 * /admin/offers
 * Full CRUD for special offers. Wired to /api/admin/offers.
 * Expiry highlighting: rows within 3 days of end_date get orange border.
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

type OfferType = "flight" | "hotel" | "visa" | "package";

interface Offer {
  id: string;
  title: string;
  offer_type: OfferType;
  destination: string;
  original_price: number | null;
  discounted_price: number;
  discount_percent: number | null;
  currency: string;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  terms_and_conditions: string | null;
  images: string[];
  available_slots: number | null;
  is_active: boolean;
  created_at: string;
}

const TYPE_LABELS: Record<OfferType, string> = {
  flight: "طيران", hotel: "فندق", visa: "تأشيرة", package: "باقة",
};
const TYPE_COLORS: Record<OfferType, string> = {
  flight: "bg-sky-100 text-sky-700",
  hotel:  "bg-amber-100 text-amber-700",
  visa:   "bg-purple-100 text-purple-700",
  package:"bg-green-100 text-green-700",
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

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ar-EG", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Offer Form Modal ─────────────────────────────────────────────────────────
interface OfferFormProps {
  initial?: Partial<Offer>;
  onSave: (data: Partial<Offer>) => Promise<void>;
  onClose: () => void;
}

function OfferForm({ initial, onSave, onClose }: OfferFormProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Offer>>({
    title: "", offer_type: "visa", destination: "",
    original_price: undefined, discounted_price: 0, discount_percent: undefined,
    currency: "EGP", start_date: "", end_date: "",
    description: "", terms_and_conditions: "",
    available_slots: undefined, is_active: true,
    ...initial,
  });

  const iCls = "w-full h-10 px-3 border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green bg-white";

  function set(k: keyof Offer, v: unknown) {
    setForm(p => {
      const next = { ...p, [k]: v };
      // Auto-calculate discount percent
      if ((k === "original_price" || k === "discounted_price") && next.original_price && next.discounted_price) {
        const orig = Number(next.original_price);
        const disc = Number(next.discounted_price);
        if (orig > disc) next.discount_percent = Math.round(((orig - disc) / orig) * 100 * 100) / 100;
      }
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" dir="rtl">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border-light px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
          <h2 className="font-bold text-text-primary">{initial?.id ? "تعديل العرض" : "إضافة عرض جديد"}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={submit} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Title */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-text-secondary mb-1">عنوان العرض *</label>
            <input value={form.title ?? ""} onChange={e => set("title", e.target.value)} className={iCls} required />
          </div>
          {/* Type + destination */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">نوع العرض *</label>
            <select value={form.offer_type} onChange={e => set("offer_type", e.target.value)} className={iCls}>
              {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">الوجهة *</label>
            <input value={form.destination ?? ""} onChange={e => set("destination", e.target.value)} className={iCls} required />
          </div>
          {/* Prices */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">السعر الأصلي</label>
            <input type="number" min={0} value={form.original_price ?? ""} onChange={e => set("original_price", e.target.value ? Number(e.target.value) : undefined)} placeholder="اختياري" className={iCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">السعر بعد الخصم *</label>
            <input type="number" min={0} value={form.discounted_price ?? ""} onChange={e => set("discounted_price", Number(e.target.value))} className={iCls} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">نسبة الخصم (%)</label>
            <input type="number" min={0} max={100} value={form.discount_percent ?? ""} onChange={e => set("discount_percent", e.target.value ? Number(e.target.value) : undefined)} placeholder="محسوب تلقائياً" className={iCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">العملة</label>
            <select value={form.currency ?? "EGP"} onChange={e => set("currency", e.target.value)} className={iCls}>
              <option value="EGP">جنيه مصري (EGP)</option>
              <option value="USD">دولار (USD)</option>
              <option value="EUR">يورو (EUR)</option>
            </select>
          </div>
          {/* Dates */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">تاريخ البداية</label>
            <input type="date" value={form.start_date?.slice(0, 10) ?? ""} onChange={e => set("start_date", e.target.value || null)} className={iCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">تاريخ الانتهاء</label>
            <input type="date" value={form.end_date?.slice(0, 10) ?? ""} onChange={e => set("end_date", e.target.value || null)} className={iCls} />
          </div>
          {/* Slots */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">الأماكن المتاحة</label>
            <input type="number" min={1} value={form.available_slots ?? ""} onChange={e => set("available_slots", e.target.value ? Number(e.target.value) : undefined)} placeholder="اختياري" className={iCls} />
          </div>
          {/* Active */}
          <div className="flex items-center gap-3 pt-4">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={form.is_active ?? true} onChange={e => set("is_active", e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-green" />
            </label>
            <span className="text-sm text-text-secondary">نشط ومرئي</span>
          </div>
          {/* Description */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-text-secondary mb-1">وصف العرض</label>
            <textarea value={form.description ?? ""} onChange={e => set("description", e.target.value)} rows={3} className={cn(iCls, "h-auto py-2")} />
          </div>
          {/* Terms */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-text-secondary mb-1">الشروط والأحكام</label>
            <textarea value={form.terms_and_conditions ?? ""} onChange={e => set("terms_and_conditions", e.target.value)} rows={2} className={cn(iCls, "h-auto py-2")} />
          </div>
          {/* Submit */}
          <div className="sm:col-span-2 flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 h-11 bg-brand-green text-white font-bold rounded-xl text-sm hover:bg-brand-green-dark transition disabled:opacity-50">
              {saving ? "جاري الحفظ..." : initial?.id ? "حفظ التغييرات" : "إضافة العرض"}
            </button>
            <button type="button" onClick={onClose} className="px-6 h-11 border border-border-light rounded-xl text-sm text-text-secondary hover:bg-bg-alt transition">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminOffersPage() {
  const [offers, setOffers]           = useState<Offer[]>([]);
  const [loading, setLoading]         = useState(true);
  const [formOpen, setFormOpen]       = useState(false);
  const [editing, setEditing]         = useState<Offer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Offer | null>(null);
  const [filterType, setFilterType]   = useState("all");
  const [filterActive, setFilterActive] = useState("all");
  const [search, setSearch]           = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterType !== "all")   params.set("type", filterType);
    if (filterActive !== "all") params.set("active", filterActive);
    const res = await apiFetch(`/api/admin/offers?${params}`);
    if (res.success) setOffers(res.data ?? []);
    setLoading(false);
  }, [filterType, filterActive]);

  useEffect(() => { load(); }, [load]);

  const filtered = offers.filter(o =>
    !search ||
    o.title.toLowerCase().includes(search.toLowerCase()) ||
    o.destination.toLowerCase().includes(search.toLowerCase())
  );

  async function saveOffer(data: Partial<Offer>) {
    if (editing?.id) {
      const res = await apiFetch(`/api/admin/offers/${editing.id}`, { method: "PATCH", body: JSON.stringify(data) });
      if (res.success) setOffers(p => p.map(o => o.id === editing.id ? res.data : o));
    } else {
      const res = await apiFetch("/api/admin/offers", { method: "POST", body: JSON.stringify(data) });
      if (res.success) setOffers(p => [res.data, ...p]);
    }
    setFormOpen(false);
    setEditing(null);
  }

  async function deleteOffer(id: string) {
    await apiFetch(`/api/admin/offers/${id}`, { method: "DELETE" });
    setOffers(p => p.filter(o => o.id !== id));
    setDeleteTarget(null);
  }

  async function toggleActive(o: Offer) {
    const res = await apiFetch(`/api/admin/offers/${o.id}`, { method: "PATCH", body: JSON.stringify({ is_active: !o.is_active }) });
    if (res.success) setOffers(p => p.map(i => i.id === o.id ? res.data : i));
  }

  const iCls = "h-9 px-3 border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 bg-white";

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">عروض خاصة</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {offers.length} عرض · {offers.filter(o => o.is_active).length} نشط
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="flex items-center gap-2 bg-brand-green text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-green-dark transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          عرض جديد
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white rounded-xl border border-border-light p-3">
        <div className="relative">
          <svg className="absolute top-2.5 right-2.5 text-text-muted" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..." className={cn(iCls, "pr-8 w-44")} />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className={cn(iCls, "w-36")}>
          <option value="all">كل الأنواع</option>
          {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={filterActive} onChange={e => setFilterActive(e.target.value)} className={cn(iCls, "w-32")}>
          <option value="all">الكل</option>
          <option value="true">نشط</option>
          <option value="false">مخفي</option>
        </select>
        <button onClick={load} className="h-9 px-4 bg-bg-alt border border-border-light rounded-lg text-sm font-semibold text-text-secondary hover:bg-gray-100 transition">تحديث</button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border-light flex flex-col items-center justify-center py-20 text-text-muted">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-40"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
          <p className="font-semibold">لا توجد عروض</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bg-alt border-b border-border-light text-xs text-text-muted font-semibold">
                  <th className="text-right px-4 py-3">العرض</th>
                  <th className="text-right px-4 py-3">النوع</th>
                  <th className="text-right px-4 py-3">السعر الأصلي</th>
                  <th className="text-right px-4 py-3">بعد الخصم</th>
                  <th className="text-right px-4 py-3">الخصم</th>
                  <th className="text-right px-4 py-3">الصلاحية</th>
                  <th className="text-right px-4 py-3">الأماكن</th>
                  <th className="text-right px-4 py-3">الحالة</th>
                  <th className="text-right px-4 py-3">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {filtered.map(o => {
                  const daysLeft = daysUntil(o.end_date);
                  const expiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3;
                  const expired      = daysLeft !== null && daysLeft < 0;
                  return (
                    <tr key={o.id} className={cn(
                      "hover:bg-bg-alt/40 transition-colors",
                      expiringSoon && "border-r-4 border-r-orange-400",
                      expired && "opacity-60"
                    )}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-text-primary">{o.title}</p>
                        <p className="text-xs text-text-muted">{o.destination}</p>
                        {expiringSoon && (
                          <span className="text-[10px] font-bold text-orange-600">⚠ ينتهي خلال {daysLeft} أيام</span>
                        )}
                        {expired && (
                          <span className="text-[10px] font-bold text-red-500">منتهي الصلاحية</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", TYPE_COLORS[o.offer_type])}>
                          {TYPE_LABELS[o.offer_type]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-muted text-sm">
                        {o.original_price ? `${o.original_price.toLocaleString("ar-EG")} ${o.currency}` : "—"}
                      </td>
                      <td className="px-4 py-3 font-bold text-brand-green">
                        {o.discounted_price.toLocaleString("ar-EG")} {o.currency}
                      </td>
                      <td className="px-4 py-3">
                        {o.discount_percent ? (
                          <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                            -{o.discount_percent}%
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary">
                        {o.start_date || o.end_date ? (
                          <span>{fmtDate(o.start_date)} — {fmtDate(o.end_date)}</span>
                        ) : "دائم"}
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-sm">
                        {o.available_slots ?? "غير محدود"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleActive(o)}
                          className={cn(
                            "text-xs font-semibold px-2.5 py-1 rounded-full transition",
                            o.is_active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          )}
                        >
                          {o.is_active ? "نشط" : "مخفي"}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => { setEditing(o); setFormOpen(true); }} className="p-1.5 rounded-lg hover:bg-yellow-50 text-yellow-600 transition" title="تعديل">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button onClick={() => setDeleteTarget(o)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition" title="حذف">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {formOpen && (
        <OfferForm initial={editing ?? undefined} onSave={saveOffer} onClose={() => { setFormOpen(false); setEditing(null); }} />
      )}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" dir="rtl">
          <div className="bg-white rounded-2xl p-6 w-80 space-y-4 shadow-xl">
            <p className="text-sm text-text-primary">هل تريد حذف عرض <strong>{deleteTarget.title}</strong>؟</p>
            <div className="flex gap-3">
              <button onClick={() => deleteOffer(deleteTarget.id)} className="flex-1 h-10 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition">حذف</button>
              <button onClick={() => setDeleteTarget(null)} className="flex-1 h-10 border border-border-light text-sm rounded-xl hover:bg-bg-alt transition">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
