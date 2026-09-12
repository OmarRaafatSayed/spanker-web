"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const EMPTY_FLIGHT = {
  airline: "", flight_number: "", aircraft_type: "",
  origin_iata: "", origin_city: "", destination_iata: "", destination_city: "",
  departure_at: "", arrival_at: "",
  class: "economy", seats_total: 150, seats_available: 150,
  base_price: "", taxes_amount: "", baggage_kg: 23, refundable: true,
  is_public: true, enabled: true,
};

export default function AdminFlightsPage() {
  const supabase = createClient();
  const [flights, setFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFlight, setEditingFlight] = useState<any | null>(null);
  const [form, setForm] = useState<any>(EMPTY_FLIGHT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => { fetchFlights(); }, []);

  async function fetchFlights() {
    setLoading(true);
    const { data } = await supabase.from("flights").select("*").order("departure_at", { ascending: true });
    setFlights(data || []);
    setLoading(false);
  }

  function openCreate() {
    setForm(EMPTY_FLIGHT); setEditingFlight(null);
    setError(null); setShowForm(true);
  }

  function openEdit(flight: any) {
    const f = { ...flight };
    f.departure_at = f.departure_at?.slice(0, 16) ?? "";
    f.arrival_at = f.arrival_at?.slice(0, 16) ?? "";
    setForm(f); setEditingFlight(flight); setError(null); setShowForm(true);
  }

  async function saveFlight() {
    setSaving(true); setError(null);
    try {
      const payload = {
        ...form,
        base_price: parseFloat(form.base_price),
        taxes_amount: parseFloat(form.taxes_amount),
        seats_total: parseInt(form.seats_total),
        seats_available: parseInt(form.seats_available),
        baggage_kg: parseInt(form.baggage_kg),
        external_source: "manual",
        currency: "EGP",
      };
      let err;
      if (editingFlight) {
        ({ error: err } = await supabase.from("flights").update(payload).eq("id", editingFlight.id));
      } else {
        ({ error: err } = await supabase.from("flights").insert(payload));
      }
      if (err) throw err;
      setShowForm(false); fetchFlights();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function toggleEnabled(id: string, current: boolean) {
    await supabase.from("flights").update({ is_active: !current }).eq("id", id);
    fetchFlights();
  }

  const filtered = flights.filter(f =>
    !search || `${f.airline} ${f.flight_number} ${f.origin_iata} ${f.destination_iata}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">إدارة الرحلات</h1>
          <p className="text-sm text-text-muted mt-0.5">{flights.length} رحلة مسجلة</p>
        </div>
        <button onClick={openCreate}
          className="px-4 py-2 rounded-xl bg-brand-green text-white text-sm font-bold hover:bg-brand-green-dark transition-all flex items-center gap-2">
          <span>+</span> رحلة جديدة
        </button>
      </div>

      {/* Search */}
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم، رقم الرحلة، المطار..."
        className="w-full h-10 px-4 rounded-xl border border-border-default text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-brand-green/30" />

      {/* Table */}
      <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light bg-muted/50">
                <th className="text-right px-4 py-3 font-semibold text-text-secondary">الرحلة</th>
                <th className="text-right px-4 py-3 font-semibold text-text-secondary">المسار</th>
                <th className="text-right px-4 py-3 font-semibold text-text-secondary">الموعد</th>
                <th className="text-right px-4 py-3 font-semibold text-text-secondary">الدرجة</th>
                <th className="text-right px-4 py-3 font-semibold text-text-secondary">المقاعد</th>
                <th className="text-right px-4 py-3 font-semibold text-text-secondary">السعر</th>
                <th className="text-right px-4 py-3 font-semibold text-text-secondary">الحالة</th>
                <th className="text-right px-4 py-3 font-semibold text-text-secondary">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border-light animate-pulse">
                    {Array.from({ length: 8 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded" /></td>)}
                  </tr>
                ))
              ) : filtered.map((f: any) => (
                <tr key={f.id} className="border-b border-border-light hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-bold text-text-primary">{f.airline}</p>
                    <p className="text-xs text-text-muted">{f.flight_number}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">{f.origin_iata} → {f.destination_iata}</td>
                  <td className="px-4 py-3 text-xs text-text-secondary">
                    {new Date(f.departure_at).toLocaleDateString("ar-EG")}
                    <br />{new Date(f.departure_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3">{f.class === "economy" ? "اقتصادية" : f.class === "business" ? "أعمال" : "أولى"}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${f.seats_available < 10 ? "text-red-600" : "text-brand-green"}`}>{f.seats_available}</span>
                    <span className="text-text-muted">/{f.seats_total}</span>
                  </td>
                  <td className="px-4 py-3 font-bold text-brand-green">{parseFloat(f.base_price).toLocaleString()} ج.م</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${f.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {f.enabled ? "مفعّل" : "معطّل"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button onClick={() => openEdit(f)} className="px-2.5 py-1 rounded-lg bg-muted text-text-secondary text-xs hover:bg-border-default transition-all">تعديل</button>
                      <button onClick={() => toggleEnabled(f.id, f.enabled)}
                        className={`px-2.5 py-1 rounded-lg text-xs transition-all ${f.enabled ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-700 hover:bg-green-100"}`}>
                        {f.enabled ? "تعطيل" : "تفعيل"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Flight Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text-primary">{editingFlight ? "تعديل رحلة" : "رحلة جديدة"}</h3>
              <button onClick={() => setShowForm(false)} className="text-text-muted hover:text-text-primary text-xl">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "شركة الطيران", field: "airline", type: "text" },
                { label: "رقم الرحلة", field: "flight_number", type: "text" },
                { label: "نوع الطائرة", field: "aircraft_type", type: "text" },
                { label: "مطار المغادرة (IATA)", field: "origin_iata", type: "text", upper: true },
                { label: "مدينة المغادرة", field: "origin_city", type: "text" },
                { label: "مطار الوصول (IATA)", field: "destination_iata", type: "text", upper: true },
                { label: "مدينة الوصول", field: "destination_city", type: "text" },
                { label: "وقت المغادرة", field: "departure_at", type: "datetime-local" },
                { label: "وقت الوصول", field: "arrival_at", type: "datetime-local" },
                { label: "إجمالي المقاعد", field: "seats_total", type: "number" },
                { label: "المقاعد المتاحة", field: "seats_available", type: "number" },
                { label: "السعر الأساسي (ج.م)", field: "base_price", type: "number" },
                { label: "الضرائب (ج.م)", field: "taxes_amount", type: "number" },
                { label: "الأمتعة (كجم)", field: "baggage_kg", type: "number" },
              ].map(({ label, field, type, upper }) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-text-muted mb-1">{label}</label>
                  <input type={type} value={form[field]}
                    onChange={e => setForm((f: any) => ({ ...f, [field]: upper ? e.target.value.toUpperCase() : e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">الدرجة</label>
                <select value={form.class} onChange={e => setForm((f: any) => ({ ...f, class: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30">
                  <option value="economy">اقتصادية</option>
                  <option value="business">أعمال</option>
                  <option value="first">أولى</option>
                </select>
              </div>
              <div className="flex items-center gap-4 pt-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.refundable} onChange={e => setForm((f: any) => ({ ...f, refundable: e.target.checked }))} className="rounded" />
                  قابل للاسترداد
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.is_public} onChange={e => setForm((f: any) => ({ ...f, is_public: e.target.checked }))} className="rounded" />
                  ظاهر للعملاء
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.enabled} onChange={e => setForm((f: any) => ({ ...f, enabled: e.target.checked }))} className="rounded" />
                  مفعّل
                </label>
              </div>
            </div>
            {error && <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-border-default text-sm text-text-secondary hover:bg-muted transition-all">إلغاء</button>
              <button onClick={saveFlight} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-brand-green text-white text-sm font-bold hover:bg-brand-green-dark transition-all disabled:opacity-60">
                {saving ? "جاري الحفظ..." : (editingFlight ? "حفظ التعديلات" : "إضافة الرحلة")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
