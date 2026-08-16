"use client";

/**
 * /admin/hotels
 * Hotels catalog — card grid, filter bar, create/edit modal.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Hotel {
  id: string;
  name: string;
  stars: number | null;
  country: string;
  city: string;
  address: string | null;
  is_active: boolean;
  cover_image: string | null;
  amenities: string[];
  check_in_time: string | null;
  check_out_time: string | null;
  cancellation_policy: string | null;
  booking_conditions: string | null;
  google_maps_url: string | null;
  description: string | null;
  created_at: string;
}

const AMENITY_LABELS: Record<string, string> = {
  pool: "مسبح", wifi: "واي-فاي", gym: "جيم",
  parking: "موقف", restaurant: "مطعم", airport_transfer: "نقل مطار",
};
const ALL_AMENITIES = Object.keys(AMENITY_LABELS);

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

// ─── Star picker ──────────────────────────────────────────────────────────────
function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)} className="focus:outline-none">
          <svg width="22" height="22" viewBox="0 0 24 24" fill={n <= value ? "#f59e0b" : "none"} stroke={n <= value ? "#f59e0b" : "#d1d5db"} strokeWidth="1.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      ))}
    </div>
  );
}

// ─── Hotel form modal ─────────────────────────────────────────────────────────
interface HotelFormProps {
  initial?: Partial<Hotel>;
  onSave: (data: Partial<Hotel>) => Promise<void>;
  onClose: () => void;
}

function HotelForm({ initial, onSave, onClose }: HotelFormProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Hotel>>({
    name: "", stars: 3, country: "", city: "", address: "",
    google_maps_url: "", description: "", amenities: [],
    check_in_time: "14:00", check_out_time: "12:00",
    cancellation_policy: "", booking_conditions: "", is_active: true,
    cover_image: "", ...initial,
  });

  const iCls = "w-full h-10 px-3 border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green bg-white";

  function set(k: keyof Hotel, v: unknown) { setForm(p => ({ ...p, [k]: v })); }

  function toggleAmenity(a: string) {
    const curr = (form.amenities ?? []) as string[];
    set("amenities", curr.includes(a) ? curr.filter(x => x !== a) : [...curr, a]);
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
          <h2 className="font-bold text-text-primary">{initial?.id ? "تعديل الفندق" : "إضافة فندق جديد"}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={submit} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-text-secondary mb-1">اسم الفندق *</label>
            <input value={form.name ?? ""} onChange={e => set("name", e.target.value)} className={iCls} required />
          </div>
          {/* Stars */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-2">التصنيف</label>
            <StarPicker value={form.stars ?? 3} onChange={n => set("stars", n)} />
          </div>
          <div className="flex items-center gap-3 pt-4">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={form.is_active ?? true} onChange={e => set("is_active", e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-green" />
            </label>
            <span className="text-sm text-text-secondary">نشط ومرئي</span>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">الدولة *</label>
            <input value={form.country ?? ""} onChange={e => set("country", e.target.value)} className={iCls} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">المدينة *</label>
            <input value={form.city ?? ""} onChange={e => set("city", e.target.value)} className={iCls} required />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-text-secondary mb-1">العنوان</label>
            <input value={form.address ?? ""} onChange={e => set("address", e.target.value)} className={iCls} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-text-secondary mb-1">رابط Google Maps</label>
            <input value={form.google_maps_url ?? ""} onChange={e => set("google_maps_url", e.target.value)} placeholder="https://maps.google.com/…" className={iCls} />
          </div>
          {/* Check in/out */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">وقت الوصول</label>
            <input type="time" value={form.check_in_time ?? "14:00"} onChange={e => set("check_in_time", e.target.value)} className={iCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">وقت المغادرة</label>
            <input type="time" value={form.check_out_time ?? "12:00"} onChange={e => set("check_out_time", e.target.value)} className={iCls} />
          </div>
          {/* Amenities */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-text-secondary mb-2">المرافق</label>
            <div className="flex flex-wrap gap-2">
              {ALL_AMENITIES.map(a => {
                const active = ((form.amenities ?? []) as string[]).includes(a);
                return (
                  <button key={a} type="button" onClick={() => toggleAmenity(a)}
                    className={cn("text-xs font-semibold px-3 py-1.5 rounded-full border transition",
                      active ? "bg-brand-green text-white border-brand-green" : "bg-white text-text-secondary border-border-light hover:border-brand-green"
                    )}>
                    {AMENITY_LABELS[a]}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Description */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-text-secondary mb-1">وصف الفندق</label>
            <textarea value={form.description ?? ""} onChange={e => set("description", e.target.value)} rows={3} className={cn(iCls, "h-auto py-2")} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-text-secondary mb-1">سياسة الإلغاء</label>
            <textarea value={form.cancellation_policy ?? ""} onChange={e => set("cancellation_policy", e.target.value)} rows={2} className={cn(iCls, "h-auto py-2")} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-text-secondary mb-1">شروط الحجز</label>
            <textarea value={form.booking_conditions ?? ""} onChange={e => set("booking_conditions", e.target.value)} rows={2} className={cn(iCls, "h-auto py-2")} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-text-secondary mb-1">رابط صورة الغلاف</label>
            <input value={form.cover_image ?? ""} onChange={e => set("cover_image", e.target.value)} placeholder="https://…" className={iCls} />
          </div>
          {/* Submit */}
          <div className="sm:col-span-2 flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 h-11 bg-brand-green text-white font-bold rounded-xl text-sm hover:bg-brand-green-dark transition disabled:opacity-50">
              {saving ? "جاري الحفظ..." : initial?.id ? "حفظ التغييرات" : "إضافة الفندق"}
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

// ─── Hotel card ───────────────────────────────────────────────────────────────
function HotelCard({ hotel, onEdit, onDelete, onToggle }: {
  hotel: Hotel;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  return (
    <div className={cn("bg-white rounded-2xl border overflow-hidden flex flex-col transition-shadow hover:shadow-md", hotel.is_active ? "border-border-light" : "border-gray-200 opacity-70")}>
      {/* Cover image */}
      <div className="relative h-36 bg-bg-alt overflow-hidden">
        {hotel.cover_image ? (
          <img src={hotel.cover_image} alt={hotel.name} className="w-full h-full object-cover" onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted/30">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
        )}
        {/* Status badge */}
        <span className={cn("absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full", hotel.is_active ? "bg-green-500 text-white" : "bg-gray-400 text-white")}>
          {hotel.is_active ? "نشط" : "مخفي"}
        </span>
        {/* Stars */}
        {hotel.stars && (
          <div className="absolute bottom-2 right-2 flex gap-0.5">
            {Array.from({ length: hotel.stars }).map((_, i) => (
              <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col gap-2">
        <h3 className="font-bold text-text-primary text-sm leading-tight">{hotel.name}</h3>
        <p className="text-xs text-text-muted">{hotel.city}، {hotel.country}</p>

        {/* Amenities */}
        {((hotel.amenities as string[]).length > 0) && (
          <div className="flex flex-wrap gap-1">
            {(hotel.amenities as string[]).slice(0, 4).map(a => (
              <span key={a} className="text-[10px] bg-bg-alt text-text-muted px-1.5 py-0.5 rounded-full">{AMENITY_LABELS[a] ?? a}</span>
            ))}
            {(hotel.amenities as string[]).length > 4 && (
              <span className="text-[10px] text-text-muted">+{(hotel.amenities as string[]).length - 4}</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-2 border-t border-border-light">
          <Link href={`/admin/hotels/${hotel.id}`} className="flex-1 h-8 flex items-center justify-center text-xs font-semibold bg-bg-alt hover:bg-gray-100 rounded-lg transition text-text-secondary">
            الغرف
          </Link>
          <button onClick={onEdit} className="flex-1 h-8 flex items-center justify-center text-xs font-semibold border border-border-light hover:bg-bg-alt rounded-lg transition text-text-secondary">
            تعديل
          </button>
          <button onClick={onToggle} className={cn("h-8 px-2 flex items-center justify-center text-xs font-semibold rounded-lg transition",
            hotel.is_active ? "text-yellow-600 hover:bg-yellow-50" : "text-green-600 hover:bg-green-50"
          )}>
            {hotel.is_active ? "إخفاء" : "تفعيل"}
          </button>
          <button onClick={onDelete} className="h-8 px-2 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminHotelsPage() {
  const [hotels, setHotels]       = useState<Hotel[]>([]);
  const [loading, setLoading]     = useState(true);
  const [formOpen, setFormOpen]   = useState(false);
  const [editing, setEditing]     = useState<Hotel | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Hotel | null>(null);
  const [filterCountry, setFilterCountry] = useState("");
  const [filterCity, setFilterCity]       = useState("");
  const [filterStars, setFilterStars]     = useState("0");
  const [filterActive, setFilterActive]   = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterCountry) params.set("country", filterCountry);
    if (filterCity)    params.set("city", filterCity);
    if (filterStars !== "0") params.set("stars", filterStars);
    if (filterActive !== "all") params.set("active", filterActive);
    const res = await apiFetch(`/api/admin/hotels?${params}`);
    if (res.success) setHotels(res.data ?? []);
    setLoading(false);
  }, [filterCountry, filterCity, filterStars, filterActive]);

  useEffect(() => { load(); }, [load]);

  async function saveHotel(data: Partial<Hotel>) {
    if (editing?.id) {
      const res = await apiFetch(`/api/admin/hotels/${editing.id}`, { method: "PATCH", body: JSON.stringify(data) });
      if (res.success) setHotels(p => p.map(h => h.id === editing.id ? res.data : h));
    } else {
      const res = await apiFetch("/api/admin/hotels", { method: "POST", body: JSON.stringify(data) });
      if (res.success) setHotels(p => [res.data, ...p]);
    }
    setFormOpen(false);
    setEditing(null);
  }

  async function deleteHotel(id: string) {
    await apiFetch(`/api/admin/hotels/${id}`, { method: "DELETE" });
    setHotels(p => p.filter(h => h.id !== id));
    setDeleteTarget(null);
  }

  async function toggleActive(h: Hotel) {
    const res = await apiFetch(`/api/admin/hotels/${h.id}`, { method: "PATCH", body: JSON.stringify({ is_active: !h.is_active }) });
    if (res.success) setHotels(p => p.map(i => i.id === h.id ? res.data : i));
  }

  const iCls = "h-9 px-3 border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 bg-white";

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">الفنادق</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {hotels.length} فندق · {hotels.filter(h => h.is_active).length} نشط
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="flex items-center gap-2 bg-brand-green text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-green-dark transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          إضافة فندق
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white rounded-xl border border-border-light p-3">
        <input value={filterCountry} onChange={e => setFilterCountry(e.target.value)} placeholder="الدولة…" className={cn(iCls, "w-32")} />
        <input value={filterCity} onChange={e => setFilterCity(e.target.value)} placeholder="المدينة…" className={cn(iCls, "w-32")} />
        <select value={filterStars} onChange={e => setFilterStars(e.target.value)} className={cn(iCls, "w-36")}>
          <option value="0">كل التصنيفات</option>
          {[5,4,3,2,1].map(s => <option key={s} value={s}>{s} نجوم</option>)}
        </select>
        <select value={filterActive} onChange={e => setFilterActive(e.target.value)} className={cn(iCls, "w-32")}>
          <option value="all">الكل</option>
          <option value="true">نشط فقط</option>
          <option value="false">مخفي فقط</option>
        </select>
        <button onClick={load} className="h-9 px-4 bg-bg-alt border border-border-light rounded-lg text-sm font-semibold text-text-secondary hover:bg-gray-100 transition">تحديث</button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : hotels.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border-light flex flex-col items-center justify-center py-20 text-text-muted">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-40"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <p className="font-semibold">لا توجد فنادق</p>
          <p className="text-sm mt-1">أضف أول فندق أو غيّر الفلاتر</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {hotels.map(h => (
            <HotelCard
              key={h.id}
              hotel={h}
              onEdit={() => { setEditing(h); setFormOpen(true); }}
              onDelete={() => setDeleteTarget(h)}
              onToggle={() => toggleActive(h)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {formOpen && (
        <HotelForm initial={editing ?? undefined} onSave={saveHotel} onClose={() => { setFormOpen(false); setEditing(null); }} />
      )}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" dir="rtl">
          <div className="bg-white rounded-2xl p-6 w-80 space-y-4 shadow-xl">
            <p className="text-sm text-text-primary">هل تريد حذف فندق <strong>{deleteTarget.name}</strong>؟ سيتم حذف جميع الغرف المرتبطة به.</p>
            <div className="flex gap-3">
              <button onClick={() => deleteHotel(deleteTarget.id)} className="flex-1 h-10 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition">تأكيد الحذف</button>
              <button onClick={() => setDeleteTarget(null)} className="flex-1 h-10 border border-border-light text-sm rounded-xl hover:bg-bg-alt transition">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
