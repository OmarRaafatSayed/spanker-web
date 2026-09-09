"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const EMPTY_HOTEL = {
  name: "", slug: "", city: "", country: "Egypt", address: "",
  star_rating: 5, description_ar: "", description_en: "",
  check_in_time: "14:00", check_out_time: "12:00",
  rooms_total: 100, rooms_available: 100,
  price_per_night: "", taxes_percent: 14,
  cancellation_hours: 72, is_featured: false, is_public: true, enabled: true,
};

export default function AdminHotelsPage() {
  const supabase = createClient();
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingHotel, setEditingHotel] = useState<any | null>(null);
  const [form, setForm] = useState<any>(EMPTY_HOTEL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  // Availability management
  const [showAvailDialog, setShowAvailDialog] = useState(false);
  const [availHotel, setAvailHotel] = useState<any | null>(null);
  const [availForm, setAvailForm] = useState({ start_date: "", end_date: "", rooms_count: 30 });
  const [availSaving, setAvailSaving] = useState(false);

  useEffect(() => { fetchHotels(); }, []);

  async function fetchHotels() {
    setLoading(true);
    const { data } = await supabase.from("hotel_offers").select("*").order("created_at", { ascending: false });
    setHotels(data || []);
    setLoading(false);
  }

  function openCreate() {
    setForm(EMPTY_HOTEL); setEditingHotel(null); setError(null); setShowForm(true);
  }

  function openEdit(hotel: any) {
    setForm({ ...hotel }); setEditingHotel(hotel); setError(null); setShowForm(true);
  }

  async function saveHotel() {
    setSaving(true); setError(null);
    try {
      const payload = { ...form, price_per_night: parseFloat(form.price_per_night), rooms_total: parseInt(form.rooms_total), rooms_available: parseInt(form.rooms_available), star_rating: parseInt(form.star_rating), taxes_percent: parseFloat(form.taxes_percent), cancellation_hours: parseInt(form.cancellation_hours), currency: "EGP" };
      if (!payload.slug) payload.slug = payload.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      let err;
      if (editingHotel) {
        ({ error: err } = await supabase.from("hotel_offers").update(payload).eq("id", editingHotel.id));
      } else {
        ({ error: err } = await supabase.from("hotel_offers").insert(payload));
      }
      if (err) throw err;
      setShowForm(false); fetchHotels();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function toggleEnabled(id: string, current: boolean) {
    await supabase.from("hotel_offers").update({ enabled: !current }).eq("id", id);
    fetchHotels();
  }

  async function saveAvailability() {
    if (!availHotel || !availForm.start_date || !availForm.end_date) return;
    setAvailSaving(true);
    try {
      const start = new Date(availForm.start_date);
      const end = new Date(availForm.end_date);
      const rows = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        for (const rt of ["standard", "deluxe", "suite"]) {
          rows.push({ hotel_id: availHotel.id, date: d.toISOString().split("T")[0], room_type: rt, rooms_left: availForm.rooms_count });
        }
      }
      const { error } = await supabase.from("hotel_room_availability").upsert(rows, { onConflict: "hotel_id,date,room_type" });
      if (error) throw error;
      setShowAvailDialog(false);
      alert("تم تحديث الغرف المتاحة بنجاح");
    } catch (e: any) { alert(e.message); }
    finally { setAvailSaving(false); }
  }

  const filtered = hotels.filter(h => !search || `${h.name} ${h.city}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">إدارة الفنادق</h1>
          <p className="text-sm text-text-muted mt-0.5">{hotels.length} فندق مسجل</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 rounded-xl bg-brand-green text-white text-sm font-bold hover:bg-brand-green-dark transition-all">+ فندق جديد</button>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو المدينة..."
        className="w-full h-10 px-4 rounded-xl border border-border-default text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-brand-green/30" />

      <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light bg-muted/50">
                {["الفندق", "المدينة", "النجوم", "الغرف", "السعر/ليلة", "الحالة", "إجراءات"].map(h => (
                  <th key={h} className="text-right px-4 py-3 font-semibold text-text-secondary">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border-light animate-pulse">
                    {Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded" /></td>)}
                  </tr>
                ))
              ) : filtered.map((h: any) => (
                <tr key={h.id} className="border-b border-border-light hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-bold text-text-primary">{h.name}</p>
                    {h.is_featured && <span className="text-xs text-brand-yellow font-medium">★ مميز</span>}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{h.city}</td>
                  <td className="px-4 py-3">{"★".repeat(h.star_rating)}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-brand-green">{h.rooms_available}</span>
                    <span className="text-text-muted">/{h.rooms_total}</span>
                  </td>
                  <td className="px-4 py-3 font-bold text-brand-green">{parseFloat(h.price_per_night)?.toLocaleString()} ج.م</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${h.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {h.enabled ? "مفعّل" : "معطّل"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 flex-wrap">
                      <button onClick={() => openEdit(h)} className="px-2.5 py-1 rounded-lg bg-muted text-text-secondary text-xs hover:bg-border-default transition-all">تعديل</button>
                      <button onClick={() => { setAvailHotel(h); setAvailForm({ start_date: "", end_date: "", rooms_count: 30 }); setShowAvailDialog(true); }}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs hover:bg-blue-100 transition-all">غرف</button>
                      <button onClick={() => toggleEnabled(h.id, h.enabled)}
                        className={`px-2.5 py-1 rounded-lg text-xs transition-all ${h.enabled ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
                        {h.enabled ? "تعطيل" : "تفعيل"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hotel Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editingHotel ? "تعديل فندق" : "فندق جديد"}</h3>
              <button onClick={() => setShowForm(false)} className="text-text-muted hover:text-text-primary text-xl">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "اسم الفندق", field: "name" }, { label: "الـ Slug (URL)", field: "slug" },
                { label: "المدينة", field: "city" }, { label: "الدولة", field: "country" },
                { label: "العنوان", field: "address" }, { label: "سعر الليلة (ج.م)", field: "price_per_night", type: "number" },
                { label: "نسبة الضريبة %", field: "taxes_percent", type: "number" }, { label: "ساعات الإلغاء المجاني", field: "cancellation_hours", type: "number" },
                { label: "عدد الغرف الكلي", field: "rooms_total", type: "number" }, { label: "الغرف المتاحة", field: "rooms_available", type: "number" },
                { label: "وقت الاستلام", field: "check_in_time" }, { label: "وقت التسليم", field: "check_out_time" },
              ].map(({ label, field, type = "text" }) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-text-muted mb-1">{label}</label>
                  <input type={type} value={form[field]}
                    onChange={e => setForm((f: any) => ({ ...f, [field]: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">تصنيف النجوم</label>
                <select value={form.star_rating} onChange={e => setForm((f: any) => ({ ...f, star_rating: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30">
                  {[3,4,5].map(n => <option key={n} value={n}>{"★".repeat(n)}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-text-muted mb-1">الوصف (عربي)</label>
                <textarea rows={2} value={form.description_ar} onChange={e => setForm((f: any) => ({ ...f, description_ar: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 resize-none" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-text-muted mb-1">الوصف (إنجليزي)</label>
                <textarea rows={2} value={form.description_en} onChange={e => setForm((f: any) => ({ ...f, description_en: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 resize-none" />
              </div>
              <div className="flex items-center gap-4 col-span-2 pt-1">
                {[["is_featured","مميز"], ["is_public","ظاهر للعملاء"], ["enabled","مفعّل"]].map(([f, l]) => (
                  <label key={f} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form[f]} onChange={e => setForm((prev: any) => ({ ...prev, [f]: e.target.checked }))} className="rounded" />
                    {l}
                  </label>
                ))}
              </div>
            </div>
            {error && <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-border-default text-sm text-text-secondary hover:bg-muted transition-all">إلغاء</button>
              <button onClick={saveHotel} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-brand-green text-white text-sm font-bold hover:bg-brand-green-dark transition-all disabled:opacity-60">
                {saving ? "جاري الحفظ..." : (editingHotel ? "حفظ التعديلات" : "إضافة الفندق")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Availability Dialog */}
      {showAvailDialog && availHotel && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-text-primary">تحديث الغرف المتاحة</h3>
              <button onClick={() => setShowAvailDialog(false)} className="text-text-muted">✕</button>
            </div>
            <p className="text-sm text-brand-green font-medium mb-4">{availHotel.name}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">من تاريخ</label>
                <input type="date" value={availForm.start_date} onChange={e => setAvailForm(f => ({ ...f, start_date: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">إلى تاريخ</label>
                <input type="date" value={availForm.end_date} onChange={e => setAvailForm(f => ({ ...f, end_date: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">عدد الغرف لكل نوع</label>
                <input type="number" value={availForm.rooms_count} onChange={e => setAvailForm(f => ({ ...f, rooms_count: parseInt(e.target.value) }))}
                  className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30" />
              </div>
            </div>
            <p className="text-xs text-text-muted mt-2">سيتم تحديث غرف (standard / deluxe / suite) لكل يوم في النطاق المحدد</p>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowAvailDialog(false)} className="flex-1 py-2.5 rounded-xl border border-border-default text-sm text-text-secondary hover:bg-muted transition-all">إلغاء</button>
              <button onClick={saveAvailability} disabled={availSaving} className="flex-1 py-2.5 rounded-xl bg-brand-green text-white text-sm font-bold disabled:opacity-60">
                {availSaving ? "جاري الحفظ..." : "حفظ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}