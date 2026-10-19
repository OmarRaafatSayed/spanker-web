"use client";

/**
 * /admin/hotels
 * Full hotel management: manual entry, CSV/JSON import, image URL, amenities, availability.
 * Wired to the real `hotel_offers` table via Supabase client.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  Building2, Plus, Search, Upload, RefreshCw, Star,
  Edit, Power, Wifi, Coffee, Dumbbell, Waves, Car, Utensils,
  ChevronDown, ChevronUp, X, Check, Image, Globe, Calendar, Users,
} from "lucide-react";
import { ImageUploader } from "@/components/admin/ImageUploader";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HotelOffer {
  id: string;
  hotel_name: string;
  hotel_city: string;
  hotel_country: string;
  hotel_location: string;
  hotel_rating: number | null;
  hotel_category: string | null;
  room_type: string;
  board_basis: string | null;
  description: string | null;
  amenities: string[] | null;
  price_per_night: number;
  price_currency: string;
  special_offer_price: number | null;
  available_from: string;
  available_to: string;
  available_rooms: number | null;
  max_occupancy: number | null;
  cancellation_policy: string | null;
  terms_conditions: string | null;
  booking_deadline: string | null;
  image_url?: string | null;
  source: string;
  uploaded_file_reference: string | null;
  enabled: boolean | null;
  is_active: boolean;
  created_at: string;
}

const EMPTY_FORM = {
  hotel_name: "",
  hotel_city: "",
  hotel_country: "مصر",
  hotel_location: "",
  hotel_rating: "5",
  hotel_category: "resort",
  room_type: "standard",
  board_basis: "bed_breakfast",
  description: "",
  amenities: [] as string[],
  price_per_night: "",
  price_currency: "EGP",
  special_offer_price: "",
  available_from: "",
  available_to: "",
  available_rooms: "",
  max_occupancy: "2",
  cancellation_policy: "",
  image_url: "",
  source: "manual",
  enabled: true,
  is_active: true,
};

const AMENITY_OPTIONS = [
  { key: "wifi",       label: "واي فاي",      icon: Wifi },
  { key: "pool",       label: "حمام سباحة",   icon: Waves },
  { key: "gym",        label: "صالة رياضية",  icon: Dumbbell },
  { key: "breakfast",  label: "إفطار",        icon: Coffee },
  { key: "restaurant", label: "مطعم",         icon: Utensils },
  { key: "parking",    label: "موقف سيارات",  icon: Car },
  { key: "spa",        label: "سبا",          icon: Star },
  { key: "beach",      label: "شاطئ خاص",     icon: Waves },
  { key: "airport_transfer", label: "نقل مطار", icon: Car },
  { key: "ac",         label: "تكييف",        icon: Wifi },
  { key: "tv",         label: "تلفزيون",      icon: Globe },
  { key: "safe",       label: "خزنة آمنة",    icon: Building2 },
];

const ROOM_TYPES = [
  { value: "standard", label: "عادية" },
  { value: "deluxe",   label: "ديلوكس" },
  { value: "suite",    label: "جناح" },
  { value: "family",   label: "عائلية" },
  { value: "twin",     label: "توين" },
];

const BOARD_BASIS = [
  { value: "room_only",     label: "غرفة فقط" },
  { value: "bed_breakfast", label: "إفطار مشمول" },
  { value: "half_board",    label: "نصف إقامة" },
  { value: "full_board",    label: "إقامة كاملة" },
  { value: "all_inclusive", label: "شامل كامل" },
];

const CATEGORIES = [
  { value: "resort",    label: "منتجع" },
  { value: "city",      label: "فندق مدينة" },
  { value: "boutique",  label: "بوتيك" },
  { value: "beach",     label: "شاطئ" },
  { value: "heritage",  label: "تراثي" },
  { value: "budget",    label: "اقتصادي" },
];

const POPULAR_CITIES = [
  "شرم الشيخ", "الغردقة", "مرسى علم", "القاهرة",
  "الإسكندرية", "الأقصر", "أسوان", "سيوة",
];

// ─── CSV / JSON import helpers ─────────────────────────────────────────────

function parseCSV(text: string): Partial<typeof EMPTY_FORM>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map(line => {
    const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ""; });
    return obj as Partial<typeof EMPTY_FORM>;
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminHotelsPage() {
  const supabase = createClient();

  const [hotels, setHotels]       = useState<HotelOffer[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterActive, setFilterActive] = useState("all");

  const [showForm, setShowForm]   = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm]           = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ ok: number; fail: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── fetch ──
  const fetch = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("hotel_offers").select("*").order("created_at", { ascending: false });
    if (filterCity) q = q.eq("hotel_city", filterCity);
    if (filterActive === "active")   q = q.eq("is_active", true);
    if (filterActive === "inactive") q = q.eq("is_active", false);
    const { data } = await q;
    setHotels((data as HotelOffer[]) || []);
    setLoading(false);
  }, [filterCity, filterActive]);

  useEffect(() => { fetch(); }, [fetch]);

  // ── filtered list ──
  const filtered = hotels.filter(h =>
    !search ||
    h.hotel_name.toLowerCase().includes(search.toLowerCase()) ||
    h.hotel_city.toLowerCase().includes(search.toLowerCase()) ||
    h.hotel_country.toLowerCase().includes(search.toLowerCase())
  );

  // ── form helpers ──
  function setF(k: keyof typeof EMPTY_FORM, v: unknown) {
    setForm(p => ({ ...p, [k]: v }));
  }

  function toggleAmenity(key: string) {
    const cur = form.amenities;
    setF("amenities", cur.includes(key) ? cur.filter(a => a !== key) : [...cur, key]);
  }

  function openCreate() {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(h: HotelOffer) {
    setForm({
      hotel_name:          h.hotel_name,
      hotel_city:          h.hotel_city,
      hotel_country:       h.hotel_country,
      hotel_location:      h.hotel_location ?? "",
      hotel_rating:        String(h.hotel_rating ?? 5),
      hotel_category:      h.hotel_category ?? "resort",
      room_type:           h.room_type,
      board_basis:         h.board_basis ?? "bed_breakfast",
      description:         h.description ?? "",
      amenities:           (h.amenities as string[]) ?? [],
      price_per_night:     String(h.price_per_night),
      price_currency:      h.price_currency,
      special_offer_price: h.special_offer_price ? String(h.special_offer_price) : "",
      available_from:      h.available_from,
      available_to:        h.available_to,
      available_rooms:     h.available_rooms ? String(h.available_rooms) : "",
      max_occupancy:       h.max_occupancy ? String(h.max_occupancy) : "2",
      cancellation_policy: h.cancellation_policy ?? "",
      image_url:           ((h as unknown) as Record<string, unknown>).image_url as string ?? "",
      source:              h.source,
      enabled:             h.enabled ?? true,
      is_active:           h.is_active,
    });
    setEditingId(h.id);
    setFormError(null);
    setShowForm(true);
  }

  // ── save ──
  async function save() {
    if (!form.hotel_name.trim()) { setFormError("اسم الفندق مطلوب"); return; }
    if (!form.hotel_city.trim()) { setFormError("المدينة مطلوبة"); return; }
    if (!form.price_per_night || isNaN(Number(form.price_per_night))) {
      setFormError("السعر مطلوب ويجب أن يكون رقماً"); return;
    }
    if (!form.available_from || !form.available_to) {
      setFormError("تواريخ الإتاحة مطلوبة"); return;
    }

    setSaving(true);
    setFormError(null);

    const payload = {
      hotel_name:          form.hotel_name.trim(),
      hotel_city:          form.hotel_city.trim(),
      hotel_country:       form.hotel_country.trim(),
      hotel_location:      form.hotel_location.trim(),
      hotel_rating:        Number(form.hotel_rating),
      hotel_category:      form.hotel_category,
      room_type:           form.room_type,
      board_basis:         form.board_basis,
      description:         form.description.trim() || null,
      amenities:           form.amenities.length ? form.amenities : null,
      price_per_night:     Number(form.price_per_night),
      price_currency:      form.price_currency,
      special_offer_price: form.special_offer_price ? Number(form.special_offer_price) : null,
      available_from:      form.available_from,
      available_to:        form.available_to,
      available_rooms:     form.available_rooms ? Number(form.available_rooms) : null,
      max_occupancy:       Number(form.max_occupancy),
      cancellation_policy: form.cancellation_policy || null,
      source:              form.source || "manual",
      enabled:             form.enabled,
      is_active:           form.is_active,
    };

    try {
      if (editingId) {
        const { error } = await supabase.from("hotel_offers").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("hotel_offers").insert(payload as never);
        if (error) throw error;
      }
      setShowForm(false);
      fetch();
    } catch (e: unknown) {
      setFormError((e as Error).message ?? "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  // ── toggle ──
  async function toggleActive(id: string, current: boolean) {
    await supabase.from("hotel_offers").update({ is_active: !current, enabled: !current }).eq("id", id);
    fetch();
  }

  // ── delete ──
  async function deleteHotel(id: string) {
    if (!confirm("هل تريد حذف هذا الفندق؟")) return;
    await supabase.from("hotel_offers").delete().eq("id", id);
    fetch();
  }

  // ── import ──
  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResults(null);
    const text = await file.text();

    let rows: Partial<typeof EMPTY_FORM>[] = [];
    try {
      if (file.name.endsWith(".json")) {
        rows = JSON.parse(text);
      } else {
        rows = parseCSV(text);
      }
    } catch {
      alert("ملف غير صالح — استخدم CSV أو JSON");
      setImporting(false);
      return;
    }

    let ok = 0;
    let fail = 0;
    for (const row of rows) {
      const payload = {
        hotel_name:      row.hotel_name ?? (row as Record<string, unknown>)["name"] as string ?? "—",
        hotel_city:      row.hotel_city ?? (row as Record<string, unknown>)["city"] as string ?? "",
        hotel_country:   row.hotel_country ?? (row as Record<string, unknown>)["country"] as string ?? "مصر",
        hotel_location:  row.hotel_location ?? "",
        hotel_rating:    Number(row.hotel_rating ?? 4),
        hotel_category:  row.hotel_category ?? "resort",
        room_type:       row.room_type ?? "standard",
        board_basis:     row.board_basis ?? "bed_breakfast",
        description:     row.description ?? null,
        amenities:       null,
        price_per_night: Number(row.price_per_night ?? 0),
        price_currency:  row.price_currency ?? "EGP",
        available_from:  row.available_from ?? new Date().toISOString().split("T")[0],
        available_to:    row.available_to ?? "2027-12-31",
        available_rooms: Number(row.available_rooms ?? 10),
        source:          "import",
        is_active:       true,
        enabled:         true,
      };
      const { error } = await supabase.from("hotel_offers").insert(payload as never);
      if (error) fail++; else ok++;
    }

    setImportResults({ ok, fail });
    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
    fetch();
  }

  // ─── JSX ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 max-w-7xl" dir="rtl">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-text-primary flex items-center gap-2">
            <Building2 className="w-6 h-6 text-brand-green" />
            إدارة الفنادق
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            {hotels.length} فندق · {hotels.filter(h => h.is_active).length} نشط
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Import button */}
          <label className={cn(
            "flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border-default text-sm font-semibold cursor-pointer transition-all",
            importing ? "opacity-60 pointer-events-none" : "hover:bg-muted text-text-secondary"
          )}>
            <Upload className="w-4 h-4" />
            {importing ? "جاري الاستيراد..." : "استيراد CSV / JSON"}
            <input ref={fileRef} type="file" accept=".csv,.json" className="hidden" onChange={handleImportFile} />
          </label>
          <button onClick={() => fetch()} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border-default text-sm text-text-secondary hover:bg-muted transition-all">
            <RefreshCw className="w-4 h-4" />
            تحديث
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-green text-white text-sm font-bold hover:bg-brand-green-dark transition-all shadow-sm">
            <Plus className="w-4 h-4" />
            فندق جديد
          </button>
        </div>
      </div>

      {/* Import result */}
      {importResults && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-200 text-sm">
          <Check className="w-4 h-4 text-green-600" />
          <span>تم استيراد <strong>{importResults.ok}</strong> فندق بنجاح
            {importResults.fail > 0 && <span className="text-red-600"> · {importResults.fail} سطر فشل</span>}
          </span>
          <button onClick={() => setImportResults(null)} className="mr-auto text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ── Import format hint ── */}
      <details className="text-xs text-text-muted border border-border-light rounded-xl p-3">
        <summary className="cursor-pointer font-semibold text-text-secondary flex items-center gap-1">
          <Upload className="w-3 h-3" /> تنسيق ملف الاستيراد (اضغط للعرض)
        </summary>
        <div className="mt-2 space-y-1">
          <p className="font-semibold">CSV — الأعمدة المطلوبة:</p>
          <code className="block bg-muted px-2 py-1 rounded text-xs leading-relaxed">
            hotel_name, hotel_city, hotel_country, hotel_rating, room_type, board_basis, price_per_night, price_currency, available_from, available_to, available_rooms, description
          </code>
          <p className="font-semibold mt-2">JSON — مثال:</p>
          <code className="block bg-muted px-2 py-1 rounded text-xs leading-relaxed whitespace-pre">
{`[{ "hotel_name": "سان رايز", "hotel_city": "شرم الشيخ",
   "hotel_rating": 5, "price_per_night": 1200,
   "available_from": "2026-11-01", "available_to": "2027-03-31" }]`}
          </code>
        </div>
      </details>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute top-1/2 right-3 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ابحث باسم الفندق أو المدينة..."
            className="w-full h-10 pr-9 pl-3 border border-border-default rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 bg-white" />
        </div>

        <select value={filterCity} onChange={e => setFilterCity(e.target.value)}
          className="h-10 px-3 border border-border-default rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/30">
          <option value="">كل المدن</option>
          {POPULAR_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <div className="flex gap-1 bg-muted p-1 rounded-xl">
          {[
            { val: "all",      label: "الكل" },
            { val: "active",   label: "نشطة" },
            { val: "inactive", label: "مخفية" },
          ].map(f => (
            <button key={f.val} onClick={() => setFilterActive(f.val)}
              className={cn("text-xs font-semibold px-3 py-1.5 rounded-lg transition-all",
                filterActive === f.val ? "bg-white shadow-sm text-brand-green" : "text-text-muted hover:text-text-secondary"
              )}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Hotel Cards (mobile) / Table (desktop) ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-40 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>لا توجد فنادق</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {filtered.map(h => (
              <HotelCard key={h.id} hotel={h}
                onEdit={() => openEdit(h)}
                onToggle={() => toggleActive(h.id, h.is_active)}
                onDelete={() => deleteHotel(h.id)}
                expanded={expandedId === h.id}
                onExpand={() => setExpandedId(expandedId === h.id ? null : h.id)}
              />
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-white rounded-2xl border border-border-light overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light bg-muted/50">
                  {["الفندق", "المدينة", "النجوم", "النوع", "الإفطار", "السعر/ليلة", "المتاح", "الحالة", ""].map(h => (
                    <th key={h} className="text-right px-4 py-3 text-xs font-semibold text-text-muted whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {filtered.map(h => (
                  <tr key={h.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="font-bold text-text-primary truncate">{h.hotel_name}</p>
                      {h.hotel_category && (
                        <p className="text-xs text-text-muted">
                          {CATEGORIES.find(c => c.value === h.hotel_category)?.label}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{h.hotel_city}</td>
                    <td className="px-4 py-3 text-brand-yellow whitespace-nowrap">
                      {"★".repeat(h.hotel_rating ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {ROOM_TYPES.find(r => r.value === h.room_type)?.label ?? h.room_type}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {BOARD_BASIS.find(b => b.value === h.board_basis)?.label ?? "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>
                        {h.special_offer_price ? (
                          <>
                            <span className="font-black text-red-600">{h.special_offer_price.toLocaleString()}</span>
                            <span className="text-xs text-text-muted line-through mr-1">{h.price_per_night.toLocaleString()}</span>
                          </>
                        ) : (
                          <span className="font-bold text-brand-green">{h.price_per_night.toLocaleString()}</span>
                        )}
                        <span className="text-xs text-text-muted mr-1">{h.price_currency}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {h.available_rooms ?? "—"} غرفة
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "text-xs font-semibold px-2 py-1 rounded-full",
                        h.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      )}>
                        {h.is_active ? "نشط" : "مخفي"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button onClick={() => openEdit(h)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition" title="تعديل">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => toggleActive(h.id, h.is_active)}
                          className={cn("p-1.5 rounded-lg transition", h.is_active ? "hover:bg-red-50 text-red-400" : "hover:bg-green-50 text-green-600")}
                          title={h.is_active ? "إخفاء" : "تفعيل"}>
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          Hotel Form Modal
          ══════════════════════════════════════════════════════════════════ */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8" dir="rtl">

            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-border-light">
              <div>
                <h3 className="text-lg font-black text-text-primary">
                  {editingId ? "تعديل بيانات الفندق" : "إضافة فندق جديد"}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">جميع الحقول المميزة بـ * مطلوبة</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-muted text-text-muted transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-6">

              {/* Section 1: Basic Info */}
              <FormSection title="المعلومات الأساسية" icon={Building2}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="اسم الفندق" required>
                    <input value={form.hotel_name} onChange={e => setF("hotel_name", e.target.value)}
                      placeholder="مثال: سان رايز ريزورت" className={fieldCls} />
                  </Field>
                  <Field label="التصنيف">
                    <select value={form.hotel_category} onChange={e => setF("hotel_category", e.target.value)} className={fieldCls}>
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </Field>
                  <Field label="المدينة" required>
                    <input list="city-list" value={form.hotel_city} onChange={e => setF("hotel_city", e.target.value)}
                      placeholder="شرم الشيخ" className={fieldCls} />
                    <datalist id="city-list">
                      {POPULAR_CITIES.map(c => <option key={c} value={c} />)}
                    </datalist>
                  </Field>
                  <Field label="الدولة" required>
                    <input value={form.hotel_country} onChange={e => setF("hotel_country", e.target.value)}
                      placeholder="مصر" className={fieldCls} />
                  </Field>
                  <Field label="العنوان / الموقع" className="sm:col-span-2">
                    <input value={form.hotel_location} onChange={e => setF("hotel_location", e.target.value)}
                      placeholder="مثال: شارع الكورنيش، خليج نعمة" className={fieldCls} />
                  </Field>
                  <Field label="التصنيف النجمي" required>
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map(n => (
                        <button key={n} type="button" onClick={() => setF("hotel_rating", String(n))}
                          className={cn("text-xl transition-transform hover:scale-110",
                            Number(form.hotel_rating) >= n ? "text-brand-yellow" : "text-gray-300"
                          )}>★</button>
                      ))}
                    </div>
                  </Field>
                  <Field label="صورة الغلاف">
                    <ImageUploader
                      value={form.image_url ?? ""}
                      onChange={url => setF("image_url", url)}
                      bucket="hotels"
                    />
                  </Field>
                </div>
              </FormSection>

              {/* Section 2: Room & Board */}
              <FormSection title="نوع الغرفة والخدمات" icon={Coffee}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="نوع الغرفة" required>
                    <select value={form.room_type} onChange={e => setF("room_type", e.target.value)} className={fieldCls}>
                      {ROOM_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </Field>
                  <Field label="نظام الوجبات">
                    <select value={form.board_basis} onChange={e => setF("board_basis", e.target.value)} className={fieldCls}>
                      {BOARD_BASIS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                    </select>
                  </Field>
                  <Field label="الحد الأقصى للأشخاص بالغرفة">
                    <input type="number" min={1} max={6} value={form.max_occupancy} onChange={e => setF("max_occupancy", e.target.value)} className={fieldCls} />
                  </Field>
                </div>
                {/* Amenities */}
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-2">المرافق والخدمات</label>
                  <div className="flex flex-wrap gap-2">
                    {AMENITY_OPTIONS.map(({ key, label, icon: Icon }) => (
                      <button key={key} type="button" onClick={() => toggleAmenity(key)}
                        className={cn(
                          "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-all",
                          form.amenities.includes(key)
                            ? "bg-brand-green text-white border-brand-green"
                            : "bg-white text-text-secondary border-border-default hover:border-brand-green"
                        )}>
                        <Icon className="w-3 h-3" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </FormSection>

              {/* Section 3: Pricing */}
              <FormSection title="التسعير" icon={Star}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="سعر الليلة" required>
                    <input type="number" min={0} value={form.price_per_night} onChange={e => setF("price_per_night", e.target.value)}
                      placeholder="1200" className={fieldCls} />
                  </Field>
                  <Field label="سعر العرض الخاص">
                    <input type="number" min={0} value={form.special_offer_price} onChange={e => setF("special_offer_price", e.target.value)}
                      placeholder="اتركه فارغاً إن لم يكن هناك عرض" className={fieldCls} />
                  </Field>
                  <Field label="العملة" required>
                    <select value={form.price_currency} onChange={e => setF("price_currency", e.target.value)} className={fieldCls}>
                      <option value="EGP">جنيه مصري (EGP)</option>
                      <option value="USD">دولار (USD)</option>
                      <option value="EUR">يورو (EUR)</option>
                    </select>
                  </Field>
                </div>
              </FormSection>

              {/* Section 4: Availability */}
              <FormSection title="الإتاحة" icon={Calendar}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="متاح من" required>
                    <input type="date" value={form.available_from} onChange={e => setF("available_from", e.target.value)} className={fieldCls} />
                  </Field>
                  <Field label="متاح حتى" required>
                    <input type="date" value={form.available_to} onChange={e => setF("available_to", e.target.value)} className={fieldCls} />
                  </Field>
                  <Field label="عدد الغرف المتاحة">
                    <input type="number" min={0} value={form.available_rooms} onChange={e => setF("available_rooms", e.target.value)}
                      placeholder="30" className={fieldCls} />
                  </Field>
                </div>
              </FormSection>

              {/* Section 5: Details */}
              <FormSection title="تفاصيل إضافية" icon={Globe}>
                <div className="grid grid-cols-1 gap-4">
                  <Field label="الوصف">
                    <textarea rows={3} value={form.description} onChange={e => setF("description", e.target.value)}
                      placeholder="اكتب وصفاً تفصيلياً يجذب العملاء..."
                      className={cn(fieldCls, "h-auto resize-none")} />
                  </Field>
                  <Field label="سياسة الإلغاء">
                    <input value={form.cancellation_policy} onChange={e => setF("cancellation_policy", e.target.value)}
                      placeholder="مثال: إلغاء مجاني حتى 48 ساعة قبل الوصول" className={fieldCls} />
                  </Field>
                </div>
              </FormSection>

              {/* Visibility toggles */}
              <div className="flex flex-wrap gap-4 p-4 bg-muted/40 rounded-xl">
                {([
                  ["is_active", "ظاهر على الموقع للعملاء"],
                  ["enabled",   "مفعّل في البحث"],
                ] as [keyof typeof EMPTY_FORM, string][]).map(([field, label]) => (
                  <label key={field} className="flex items-center gap-2.5 cursor-pointer">
                    <div className={cn(
                      "w-10 h-5 rounded-full relative transition-colors",
                      (form[field] as boolean) ? "bg-brand-green" : "bg-gray-300"
                    )} onClick={() => setF(field, !(form[field] as boolean))}>
                      <div className={cn(
                        "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all",
                        (form[field] as boolean) ? "right-0.5" : "left-0.5"
                      )} />
                    </div>
                    <span className="text-sm font-medium text-text-secondary">{label}</span>
                  </label>
                ))}
              </div>

              {formError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <X className="w-4 h-4 shrink-0" />
                  {formError}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex gap-3 p-5 border-t border-border-light">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-3 rounded-xl border border-border-default text-sm text-text-secondary hover:bg-muted transition-all">
                إلغاء
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 py-3 rounded-xl bg-brand-green text-white text-sm font-bold hover:bg-brand-green-dark transition-all disabled:opacity-60">
                {saving ? "جاري الحفظ..." : editingId ? "حفظ التعديلات" : "إضافة الفندق"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

const fieldCls = "w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green bg-white text-gray-900 transition-colors";

function FormSection({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-border-light">
        <div className="w-6 h-6 rounded-lg bg-brand-green/10 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-brand-green" />
        </div>
        <h4 className="text-sm font-bold text-text-primary">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function Field({ label, required, className, children }: {
  label: string; required?: boolean; className?: string; children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-text-secondary mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function HotelCard({ hotel, onEdit, onToggle, onDelete, expanded, onExpand }: {
  hotel: HotelOffer;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  expanded: boolean;
  onExpand: () => void;
}) {
  return (
    <div className={cn(
      "bg-white rounded-2xl border transition-all",
      expanded ? "border-brand-green shadow-md" : "border-border-light"
    )}>
      <div className="p-4 cursor-pointer" onClick={onExpand}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-brand-green" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-text-primary truncate">{hotel.hotel_name}</p>
            <p className="text-xs text-text-muted">{hotel.hotel_city} · {"★".repeat(hotel.hotel_rating ?? 0)}</p>
          </div>
          <div className="text-left shrink-0">
            <p className="font-bold text-brand-green text-sm">{hotel.price_per_night.toLocaleString()} {hotel.price_currency}</p>
            <p className="text-xs text-text-muted">/ ليلة</p>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-border-light pt-3">
          <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary">
            <p><span className="text-text-muted">النوع:</span> {ROOM_TYPES.find(r => r.value === hotel.room_type)?.label}</p>
            <p><span className="text-text-muted">الوجبات:</span> {BOARD_BASIS.find(b => b.value === hotel.board_basis)?.label ?? "—"}</p>
            <p><span className="text-text-muted">الغرف:</span> {hotel.available_rooms ?? "—"}</p>
            <p><span className="text-text-muted">الإتاحة:</span> {hotel.available_from} → {hotel.available_to}</p>
          </div>
          {(hotel.amenities as string[])?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {(hotel.amenities as string[]).map(a => (
                <span key={a} className="text-xs bg-brand-green/10 text-brand-green px-2 py-0.5 rounded-full">
                  {AMENITY_OPTIONS.find(o => o.key === a)?.label ?? a}
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button onClick={onEdit} className="flex-1 py-2 rounded-xl bg-blue-50 text-blue-600 text-xs font-semibold">تعديل</button>
            <button onClick={onToggle} className={cn("flex-1 py-2 rounded-xl text-xs font-semibold",
              hotel.is_active ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700")}>
              {hotel.is_active ? "إخفاء" : "تفعيل"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
