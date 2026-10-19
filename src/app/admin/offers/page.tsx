"use client";

/**
 * /admin/offers — Special Offers Management
 * Data stored in content_banners (position='special_offer') via service role API.
 * What you add/edit here appears directly on /ar/special-offers customer page.
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Tag, Plus, Search, RefreshCw, Edit, Power, Trash2,
  X, AlertTriangle, Loader2, Eye, EyeOff,
} from "lucide-react";
import { ImageUploader } from "@/components/admin/ImageUploader";

// ─── Types ────────────────────────────────────────────────────────────────────

type OfferType = "flight" | "hotel" | "visa" | "package";

interface OfferMeta {
  offer_type: OfferType; destination: string; duration: string;
  original_price: number | null; discounted_price: number;
  discount_percent: number | null; currency: string;
  includes: string[]; emoji: string; badge: string;
  badge_color: string; available_slots: number | null;
  terms_conditions: string; description: string;
}

interface Offer {
  id: string; title: string; image_url: string | null;
  link_url: string | null; start_date: string | null;
  end_date: string | null; is_active: boolean;
  display_order: number; meta: OfferMeta; created_at: string;
}

const TYPE_LABELS: Record<OfferType, string> = {
  flight: "طيران", hotel: "فندق", visa: "تأشيرة", package: "باقة سياحية",
};
const TYPE_COLORS: Record<OfferType, string> = {
  flight: "bg-sky-100 text-sky-700", hotel: "bg-amber-100 text-amber-700",
  visa:   "bg-purple-100 text-purple-700", package: "bg-green-100 text-green-700",
};
const BADGE_PRESETS = [
  { label: "🔥 الأكثر مبيعاً", color: "bg-red-500" },
  { label: "⚡ عرض محدود",     color: "bg-amber-500" },
  { label: "✨ جديد",           color: "bg-purple-500" },
  { label: "🌟 موصى به",       color: "bg-brand-green" },
  { label: "💼 سريع",           color: "bg-blue-500" },
  { label: "🌴 صيفي",           color: "bg-teal-500" },
];
const EMOJI_OPTS = ["🏖️","🌆","🤿","🏛️","🕌","🌴","✈️","🏨","🌍","🗺️","🎭","🏝️"];

// ─── API helpers ──────────────────────────────────────────────────────────────

function getToken(): string {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.includes("supabase") && key.includes("auth")) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          const token = parsed?.access_token ?? parsed?.session?.access_token;
          if (token) return token;
        }
      }
    }
  } catch { /* ignore */ }
  return "";
}

async function apiFetch(path: string, opts?: RequestInit) {
  const token = getToken();
  const res = await fetch(path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts?.headers ?? {}),
    },
  });
  return res.json();
}

