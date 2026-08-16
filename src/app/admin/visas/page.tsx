"use client";

/**
 * /admin/visas
 * Visa Types Management — full CRUD with inline price editor,
 * filter bar, and document requirements collapsible section.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type VisaCategory = "vip" | "standard" | "urgent" | "multi_entry" | "extension";
type ProfessionTier = "high" | "medium" | "weak" | "none";

interface VisaType {
  id: string;
  country_code: string;
  country_name: string;
  visa_name: string;
  duration_days: number;
  category: VisaCategory;
  profession_tier: ProfessionTier | null;
  price: number;
  deposit_amount: number;
  child_price: number | null;
  processing_days: number;
  is_urgent_available: boolean;
  urgent_price: number | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

interface DocReq {
  id: string;
  country_code: string;
  visa_type_id: string | null;
  document_key: string;
  document_label: string;
  is_required: boolean;
  sort_order: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<VisaCategory, string> = {
  vip:         "VIP",
  standard:    "عادي",
  urgent:      "عاجل",
  multi_entry: "متعدد الدخول",
  extension:   "تمديد",
};

const CATEGORY_COLORS: Record<VisaCategory, string> = {
  vip:         "bg-purple-100 text-purple-700",
  standard:    "bg-blue-100 text-blue-700",
  urgent:      "bg-orange-100 text-orange-700",
  multi_entry: "bg-teal-100 text-teal-700",
  extension:   "bg-gray-100 text-gray-700",
};

const TIER_LABELS: Record<string, string> = {
  high:   "عليا",
  medium: "متوسطة",
  weak:   "ضعيفة",
  none:   "بدون",
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

// ─── Inline price editor ──────────────────────────────────────────────────────
function InlinePriceCell({ value, onSave }: { value: number; onSave: (v: number) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(String(value));
  const [saving, setSaving]   = useState(false);
  const inputRef              = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

  async function save() {
    const n = Number(val);
    if (isNaN(n) || n <= 0) { setEditing(false); setVal(String(value)); return; }
    setSaving(true);
    await onSave(n);
    setSaving(false);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") { setEditing(false); setVal(String(value)); } }}
          className="w-24 h-7 px-2 border border-brand-green rounded text-xs focus:outline-none"
          disabled={saving}
        />
        <button onClick={save} disabled={saving} className="text-brand-green hover:text-brand-green-dark">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
        </button>
      </div>
    );
  }
  return (
    <button onClick={() => setEditing(true)} className="text-sm font-semibold text-text-primary hover:text-brand-green transition group flex items-center gap-1" title="اضغط لتعديل السعر">
      {value.toLocaleString("ar-EG")} ج.م
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-0 group-hover:opacity-100 transition"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
    </button>
  );
}

// ─── Visa form modal ──────────────────────────────────────────────────────────
interface VisaFormProps {
  initial?: Partial<VisaType>;
  onSave: (data: Partial<VisaType>) => Promise<void>;
  onClose: () => void;
}

function VisaForm({ initial, onSave, onClose }: VisaFormProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm]     = useState<Partial<VisaType>>({
    country_code: "", country_name: "", visa_name: "", duration_days: 30,
    category: "standard", profession_tier: "none", price: 0, deposit_amount: 0,
    child_price: undefined, processing_days: 3, is_urgent_available: false,
    urgent_price: undefined, is_active: true, notes: "",
    ...initial,
  });

  const iCls = "w-full h-10 px-3 border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green bg-white";

  function set(k: keyof VisaType, v: unknown) {
    setForm(p => ({ ...p, [k]: v }));
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
        <div className="sticky top-0 bg-white border-b border-border-light px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="font-bold text-text-primary">{initial?.id ? "تعديل تأشيرة" : "إضافة تأشيرة جديدة"}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={submit} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Country */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">كود الدولة *</label>
            <input value={form.country_code ?? ""} onChange={e => set("country_code", e.target.value.toUpperCase())} placeholder="AE" maxLength={3} className={iCls} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">اسم الدولة *</label>
            <input value={form.country_name ?? ""} onChange={e => set("country_name", e.target.value)} placeholder="الإمارات العربية المتحدة" className={iCls} required />
          </div>
          {/* Visa name */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-text-secondary mb-1">اسم التأشيرة *</label>
            <input value={form.visa_name ?? ""} onChange={e => set("visa_name", e.target.value)} placeholder="تأشيرة شهر VIP" className={iCls} required />
          </div>
          {/* Category + tier */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">الفئة *</label>
            <select value={form.category} onChange={e => set("category", e.target.value)} className={iCls}>
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">تصنيف المهنة</label>
            <select value={form.profession_tier ?? "none"} onChange={e => set("profession_tier", e.target.value)} className={iCls}>
              {Object.entries(TIER_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          {/* Price + deposit */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">السعر (ج.م) *</label>
            <input type="number" min={0} value={form.price ?? ""} onChange={e => set("price", Number(e.target.value))} className={iCls} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">التأمين المسترد (ج.م)</label>
            <input type="number" min={0} value={form.deposit_amount ?? 0} onChange={e => set("deposit_amount", Number(e.target.value))} className={iCls} />
          </div>
          {/* Child price + processing */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">سعر الطفل (ج.م)</label>
            <input type="number" min={0} value={form.child_price ?? ""} onChange={e => set("child_price", e.target.value ? Number(e.target.value) : undefined)} placeholder="اختياري" className={iCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">المدة (أيام) *</label>
            <input type="number" min={1} value={form.duration_days ?? 30} onChange={e => set("duration_days", Number(e.target.value))} className={iCls} required />
          </div>
          {/* Processing days */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">وقت المعالجة (أيام)</label>
            <input type="number" min={1} value={form.processing_days ?? 3} onChange={e => set("processing_days", Number(e.target.value))} className={iCls} />
          </div>
          {/* Urgent */}
          <div className="flex items-center gap-3 pt-5">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={form.is_urgent_available ?? false} onChange={e => set("is_urgent_available", e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-green" />
            </label>
            <span className="text-sm text-text-secondary">متاح استعجال</span>
          </div>
          {form.is_urgent_available && (
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">سعر الاستعجال (ج.م)</label>
              <input type="number" min={0} value={form.urgent_price ?? ""} onChange={e => set("urgent_price", Number(e.target.value))} className={iCls} />
            </div>
          )}
          {/* Notes */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-text-secondary mb-1">ملاحظات</label>
            <textarea value={form.notes ?? ""} onChange={e => set("notes", e.target.value)} rows={2} className={cn(iCls, "h-auto py-2")} />
          </div>
          {/* Active */}
          <div className="sm:col-span-2 flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={form.is_active ?? true} onChange={e => set("is_active", e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-green" />
            </label>
            <span className="text-sm text-text-secondary">نشطة ومرئية</span>
          </div>
          {/* Submit */}
          <div className="sm:col-span-2 flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 h-11 bg-brand-green text-white font-bold rounded-xl text-sm hover:bg-brand-green-dark transition disabled:opacity-50">
              {saving ? "جاري الحفظ..." : initial?.id ? "حفظ التغييرات" : "إضافة التأشيرة"}
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

// ─── Document requirements section ───────────────────────────────────────────
function DocRequirementsSection({ countryCode, visaTypeId }: { countryCode: string; visaTypeId: string }) {
  const [docs, setDocs]       = useState<DocReq[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);
  const [adding, setAdding]   = useState(false);
  const [newDoc, setNewDoc]   = useState({ document_key: "", document_label: "", is_required: true });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch(`/api/admin/visa-documents?country=${countryCode}&visa_type_id=${visaTypeId}`);
    if (res.success) setDocs(res.data ?? []);
    setLoading(false);
  }, [countryCode, visaTypeId]);

  useEffect(() => { if (open) load(); }, [open, load]);

  async function addDoc() {
    if (!newDoc.document_key || !newDoc.document_label) return;
    const res = await apiFetch("/api/admin/visa-documents", {
      method: "POST",
      body: JSON.stringify({ ...newDoc, country_code: countryCode, visa_type_id: visaTypeId, sort_order: docs.length }),
    });
    if (res.success) { setDocs(p => [...p, res.data]); setNewDoc({ document_key: "", document_label: "", is_required: true }); setAdding(false); }
  }

  async function removeDoc(id: string) {
    await apiFetch(`/api/admin/visa-documents/${id}`, { method: "DELETE" });
    setDocs(p => p.filter(d => d.id !== id));
  }

  const iCls = "h-9 px-3 border border-border-light rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-green/30 bg-white";

  return (
    <div className="border-t border-border-light">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-text-secondary hover:bg-bg-alt transition">
        <span>المستندات المطلوبة ({docs.length})</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cn("transition-transform", open ? "rotate-180" : "")}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-2">
          {loading ? (
            <p className="text-xs text-text-muted py-2">جاري التحميل…</p>
          ) : (
            docs.map((d, i) => (
              <div key={d.id} className="flex items-center gap-2 text-xs bg-bg-alt rounded-lg px-3 py-2">
                <span className="text-text-muted w-5 text-center">{i + 1}</span>
                <span className="font-mono text-brand-green w-32 truncate">{d.document_key}</span>
                <span className="flex-1 text-text-primary truncate">{d.document_label}</span>
                <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", d.is_required ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500")}>
                  {d.is_required ? "مطلوب" : "اختياري"}
                </span>
                <button onClick={() => removeDoc(d.id)} className="text-red-400 hover:text-red-600">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            ))
          )}
          {adding ? (
            <div className="flex items-center gap-2 flex-wrap">
              <input value={newDoc.document_key} onChange={e => setNewDoc(p => ({ ...p, document_key: e.target.value }))} placeholder="document_key" className={cn(iCls, "w-36")} />
              <input value={newDoc.document_label} onChange={e => setNewDoc(p => ({ ...p, document_label: e.target.value }))} placeholder="اسم المستند" className={cn(iCls, "flex-1")} />
              <select value={newDoc.is_required ? "required" : "optional"} onChange={e => setNewDoc(p => ({ ...p, is_required: e.target.value === "required" }))} className={cn(iCls, "w-24")}>
                <option value="required">مطلوب</option>
                <option value="optional">اختياري</option>
              </select>
              <button onClick={addDoc} className="h-9 px-3 bg-brand-green text-white text-xs font-semibold rounded-lg hover:bg-brand-green-dark transition">إضافة</button>
              <button onClick={() => setAdding(false)} className="h-9 px-3 border border-border-light text-xs rounded-lg hover:bg-bg-alt transition">إلغاء</button>
            </div>
          ) : (
            <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 text-xs text-brand-green font-semibold hover:underline mt-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              إضافة مستند
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" dir="rtl">
      <div className="bg-white rounded-2xl p-6 w-80 space-y-4 shadow-xl">
        <p className="text-sm text-text-primary">{message}</p>
        <div className="flex gap-3">
          <button onClick={onConfirm} className="flex-1 h-10 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition">تأكيد الحذف</button>
          <button onClick={onCancel} className="flex-1 h-10 border border-border-light text-sm rounded-xl hover:bg-bg-alt transition">إلغاء</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminVisasPage() {
  const [items, setItems]             = useState<VisaType[]>([]);
  const [loading, setLoading]         = useState(true);
  const [formOpen, setFormOpen]       = useState(false);
  const [editing, setEditing]         = useState<VisaType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VisaType | null>(null);
  const [filterCountry, setFilterCountry] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterActive, setFilterActive]   = useState("all");
  const [expandedDocs, setExpandedDocs]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterCountry)          params.set("country", filterCountry.toUpperCase());
    if (filterActive !== "all") params.set("active", filterActive);
    const res = await apiFetch(`/api/admin/visa-types?${params}`);
    if (res.success) setItems(res.data ?? []);
    setLoading(false);
  }, [filterCountry, filterActive]);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(v =>
    filterCategory === "all" || v.category === filterCategory
  );

  // Group by country for display
  const countries = [...new Set(filtered.map(v => v.country_name))].sort();

  async function saveVisa(data: Partial<VisaType>) {
    if (editing?.id) {
      const res = await apiFetch(`/api/admin/visa-types/${editing.id}`, { method: "PATCH", body: JSON.stringify(data) });
      if (res.success) { setItems(p => p.map(v => v.id === editing.id ? res.data : v)); }
    } else {
      const res = await apiFetch("/api/admin/visa-types", { method: "POST", body: JSON.stringify(data) });
      if (res.success) { setItems(p => [res.data, ...p]); }
    }
    setFormOpen(false);
    setEditing(null);
  }

  async function deleteVisa(id: string) {
    await apiFetch(`/api/admin/visa-types/${id}`, { method: "DELETE" });
    setItems(p => p.filter(v => v.id !== id));
    setDeleteTarget(null);
  }

  async function toggleActive(v: VisaType) {
    const res = await apiFetch(`/api/admin/visa-types/${v.id}`, { method: "PATCH", body: JSON.stringify({ is_active: !v.is_active }) });
    if (res.success) setItems(p => p.map(i => i.id === v.id ? res.data : i));
  }

  async function updatePrice(v: VisaType, price: number) {
    const res = await apiFetch(`/api/admin/visa-types/${v.id}`, { method: "PATCH", body: JSON.stringify({ price }) });
    if (res.success) setItems(p => p.map(i => i.id === v.id ? res.data : i));
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">التأشيرات</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {items.length} نوع تأشيرة · {items.filter(v => v.is_active).length} نشط
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="flex items-center gap-2 bg-brand-green text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-green-dark transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          إضافة تأشيرة
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white rounded-xl border border-border-light p-3">
        <input
          value={filterCountry}
          onChange={e => setFilterCountry(e.target.value)}
          placeholder="كود الدولة (AE، TR…)"
          className="h-9 px-3 border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 w-44"
        />
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="h-9 px-3 border border-border-light rounded-lg text-sm focus:outline-none bg-white">
          <option value="all">كل الفئات</option>
          {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={filterActive} onChange={e => setFilterActive(e.target.value)} className="h-9 px-3 border border-border-light rounded-lg text-sm focus:outline-none bg-white">
          <option value="all">الكل</option>
          <option value="true">نشط فقط</option>
          <option value="false">مخفي فقط</option>
        </select>
        <button onClick={load} className="h-9 px-4 bg-bg-alt border border-border-light rounded-lg text-sm font-semibold text-text-secondary hover:bg-gray-100 transition">
          تحديث
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border-light flex flex-col items-center justify-center py-20 text-text-muted">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-40"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          <p className="font-semibold">لا توجد تأشيرات</p>
          <p className="text-sm mt-1">أضف أول تأشيرة أو غيّر الفلاتر</p>
        </div>
      ) : (
        <div className="space-y-6">
          {countries.map(countryName => {
            const countryItems = filtered.filter(v => v.country_name === countryName);
            const countryCode  = countryItems[0]?.country_code ?? "";
            return (
              <div key={countryName} className="bg-white rounded-2xl border border-border-light overflow-hidden">
                {/* Country header */}
                <div className="px-5 py-3 bg-bg-alt border-b border-border-light flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-brand-green bg-brand-green/10 px-2 py-0.5 rounded">{countryCode}</span>
                    <h3 className="font-bold text-text-primary text-sm">{countryName}</h3>
                    <span className="text-xs text-text-muted">({countryItems.length} نوع)</span>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border-light text-xs text-text-muted font-semibold">
                        <th className="text-right px-4 py-2.5">اسم التأشيرة</th>
                        <th className="text-right px-4 py-2.5">الفئة</th>
                        <th className="text-right px-4 py-2.5">المهنة</th>
                        <th className="text-right px-4 py-2.5">المدة</th>
                        <th className="text-right px-4 py-2.5">السعر</th>
                        <th className="text-right px-4 py-2.5">التأمين</th>
                        <th className="text-right px-4 py-2.5">استعجال</th>
                        <th className="text-right px-4 py-2.5">الحالة</th>
                        <th className="text-right px-4 py-2.5">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light">
                      {countryItems.map(v => (
                        <>
                          <tr key={v.id} className="hover:bg-bg-alt/40 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-semibold text-text-primary">{v.visa_name}</p>
                              <p className="text-[11px] text-text-muted">{v.processing_days} أيام معالجة</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", CATEGORY_COLORS[v.category])}>
                                {CATEGORY_LABELS[v.category]}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-text-secondary">
                              {v.profession_tier ? TIER_LABELS[v.profession_tier] : "—"}
                            </td>
                            <td className="px-4 py-3 text-text-secondary">{v.duration_days} يوم</td>
                            <td className="px-4 py-3">
                              <InlinePriceCell value={v.price} onSave={price => updatePrice(v, price)} />
                            </td>
                            <td className="px-4 py-3 text-text-secondary text-sm">
                              {v.deposit_amount > 0 ? `${v.deposit_amount.toLocaleString("ar-EG")} ج.م` : "—"}
                            </td>
                            <td className="px-4 py-3">
                              {v.is_urgent_available ? (
                                <span className="text-xs text-orange-600 font-semibold">
                                  {v.urgent_price ? `${v.urgent_price.toLocaleString("ar-EG")} ج.م` : "متاح"}
                                </span>
                              ) : (
                                <span className="text-xs text-text-muted">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => toggleActive(v)}
                                className={cn(
                                  "text-xs font-semibold px-2.5 py-1 rounded-full transition",
                                  v.is_active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                )}
                              >
                                {v.is_active ? "نشط" : "مخفي"}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => setExpandedDocs(expandedDocs === v.id ? null : v.id)}
                                  className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition"
                                  title="المستندات"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                </button>
                                <button
                                  onClick={() => { setEditing(v); setFormOpen(true); }}
                                  className="p-1.5 rounded-lg hover:bg-yellow-50 text-yellow-600 transition"
                                  title="تعديل"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                </button>
                                <button
                                  onClick={() => setDeleteTarget(v)}
                                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition"
                                  title="حذف"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                          {/* Document requirements inline */}
                          {expandedDocs === v.id && (
                            <tr key={`${v.id}-docs`}>
                              <td colSpan={9} className="px-0 py-0">
                                <DocRequirementsSection countryCode={v.country_code} visaTypeId={v.id} />
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {formOpen && (
        <VisaForm initial={editing ?? undefined} onSave={saveVisa} onClose={() => { setFormOpen(false); setEditing(null); }} />
      )}
      {deleteTarget && (
        <ConfirmDialog
          message={`هل تريد حذف "${deleteTarget.visa_name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
          onConfirm={() => deleteVisa(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
