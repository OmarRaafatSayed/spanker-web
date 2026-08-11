"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { cn } from "@/lib/utils";

const bannerSchema = z.object({
  title: z.string().min(3, "العنوان مطلوب"),
  subtitle: z.string().optional(),
  image_url: z.string().min(1, "رابط الصورة مطلوب"),
  link_url: z.string().optional(),
  position: z.enum(["hero", "secondary", "footer"]),
  display_order: z.number().int().min(1).default(1),
  is_active: z.boolean().default(true),
});

type BannerForm = z.infer<typeof bannerSchema>;

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  link_url?: string;
  position: "hero" | "secondary" | "footer";
  display_order: number;
  is_active: boolean;
}

const INITIAL_BANNERS: Banner[] = [
  { id: "1", title: "اكتشف عروض الصيف", subtitle: "رحلات بأسعار لا تُصدق", image_url: "/images/hero/hero-1.jpg", link_url: "/packages", position: "hero", display_order: 1, is_active: true },
  { id: "2", title: "تأشيرة الإمارات", subtitle: "تصدر في 5 أيام", image_url: "/images/Offers/download.jpg", link_url: "/visa/uae", position: "secondary", display_order: 1, is_active: true },
  { id: "3", title: "باقة بودابست", subtitle: "22 ألف جنيه كل شيء", image_url: "/images/Offers/Budapest.jpg", link_url: "/packages/budapest", position: "secondary", display_order: 2, is_active: false },
];

const POSITION_LABELS = { hero: "الهيرو الرئيسي", secondary: "ثانوي", footer: "تذييل الصفحة" };

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>(INITIAL_BANNERS);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterPos, setFilterPos] = useState<string>("all");
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof BannerForm, string>>>({});

  const { register, handleSubmit, reset, watch, setValue } = useForm<BannerForm>({
    defaultValues: { position: "secondary", display_order: 1, is_active: true },
  });

  const filtered = banners.filter(b => filterPos === "all" || b.position === filterPos);

  async function onSubmit(raw: BannerForm) {
    const result = bannerSchema.safeParse(raw);
    if (!result.success) {
      const errs: Partial<Record<keyof BannerForm, string>> = {};
      result.error.issues.forEach((e) => {
        const key = String(e.path[0]) as keyof BannerForm;
        if (key) errs[key] = e.message;
      });
      setFormErrors(errs);
      return;
    }
    setFormErrors({});
    const data = result.data;
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    if (editingId) {
      setBanners(prev => prev.map(b => b.id === editingId ? { ...b, ...data } : b));
    } else {
      setBanners(prev => [{ id: Date.now().toString(), ...data }, ...prev]);
    }
    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    reset({ position: "secondary", display_order: 1, is_active: true });
  }

  function startEdit(b: Banner) {
    setEditingId(b.id);
    reset(b);
    setShowForm(true);
  }

  function toggleActive(id: string) {
    setBanners(prev => prev.map(b => b.id === id ? { ...b, is_active: !b.is_active } : b));
  }

  function deleteBanner(id: string) {
    setBanners(prev => prev.filter(b => b.id !== id));
  }

  const inputCls = "w-full h-10 px-3 border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green bg-white";

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">البانرات</h1>
          <p className="text-sm text-text-muted mt-0.5">{banners.length} بانر · {banners.filter(b => b.is_active).length} نشط</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); reset({ position: "secondary", display_order: 1, is_active: true }); }}
          className="flex items-center gap-2 bg-brand-green text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-green-dark transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          بانر جديد
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-border-light p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-text-primary">{editingId ? "تعديل البانر" : "إضافة بانر جديد"}</h2>
            <button onClick={() => { setShowForm(false); reset(); }} className="text-text-muted hover:text-text-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">العنوان *</label>
              <input {...register("title")} placeholder="عنوان البانر" className={cn(inputCls, formErrors.title && "border-red-400")} />
              {formErrors.title && <p className="text-xs text-red-500 mt-1">{formErrors.title}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">العنوان الفرعي</label>
              <input {...register("subtitle")} placeholder="نص توضيحي اختياري" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">رابط الصورة *</label>
              <input {...register("image_url")} placeholder="/images/hero/banner.jpg" dir="ltr" className={cn(inputCls, formErrors.image_url && "border-red-400")} />
              {formErrors.image_url && <p className="text-xs text-red-500 mt-1">{formErrors.image_url}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">رابط الإجراء</label>
              <input {...register("link_url")} placeholder="/packages/dubai" dir="ltr" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">الموضع</label>
              <select {...register("position")} className={inputCls}>
                <option value="hero">الهيرو الرئيسي</option>
                <option value="secondary">ثانوي (داخل الصفحة)</option>
                <option value="footer">تذييل الصفحة</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">ترتيب العرض</label>
              <input
                type="number" min={1} placeholder="1"
                {...register("display_order", { valueAsNumber: true })}
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input {...register("is_active")} type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-green" />
              </label>
              <span className="text-sm text-text-secondary">ظاهر على الموقع</span>
            </div>
            <div className="sm:col-span-2 flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="flex-1 h-11 bg-brand-green text-white font-bold rounded-xl text-sm hover:bg-brand-green-dark transition disabled:opacity-50">
                {saving ? "جاري الحفظ..." : editingId ? "تحديث البانر" : "إضافة البانر"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); reset(); }} className="px-6 h-11 border border-border-light rounded-xl text-sm text-text-secondary hover:bg-bg-alt transition">
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex gap-2">
        {["all", "hero", "secondary", "footer"].map(pos => (
          <button
            key={pos}
            onClick={() => setFilterPos(pos)}
            className={cn(
              "text-xs font-semibold px-3 py-1.5 rounded-full transition",
              filterPos === pos ? "bg-brand-green text-white" : "bg-white border border-border-light text-text-secondary hover:bg-bg-alt"
            )}
          >
            {pos === "all" ? "الكل" : POSITION_LABELS[pos as keyof typeof POSITION_LABELS]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(banner => (
          <div key={banner.id} className={cn("bg-white rounded-2xl border overflow-hidden transition", banner.is_active ? "border-border-light" : "border-border-light opacity-60")}>
            <div className="h-36 bg-bg-alt relative overflow-hidden">
              <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${banner.image_url})` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-3 right-3 left-3">
                <p className="text-white font-bold text-sm leading-tight truncate">{banner.title}</p>
                {banner.subtitle && <p className="text-white/80 text-xs truncate">{banner.subtitle}</p>}
              </div>
              <span className={cn("absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full", banner.is_active ? "bg-green-500 text-white" : "bg-gray-400 text-white")}>
                {banner.is_active ? "نشط" : "مخفي"}
              </span>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs bg-bg-alt text-text-muted px-2 py-0.5 rounded-full">
                  {POSITION_LABELS[banner.position]} · ترتيب {banner.display_order}
                </span>
              </div>
              {banner.link_url && <p className="text-xs text-text-muted truncate mb-3" dir="ltr">{banner.link_url}</p>}
              <div className="flex gap-2">
                <button onClick={() => startEdit(banner)} className="flex-1 text-xs font-semibold py-2 rounded-lg border border-border-light hover:bg-bg-alt transition">تعديل</button>
                <button onClick={() => toggleActive(banner.id)} className={cn("flex-1 text-xs font-semibold py-2 rounded-lg transition", banner.is_active ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100" : "bg-green-50 text-green-700 hover:bg-green-100")}>
                  {banner.is_active ? "إخفاء" : "تفعيل"}
                </button>
                <button onClick={() => deleteBanner(banner.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