function daysUntil(d: string | null) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);
}
function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ar-EG", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Empty form ───────────────────────────────────────────────────────────────
const EMPTY: Partial<Offer & OfferMeta & { includes_raw: string }> = {
  title: "", offer_type: "package", destination: "", duration: "",
  original_price: undefined, discounted_price: undefined, discount_percent: undefined,
  currency: "EGP", includes_raw: "", emoji: "🌟", badge: "🌟 موصى به",
  badge_color: "bg-brand-green", available_slots: undefined,
  terms_conditions: "", description: "", image_url: "",
  start_date: "", end_date: "", is_active: true,
};
type FormState = typeof EMPTY;

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminOffersPage() {
  const [offers, setOffers]           = useState<Offer[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [filterType, setFilterType]   = useState("all");
  const [filterActive, setFilterActive] = useState("all");

  const [showForm, setShowForm]       = useState(false);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [form, setForm]               = useState<FormState>({ ...EMPTY });
  const [saving, setSaving]           = useState(false);
  const [formError, setFormError]     = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Offer | null>(null);
  const [deleting, setDeleting]       = useState(false);

  // ── Load ──
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterActive !== "all") params.set("active", filterActive);
      if (filterType !== "all")   params.set("type", filterType);
      const res = await apiFetch(`/api/admin/special-offers?${params}`);
      if (res.success) setOffers(res.data ?? []);
    } finally { setLoading(false); }
  }, [filterActive, filterType]);

  useEffect(() => { load(); }, [load]);

  const filtered = offers.filter(o =>
    !search ||
    o.title.toLowerCase().includes(search.toLowerCase()) ||
    o.meta.destination.toLowerCase().includes(search.toLowerCase())
  );

  // ── Helpers ──
  function setF(k: keyof FormState, v: unknown) {
    setForm(p => {
      const next = { ...p, [k]: v };
      if ((k === "original_price" || k === "discounted_price") &&
          next.original_price && next.discounted_price) {
        const orig = Number(next.original_price);
        const disc = Number(next.discounted_price);
        if (orig > disc) next.discount_percent = Math.round(((orig - disc) / orig) * 100);
      }
      return next;
    });
  }

  function openCreate() {
    setForm({ ...EMPTY }); setEditingId(null); setFormError(null); setShowForm(true);
  }

  function openEdit(o: Offer) {
    setForm({
      title: o.title, image_url: o.image_url ?? "",
      start_date: o.start_date ?? "", end_date: o.end_date ?? "",
      is_active: o.is_active,
      offer_type: o.meta.offer_type, destination: o.meta.destination,
      duration: o.meta.duration,
      original_price: o.meta.original_price ?? undefined,
      discounted_price: o.meta.discounted_price,
      discount_percent: o.meta.discount_percent ?? undefined,
      currency: o.meta.currency, emoji: o.meta.emoji,
      badge: o.meta.badge, badge_color: o.meta.badge_color,
      includes_raw: o.meta.includes.join("\n"),
      available_slots: o.meta.available_slots ?? undefined,
      terms_conditions: o.meta.terms_conditions,
      description: o.meta.description,
    });
    setEditingId(o.id); setFormError(null); setShowForm(true);
  }

  // ── Save ──
  async function save() {
    if (!form.title?.trim())        { setFormError("عنوان العرض مطلوب"); return; }
    if (!form.destination?.trim())  { setFormError("الوجهة مطلوبة"); return; }
    if (!form.discounted_price || Number(form.discounted_price) <= 0) {
      setFormError("السعر بعد الخصم مطلوب"); return;
    }
    setSaving(true); setFormError(null);
    try {
      const payload = {
        title: form.title, image_url: form.image_url || null,
        start_date: form.start_date || null, end_date: form.end_date || null,
        is_active: form.is_active,
        offer_type: form.offer_type, destination: form.destination,
        duration: form.duration,
        original_price: form.original_price ? Number(form.original_price) : null,
        discounted_price: Number(form.discounted_price),
        discount_percent: form.discount_percent ? Number(form.discount_percent) : null,
        currency: form.currency, emoji: form.emoji, badge: form.badge,
        badge_color: form.badge_color,
        includes: form.includes_raw
          ? (form.includes_raw as string).split("\n").map(l => l.trim()).filter(Boolean)
          : [],
        available_slots: form.available_slots ? Number(form.available_slots) : null,
        terms_conditions: form.terms_conditions, description: form.description,
      };
      const res = editingId
        ? await apiFetch(`/api/admin/special-offers/${editingId}`, { method: "PATCH", body: JSON.stringify(payload) })
        : await apiFetch("/api/admin/special-offers", { method: "POST", body: JSON.stringify(payload) });
      if (!res.success) throw new Error(res.error ?? "فشل الحفظ");
      setShowForm(false); load();
    } catch (e: unknown) {
      setFormError((e as Error).message ?? "حدث خطأ");
    } finally { setSaving(false); }
  }

  // ── Toggle ──
  async function toggleActive(o: Offer) {
    await apiFetch(`/api/admin/special-offers/${o.id}`, {
      method: "PATCH", body: JSON.stringify({ is_active: !o.is_active }),
    });
    load();
  }

  // ── Delete ──
  async function doDelete(id: string) {
    setDeleting(true);
    await apiFetch(`/api/admin/special-offers/${id}`, { method: "DELETE" });
    setDeleting(false); setDeleteTarget(null); load();
  }

  const iCls = "w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green bg-white text-gray-900";

  return (
    <div className="space-y-5 max-w-7xl" dir="rtl">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-text-primary flex items-center gap-2">
            <Tag className="w-6 h-6 text-brand-green" /> العروض الخاصة
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            {offers.length} عرض · {offers.filter(o => o.is_active).length} نشط — تظهر مباشرة على صفحة العروض للعملاء
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2.5 rounded-xl border border-border-default hover:bg-muted transition-all">
            <RefreshCw className="w-4 h-4 text-text-secondary" />
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-green text-white text-sm font-bold hover:bg-brand-green-dark transition-all shadow-sm">
            <Plus className="w-4 h-4" /> عرض جديد
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
        <Tag className="w-4 h-4 shrink-0 mt-0.5" />
        <span>كل ما تضيفه أو تعدله هنا يظهر <strong>فوراً</strong> على صفحة
          {" "}<a href="/ar/special-offers" target="_blank" className="underline font-bold">/ar/special-offers</a>{" "}
          للعملاء. العروض المخفية لا تظهر للزوار.
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute top-1/2 right-3 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..."
            className="w-full h-10 pr-9 pl-3 border border-border-default rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/30" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="h-10 px-3 border border-border-default rounded-xl text-sm bg-white focus:outline-none">
          <option value="all">كل الأنواع</option>
          {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <div className="flex gap-1 bg-muted p-1 rounded-xl">
          {([ { val: "all", label: "الكل" }, { val: "true", label: "نشطة" }, { val: "false", label: "مخفية" } ] as const).map(f => (
            <button key={f.val} onClick={() => setFilterActive(f.val)}
              className={cn("text-xs font-semibold px-3 py-1.5 rounded-lg transition-all",
                filterActive === f.val ? "bg-white shadow-sm text-brand-green" : "text-text-muted hover:text-text-secondary")}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Offers grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>لا توجد عروض</p>
          <button onClick={openCreate} className="mt-3 text-sm text-brand-green font-bold hover:underline">+ أضف عرض جديد</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(o => {
            const daysLeft    = daysUntil(o.end_date);
            const expiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3;
            const expired     = daysLeft !== null && daysLeft < 0;
            return (
              <div key={o.id} className={cn(
                "bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-md",
                expiringSoon ? "border-orange-400" : expired ? "border-red-200 opacity-70" : "border-border-light",
                !o.is_active && "opacity-60"
              )}>
                {/* Card hero */}
                <div className="relative h-32 bg-gradient-to-br from-brand-green to-brand-green-dark flex items-center justify-center overflow-hidden">
                  {o.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={o.image_url} alt={o.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl">{o.meta.emoji}</span>
                  )}
                  {o.meta.badge && (
                    <div className={cn("absolute top-2 right-2 text-[10px] text-white font-bold px-2 py-0.5 rounded-full", o.meta.badge_color)}>
                      {o.meta.badge}
                    </div>
                  )}
                  {o.meta.discount_percent && (
                    <div className="absolute top-2 left-2 bg-white text-brand-green font-black text-xs px-2 py-0.5 rounded-full">
                      -{o.meta.discount_percent}٪
                    </div>
                  )}
                  {!o.is_active && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <span className="text-white font-bold text-xs bg-black/50 px-3 py-1 rounded-full">مخفي</span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex-1">
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", TYPE_COLORS[o.meta.offer_type])}>
                        {TYPE_LABELS[o.meta.offer_type]}
                      </span>
                      <h3 className="font-bold text-text-primary text-sm mt-1 leading-tight">{o.title}</h3>
                      <p className="text-xs text-text-muted">{o.meta.destination} · {o.meta.duration}</p>
                    </div>
                    <div className="text-left shrink-0">
                      {o.meta.original_price && (
                        <p className="text-xs text-text-muted line-through">{o.meta.original_price.toLocaleString()}</p>
                      )}
                      <p className="font-black text-brand-green">{o.meta.discounted_price.toLocaleString()} {o.meta.currency}</p>
                    </div>
                  </div>

                  {expiringSoon && <p className="text-[10px] text-orange-600 font-bold mb-1.5">⚠ ينتهي خلال {daysLeft} أيام</p>}
                  {expired && <p className="text-[10px] text-red-500 font-bold mb-1.5">منتهي الصلاحية</p>}

                  {o.end_date && !expired && (
                    <p className="text-xs text-text-muted mb-2">ينتهي: {fmtDate(o.end_date)}</p>
                  )}

                  <div className="flex gap-2 mt-2">
                    <button onClick={() => openEdit(o)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition-all">
                      <Edit className="w-3 h-3" /> تعديل
                    </button>
                    <button onClick={() => toggleActive(o)}
                      className={cn("flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-semibold transition-all",
                        o.is_active ? "bg-red-50 text-red-500 hover:bg-red-100" : "bg-green-50 text-green-700 hover:bg-green-100")}>
                      {o.is_active ? <><EyeOff className="w-3 h-3" /> إخفاء</> : <><Eye className="w-3 h-3" /> تفعيل</>}
                    </button>
                    <button onClick={() => setDeleteTarget(o)}
                      className="p-1.5 rounded-xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8" dir="rtl">
            <div className="flex items-center justify-between p-5 border-b border-border-light">
              <h3 className="text-lg font-black">{editingId ? "تعديل العرض" : "إضافة عرض جديد"}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-muted"><X className="w-5 h-5 text-text-muted" /></button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Title */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">عنوان العرض *</label>
                <input value={form.title ?? ""} onChange={e => setF("title", e.target.value)}
                  placeholder="باقة البحر الأحمر الشاملة" className={iCls} />
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">نوع العرض *</label>
                <select value={form.offer_type} onChange={e => setF("offer_type", e.target.value)} className={iCls}>
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>

              {/* Destination */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">الوجهة *</label>
                <input value={form.destination ?? ""} onChange={e => setF("destination", e.target.value)}
                  placeholder="الغردقة" className={iCls} />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">المدة</label>
                <input value={form.duration ?? ""} onChange={e => setF("duration", e.target.value)}
                  placeholder="٥ أيام / ٤ ليالٍ" className={iCls} />
              </div>

              {/* Emoji */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">إيموجي الغلاف</label>
                <div className="flex gap-1.5 flex-wrap">
                  {EMOJI_OPTS.map(e => (
                    <button key={e} type="button" onClick={() => setF("emoji", e)}
                      className={cn("text-xl p-1.5 rounded-lg border transition-all",
                        form.emoji === e ? "border-brand-green bg-brand-green/10" : "border-gray-200 hover:border-gray-400")}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Original price */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">السعر الأصلي</label>
                <input type="number" min={0} value={form.original_price ?? ""} onChange={e => setF("original_price", e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="8500" className={iCls} />
              </div>

              {/* Discounted price */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">السعر بعد الخصم *</label>
                <div className="flex gap-2">
                  <input type="number" min={0} value={form.discounted_price ?? ""} onChange={e => setF("discounted_price", Number(e.target.value))}
                    placeholder="5950" className={cn(iCls, "flex-1")} />
                  <select value={form.currency} onChange={e => setF("currency", e.target.value)}
                    className="h-10 px-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none w-20">
                    <option value="EGP">EGP</option><option value="USD">USD</option><option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              {/* Discount % */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">نسبة الخصم % (محسوبة تلقائياً)</label>
                <input type="number" min={0} max={100} value={form.discount_percent ?? ""} onChange={e => setF("discount_percent", e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="30" className={iCls} />
              </div>

              {/* Badge */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">الشارة</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {BADGE_PRESETS.map(b => (
                    <button key={b.label} type="button" onClick={() => { setF("badge", b.label); setF("badge_color", b.color); }}
                      className={cn("text-xs px-2 py-1 rounded-full text-white font-semibold transition-all", b.color,
                        form.badge === b.label ? "ring-2 ring-offset-1 ring-gray-400" : "opacity-70 hover:opacity-100")}>
                      {b.label}
                    </button>
                  ))}
                </div>
                <input value={form.badge ?? ""} onChange={e => setF("badge", e.target.value)} placeholder="أو اكتب شارة مخصصة" className={iCls} />
              </div>

              {/* Slots */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">الأماكن المتاحة</label>
                <input type="number" min={1} value={form.available_slots ?? ""} onChange={e => setF("available_slots", e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="غير محدود" className={iCls} />
              </div>

              {/* Dates */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">تاريخ البداية</label>
                <input type="date" value={form.start_date ?? ""} onChange={e => setF("start_date", e.target.value || null)} className={iCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">تاريخ الانتهاء</label>
                <input type="date" value={form.end_date ?? ""} onChange={e => setF("end_date", e.target.value || null)} className={iCls} />
              </div>

              {/* Image upload */}
              <div className="sm:col-span-2">
                <ImageUploader
                  value={form.image_url ?? ""}
                  onChange={url => setF("image_url", url)}
                  bucket="offers"
                  label="صورة الغلاف"
                  hint="اتركها فارغة لاستخدام الإيموجي"
                />
              </div>

              {/* Includes */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">يشمل العرض (سطر لكل بند)</label>
                <textarea rows={4} value={form.includes_raw ?? ""} onChange={e => setF("includes_raw", e.target.value)}
                  placeholder={"✈️ طيران ذهاب وعودة\n🏨 فندق ٥ نجوم\n🤿 رحلة غوص\n🍽️ إفطار وعشاء"}
                  className={cn(iCls, "h-auto resize-none font-mono text-xs leading-relaxed")} />
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">وصف العرض</label>
                <textarea rows={2} value={form.description ?? ""} onChange={e => setF("description", e.target.value)}
                  placeholder="وصف مختصر يظهر للعميل..." className={cn(iCls, "h-auto resize-none")} />
              </div>

              {/* Active toggle */}
              <div className="sm:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className={cn("w-11 h-6 rounded-full relative transition-colors shrink-0", form.is_active ? "bg-brand-green" : "bg-gray-300")}
                    onClick={() => setF("is_active", !form.is_active)}>
                    <div className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all", form.is_active ? "right-0.5" : "left-0.5")} />
                  </div>
                  <span className="text-sm font-medium text-text-secondary">
                    {form.is_active ? "✅ نشط — يظهر للعملاء" : "🚫 مخفي — لا يظهر للعملاء"}
                  </span>
                </label>
              </div>

              {formError && (
                <div className="sm:col-span-2 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4 shrink-0" />{formError}
                </div>
              )}
            </div>

            <div className="flex gap-3 p-5 border-t border-border-light">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-border-default text-sm text-text-secondary hover:bg-muted transition-all">إلغاء</button>
              <button onClick={save} disabled={saving}
                className="flex-1 py-3 rounded-xl bg-brand-green text-white text-sm font-bold hover:bg-brand-green-dark transition-all disabled:opacity-60">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin inline ml-2" />جاري الحفظ...</> : editingId ? "حفظ التعديلات" : "نشر العرض"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" dir="rtl">
          <div className="bg-white rounded-2xl p-6 w-80 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
              <div><p className="font-bold text-sm">حذف العرض</p><p className="text-xs text-text-muted">{deleteTarget.title}</p></div>
            </div>
            <p className="text-sm text-text-secondary">هل أنت متأكد؟ سيختفي العرض من الموقع فوراً.</p>
            <div className="flex gap-3">
              <button onClick={() => doDelete(deleteTarget.id)} disabled={deleting}
                className="flex-1 h-10 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-all disabled:opacity-60">
                {deleting ? "جاري الحذف..." : "حذف"}
              </button>
              <button onClick={() => setDeleteTarget(null)} className="flex-1 h-10 border border-border-light text-sm rounded-xl hover:bg-muted transition-all">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
