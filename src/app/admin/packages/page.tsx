"use client";

/**
 * /admin/packages
 * Wired to /api/admin/packages — replaces INITIAL_PACKAGES mock.
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface Package {
  id: string;
  title: string;
  description: string;
  destination: string;
  price: number;
  currency: string;
  duration: number;
  images: string[];
  features: string[];
  is_active: boolean;
  created_at: string;
}

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

interface PackageFormState {
  title: string; description: string; destination: string;
  price: string; currency: string; duration: string;
  features: string; is_active: boolean;
}
const EMPTY_FORM: PackageFormState = {
  title: "", description: "", destination: "",
  price: "", currency: "EGP", duration: "", features: "", is_active: true,
};

function validate(f: PackageFormState): Partial<Record<keyof PackageFormState, string>> {
  const e: Partial<Record<keyof PackageFormState, string>> = {};
  if (!f.title || f.title.length < 5)                        e.title       = "العنوان مطلوب (5 أحرف على الأقل)";
  if (!f.description || f.description.length < 10)           e.description = "الوصف مطلوب";
  if (!f.destination || f.destination.length < 2)            e.destination = "الوجهة مطلوبة";
  if (!f.price || isNaN(Number(f.price)) || Number(f.price) <= 0) e.price  = "السعر يجب أن يكون أكبر من صفر";
  if (!f.duration || isNaN(Number(f.duration)) || Number(f.duration) <= 0) e.duration = "المدة بالأيام مطلوبة";
  return e;
}

export default function AdminPackagesPage() {
  const [packages, setPackages]   = useState<Package[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [showForm, setShowForm]   = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm]           = useState<PackageFormState>(EMPTY_FORM);
  const [errors, setErrors]       = useState<Partial<Record<keyof PackageFormState, string>>>({});
  const [search, setSearch]       = useState("");
  const [filterActive, setFilterActive] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<Package | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterActive !== "all") params.set("active", filterActive);
    const res = await apiFetch(`/api/admin/packages?${params}`);
    if (res.success) setPackages(res.data ?? []);
    setLoading(false);
  }, [filterActive]);

  useEffect(() => { load(); }, [load]);

  const filtered = packages.filter(p =>
    !search ||
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.destination.toLowerCase().includes(search.toLowerCase())
  );

  function setF(k: keyof PackageFormState, v: unknown) {
    setForm(p => ({ ...p, [k]: v }));
  }

  function startAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setShowForm(true);
  }

  function startEdit(pkg: Package) {
    setEditingId(pkg.id);
    setForm({
      title:       pkg.title,
      description: pkg.description,
      destination: pkg.destination,
      price:       String(pkg.price),
      currency:    pkg.currency,
      duration:    String(pkg.duration),
      features:    (pkg.features ?? []).join(", "),
      is_active:   pkg.is_active,
    });
    setErrors({});
    setShowForm(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSaving(true);

    const payload = {
      title:       form.title,
      description: form.description,
      destination: form.destination,
      price:       Number(form.price),
      currency:    form.currency,
      duration:    Number(form.duration),
      features:    form.features ? form.features.split(",").map(f => f.trim()).filter(Boolean) : [],
      is_active:   form.is_active,
    };

    if (editingId) {
      const res = await apiFetch(`/api/admin/packages/${editingId}`, { method: "PATCH", body: JSON.stringify(payload) });
      if (res.success) setPackages(p => p.map(pkg => pkg.id === editingId ? res.data : pkg));
    } else {
      const res = await apiFetch("/api/admin/packages", { method: "POST", body: JSON.stringify(payload) });
      if (res.success) setPackages(p => [res.data, ...p]);
    }

    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function toggleActive(pkg: Package) {
    const res = await apiFetch(`/api/admin/packages/${pkg.id}/toggle`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: !pkg.is_active }),
    });
    if (res.success) setPackages(p => p.map(i => i.id === pkg.id ? { ...i, ...res.data } : i));
  }

  async function deletePackage(id: string) {
    await apiFetch(`/api/admin/packages/${id}`, { method: "DELETE" });
    setPackages(p => p.filter(pkg => pkg.id !== id));
    setDeleteTarget(null);
  }

  const iCls = "w-full h-10 px-3 border border-border-light rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green bg-white";

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">الباقات والعروض</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {packages.length} باقة · {packages.filter(p => p.is_active).length} نشطة
          </p>
        </div>
        <button onClick={startAdd} className="flex items-center gap-2 bg-brand-green text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-green-dark transition">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          باقة جديدة
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-border-light p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-text-primary">{editingId ? "تعديل الباقة" : "إضافة باقة جديدة"}</h2>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-text-muted hover:text-text-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-text-secondary mb-1">عنوان الباقة *</label>
              <input value={form.title} onChange={e => setF("title", e.target.value)} placeholder="مثال: باقة دبي السياحية" className={cn(iCls, errors.title && "border-red-400")} />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-text-secondary mb-1">الوصف *</label>
              <textarea value={form.description} onChange={e => setF("description", e.target.value)} rows={3} placeholder="وصف تفصيلي للباقة..." className={cn(iCls, "h-auto py-2", errors.description && "border-red-400")} />
              {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">الوجهة *</label>
              <input value={form.destination} onChange={e => setF("destination", e.target.value)} placeholder="الإمارات" className={cn(iCls, errors.destination && "border-red-400")} />
              {errors.destination && <p className="text-xs text-red-500 mt-1">{errors.destination}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">المدة (أيام) *</label>
              <input type="number" min={1} value={form.duration} onChange={e => setF("duration", e.target.value)} placeholder="5" className={cn(iCls, errors.duration && "border-red-400")} />
              {errors.duration && <p className="text-xs text-red-500 mt-1">{errors.duration}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">السعر *</label>
              <input type="number" min={1} value={form.price} onChange={e => setF("price", e.target.value)} placeholder="15000" className={cn(iCls, errors.price && "border-red-400")} />
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">العملة</label>
              <select value={form.currency} onChange={e => setF("currency", e.target.value)} className={iCls}>
                <option value="EGP">جنيه مصري (EGP)</option>
                <option value="USD">دولار (USD)</option>
                <option value="EUR">يورو (EUR)</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-text-secondary mb-1">المميزات (مفصولة بفاصلة)</label>
              <input value={form.features} onChange={e => setF("features", e.target.value)} placeholder="فيزا, فندق 5 نجوم, طيران, جولات سياحية" className={iCls} />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setF("is_active", e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-green" />
              </label>
              <span className="text-sm text-text-secondary">ظاهر على الموقع</span>
            </div>
            <div className="sm:col-span-2 flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="flex-1 h-11 bg-brand-green text-white font-bold rounded-xl text-sm hover:bg-brand-green-dark transition disabled:opacity-50">
                {saving ? "جاري الحفظ..." : editingId ? "تحديث الباقة" : "إضافة الباقة"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-6 h-11 border border-border-light rounded-xl text-sm text-text-secondary hover:bg-bg-alt transition">
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute top-3 right-3 text-text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث باسم الباقة أو الوجهة..." className="w-full h-10 pe-4 ps-9 border border-border-light rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 bg-white" />
        </div>
        <div className="flex gap-2">
          {[
            { value: "all", label: "الكل" },
            { value: "true", label: "نشطة" },
            { value: "false", label: "مخفية" },
          ].map(f => (
            <button key={f.value} onClick={() => setFilterActive(f.value)}
              className={cn("text-xs font-semibold px-3 py-2 rounded-xl transition whitespace-nowrap",
                filterActive === f.value ? "bg-brand-green text-white" : "bg-white border border-border-light text-text-secondary hover:bg-bg-alt"
              )}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light bg-bg-alt">
                  {["الباقة", "الوجهة", "السعر", "المدة", "الحالة", "إجراءات"].map(h => (
                    <th key={h} className="text-right px-5 py-3 text-xs font-semibold text-text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-text-muted">لا توجد باقات</td></tr>
                ) : (
                  filtered.map(pkg => (
                    <tr key={pkg.id} className="hover:bg-bg-alt/50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-text-primary">{pkg.title}</p>
                        <p className="text-xs text-text-muted mt-0.5">{(pkg.features ?? []).join(" · ")}</p>
                      </td>
                      <td className="px-5 py-4 text-text-secondary">{pkg.destination}</td>
                      <td className="px-5 py-4 font-semibold text-text-primary">
                        {pkg.price.toLocaleString("ar-EG")} {pkg.currency}
                      </td>
                      <td className="px-5 py-4 text-text-secondary">{pkg.duration} أيام</td>
                      <td className="px-5 py-4">
                        <button onClick={() => toggleActive(pkg)}
                          className={cn("text-xs font-semibold px-2.5 py-1 rounded-full transition",
                            pkg.is_active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          )}>
                          {pkg.is_active ? "نشط" : "مخفي"}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => startEdit(pkg)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition" title="تعديل">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button onClick={() => setDeleteTarget(pkg)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition" title="حذف">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                          </button>
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

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" dir="rtl">
          <div className="bg-white rounded-2xl p-6 w-80 space-y-4 shadow-xl">
            <p className="text-sm text-text-primary">هل تريد حذف باقة <strong>{deleteTarget.title}</strong>؟</p>
            <div className="flex gap-3">
              <button onClick={() => deletePackage(deleteTarget.id)} className="flex-1 h-10 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition">حذف</button>
              <button onClick={() => setDeleteTarget(null)} className="flex-1 h-10 border border-border-light text-sm rounded-xl hover:bg-bg-alt transition">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
