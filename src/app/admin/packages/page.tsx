"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";

interface PackageForm {
  title: string;
  description: string;
  destination: string;
  price: string;
  currency: string;
  duration: string;
  is_active: boolean;
  features: string;
}

interface Package {
  id: string;
  title: string;
  destination: string;
  price: number;
  currency: string;
  duration: number;
  is_active: boolean;
  features: string[];
}

const INITIAL_PACKAGES: Package[] = [
  { id: "1", title: "باقة دبي السياحية", destination: "الإمارات", price: 15000, currency: "EGP", duration: 5, is_active: true, features: ["فيزا", "فندق 5 نجوم", "رحلة طيران"] },
  { id: "2", title: "جولة إسطنبول", destination: "تركيا", price: 12000, currency: "EGP", duration: 7, is_active: true, features: ["فيزا", "فندق 4 نجوم", "جولات سياحية"] },
  { id: "3", title: "أسبوع في بودابست", destination: "المجر", price: 22000, currency: "EGP", duration: 7, is_active: false, features: ["فيزا شنغن", "فندق", "تأمين سفر"] },
  { id: "4", title: "عروض الغردقة", destination: "الغردقة", price: 4500, currency: "EGP", duration: 3, is_active: true, features: ["فندق 5 نجوم", "إفطار شامل"] },
];

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<Package[]>(INITIAL_PACKAGES);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof PackageForm, string>>>({});

  const { register, handleSubmit, reset, formState: { errors: _e } } = useForm<PackageForm>({
    defaultValues: { currency: "EGP", is_active: true, price: "", duration: "", features: "" },
  });

  const filtered = packages.filter(p => p.title.includes(search) || p.destination.includes(search));

  function validate(data: PackageForm) {
    const errs: Partial<Record<keyof PackageForm, string>> = {};
    if (!data.title || data.title.length < 5) errs.title = "العنوان مطلوب (5 أحرف على الأقل)";
    if (!data.description || data.description.length < 10) errs.description = "الوصف مطلوب";
    if (!data.destination || data.destination.length < 2) errs.destination = "الوجهة مطلوبة";
    if (!data.price || isNaN(Number(data.price)) || Number(data.price) <= 0) errs.price = "السعر يجب أن يكون أكبر من صفر";
    if (!data.duration || isNaN(Number(data.duration)) || Number(data.duration) <= 0) errs.duration = "المدة بالأيام مطلوبة";
    return errs;
  }

  async function onSubmit(data: PackageForm) {
    const errs = validate(data);
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({});
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    const featuresArr = data.features ? data.features.split(",").map(f => f.trim()).filter(Boolean) : [];
    if (editingId) {
      setPackages(prev => prev.map(p =>
        p.id === editingId
          ? { ...p, title: data.title, description: data.description ?? "", destination: data.destination, price: Number(data.price), currency: data.currency, duration: Number(data.duration), is_active: data.is_active, features: featuresArr }
          : p
      ));
    } else {
      setPackages(prev => [{
        id: Date.now().toString(), title: data.title, destination: data.destination,
        price: Number(data.price), currency: data.currency, duration: Number(data.duration),
        is_active: data.is_active, features: featuresArr,
      }, ...prev]);
    }
    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    reset({ currency: "EGP", is_active: true, price: "", duration: "", features: "" });
  }

  function startEdit(pkg: Package) {
    setEditingId(pkg.id);
    reset({ ...pkg, price: String(pkg.price), duration: String(pkg.duration), features: pkg.features.join(", ") });
    setShowForm(true);
  }

  function toggleActive(id: string) {
    setPackages(prev => prev.map(p => p.id === id ? { ...p, is_active: !p.is_active } : p));
  }

  function deletePackage(id: string) {
    setPackages(prev => prev.filter(p => p.id !== id));
  }

  const inputCls = "w-full h-10 px-3 border border-border-light rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green bg-white";

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">الباقات والعروض</h1>
          <p className="text-sm text-text-muted mt-0.5">{packages.length} باقة · {packages.filter(p => p.is_active).length} نشطة</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); reset({ currency: "EGP", is_active: true, price: "", duration: "", features: "" }); }}
          className="flex items-center gap-2 bg-brand-green text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-green-dark transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          باقة جديدة
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-border-light p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-text-primary">{editingId ? "تعديل الباقة" : "إضافة باقة جديدة"}</h2>
            <button onClick={() => { setShowForm(false); setEditingId(null); reset(); }} className="text-text-muted hover:text-text-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-text-secondary mb-1">عنوان الباقة *</label>
              <input {...register("title")} placeholder="مثال: باقة دبي السياحية" className={cn(inputCls, formErrors.title && "border-red-400")} />
              {formErrors.title && <p className="text-xs text-red-500 mt-1">{formErrors.title}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-text-secondary mb-1">الوصف *</label>
              <textarea {...register("description")} rows={3} placeholder="وصف تفصيلي للباقة..." className={cn(inputCls, "h-auto py-2", formErrors.description && "border-red-400")} />
              {formErrors.description && <p className="text-xs text-red-500 mt-1">{formErrors.description}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">الوجهة *</label>
              <input {...register("destination")} placeholder="الإمارات" className={cn(inputCls, formErrors.destination && "border-red-400")} />
              {formErrors.destination && <p className="text-xs text-red-500 mt-1">{formErrors.destination}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">المدة (أيام) *</label>
              <input {...register("duration")} type="number" min={1} placeholder="5" className={cn(inputCls, formErrors.duration && "border-red-400")} />
              {formErrors.duration && <p className="text-xs text-red-500 mt-1">{formErrors.duration}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">السعر *</label>
              <input {...register("price")} type="number" min={1} placeholder="15000" className={cn(inputCls, formErrors.price && "border-red-400")} />
              {formErrors.price && <p className="text-xs text-red-500 mt-1">{formErrors.price}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">العملة</label>
              <select {...register("currency")} className={inputCls}>
                <option value="EGP">جنيه مصري (EGP)</option>
                <option value="USD">دولار أمريكي (USD)</option>
                <option value="EUR">يورو (EUR)</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-text-secondary mb-1">المميزات (مفصولة بفاصلة)</label>
              <input {...register("features")} placeholder="فيزا, فندق 5 نجوم, طيران, جولات سياحية" className={inputCls} />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input {...register("is_active")} type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-green" />
              </label>
              <span className="text-sm text-text-secondary">ظاهر على الموقع</span>
            </div>
            <div className="sm:col-span-2 flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="flex-1 h-11 bg-brand-green text-white font-bold rounded-xl text-sm hover:bg-brand-green-dark transition disabled:opacity-50">
                {saving ? "جاري الحفظ..." : editingId ? "تحديث الباقة" : "إضافة الباقة"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); reset(); }} className="px-6 h-11 border border-border-light rounded-xl text-sm text-text-secondary hover:bg-bg-alt transition">
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="relative">
        <svg className="absolute top-3 right-3 text-text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث باسم الباقة أو الوجهة..." className="w-full h-10 pe-4 ps-10 border border-border-light rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 bg-white" />
      </div>

      <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light bg-bg-alt">
                <th className="text-right px-5 py-3 text-xs font-semibold text-text-muted">الباقة</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-text-muted">الوجهة</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-text-muted">السعر</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-text-muted">المدة</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-text-muted">الحالة</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-text-muted">إجراءات</th>
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
                      <p className="text-xs text-text-muted mt-0.5">{pkg.features.join(" · ")}</p>
                    </td>
                    <td className="px-5 py-4 text-text-secondary">{pkg.destination}</td>
                    <td className="px-5 py-4 font-semibold text-text-primary">{pkg.price.toLocaleString("ar-EG")} {pkg.currency}</td>
                    <td className="px-5 py-4 text-text-secondary">{pkg.duration} أيام</td>
                    <td className="px-5 py-4">
                      <button onClick={() => toggleActive(pkg.id)} className={cn("text-xs font-semibold px-2.5 py-1 rounded-full transition", pkg.is_active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
                        {pkg.is_active ? "نشط" : "مخفي"}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => startEdit(pkg)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition" title="تعديل">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => deletePackage(pkg.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition" title="حذف">
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
    </div>
  );
}
