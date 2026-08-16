"use client";

/**
 * /admin/hotels/[id]
 * Hotel detail — info summary + rooms table with inline add/delete.
 */

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Hotel {
  id: string; name: string; stars: number | null; country: string; city: string;
  address: string | null; google_maps_url: string | null; amenities: string[];
  check_in_time: string | null; check_out_time: string | null;
  cancellation_policy: string | null; booking_conditions: string | null;
  is_active: boolean; cover_image: string | null; description: string | null;
}
interface Room {
  id: string; hotel_id: string; room_type: string; board_type: string;
  price_per_night: number; currency: string; max_occupancy: number;
  description: string | null; is_available: boolean; created_at: string;
}

const BOARD_LABELS: Record<string, string> = {
  room_only: "غرفة فقط", bed_breakfast: "إفطار", half_board: "نصف إقامة", full_board: "إقامة كاملة",
};
const AMENITY_LABELS: Record<string, string> = {
  pool: "مسبح", wifi: "واي-فاي", gym: "جيم", parking: "موقف", restaurant: "مطعم", airport_transfer: "نقل مطار",
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

// ─── Add room form (inline) ───────────────────────────────────────────────────
interface RoomFormData {
  room_type: string; board_type: string; price_per_night: string;
  currency: string; max_occupancy: string; description: string; is_available: boolean;
}
const EMPTY_ROOM: RoomFormData = {
  room_type: "", board_type: "room_only", price_per_night: "",
  currency: "EGP", max_occupancy: "2", description: "", is_available: true,
};

function AddRoomRow({ hotelId, onAdded }: { hotelId: string; onAdded: (r: Room) => void }) {
  const [form, setForm] = useState<RoomFormData>(EMPTY_ROOM);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const iCls = "h-9 px-2 border border-border-light rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-green/50 bg-white w-full";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.room_type || !form.price_per_night) return;
    setSaving(true);
    const res = await apiFetch(`/api/admin/hotels/${hotelId}/rooms`, {
      method: "POST",
      body: JSON.stringify({
        room_type: form.room_type, board_type: form.board_type,
        price_per_night: Number(form.price_per_night), currency: form.currency,
        max_occupancy: Number(form.max_occupancy) || 2,
        description: form.description || null, is_available: form.is_available,
      }),
    });
    setSaving(false);
    if (res.success) { onAdded(res.data); setForm(EMPTY_ROOM); setOpen(false); }
  }

  if (!open) {
    return (
      <tr>
        <td colSpan={7} className="px-4 py-3 border-t border-dashed border-border-light">
          <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-xs text-brand-green font-semibold hover:underline">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            إضافة غرفة
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="bg-brand-green/5">
      <td colSpan={7} className="px-4 py-3">
        <form onSubmit={submit} className="flex flex-wrap gap-2 items-end">
          <div className="flex flex-col gap-1 w-32">
            <label className="text-[10px] font-semibold text-text-muted">نوع الغرفة *</label>
            <input value={form.room_type} onChange={e => setForm(p => ({ ...p, room_type: e.target.value }))} placeholder="Standard" className={iCls} required />
          </div>
          <div className="flex flex-col gap-1 w-36">
            <label className="text-[10px] font-semibold text-text-muted">نظام الإقامة *</label>
            <select value={form.board_type} onChange={e => setForm(p => ({ ...p, board_type: e.target.value }))} className={iCls}>
              {Object.entries(BOARD_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1 w-24">
            <label className="text-[10px] font-semibold text-text-muted">السعر/ليلة *</label>
            <input type="number" min={0} value={form.price_per_night} onChange={e => setForm(p => ({ ...p, price_per_night: e.target.value }))} placeholder="0" className={iCls} required />
          </div>
          <div className="flex flex-col gap-1 w-20">
            <label className="text-[10px] font-semibold text-text-muted">العملة</label>
            <select value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} className={iCls}>
              <option value="EGP">EGP</option><option value="USD">USD</option><option value="EUR">EUR</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 w-20">
            <label className="text-[10px] font-semibold text-text-muted">الحد الأقصى</label>
            <input type="number" min={1} max={10} value={form.max_occupancy} onChange={e => setForm(p => ({ ...p, max_occupancy: e.target.value }))} className={iCls} />
          </div>
          <div className="flex gap-2 items-center h-9">
            <button type="submit" disabled={saving} className="h-9 px-4 bg-brand-green text-white text-xs font-bold rounded-lg hover:bg-brand-green-dark transition disabled:opacity-50">
              {saving ? "…" : "إضافة"}
            </button>
            <button type="button" onClick={() => { setOpen(false); setForm(EMPTY_ROOM); }} className="h-9 px-3 border border-border-light text-xs rounded-lg hover:bg-bg-alt transition">
              إلغاء
            </button>
          </div>
        </form>
      </td>
    </tr>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function HotelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [hotel, setHotel]   = useState<Hotel | null>(null);
  const [rooms, setRooms]   = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteRoomId, setDeleteRoomId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch(`/api/admin/hotels/${id}`);
    if (res.success) { setHotel(res.data); setRooms(res.data.hotel_rooms ?? []); }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function deleteRoom(roomId: string) {
    await apiFetch(`/api/admin/hotels/${id}/rooms/${roomId}`, { method: "DELETE" });
    setRooms(p => p.filter(r => r.id !== roomId));
    setDeleteRoomId(null);
  }

  async function toggleRoomAvail(room: Room) {
    const res = await apiFetch(`/api/admin/hotels/${id}/rooms/${room.id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_available: !room.is_available }),
    });
    if (res.success) setRooms(p => p.map(r => r.id === room.id ? res.data : r));
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!hotel) return (
    <div className="text-center py-20 text-text-muted">
      <p className="font-semibold">الفندق غير موجود</p>
      <Link href="/admin/hotels" className="text-brand-green text-sm hover:underline mt-2 inline-block">← العودة للفنادق</Link>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Link href="/admin/hotels" className="hover:text-brand-green transition">الفنادق</Link>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        <span className="text-text-primary font-semibold">{hotel.name}</span>
      </div>

      {/* Hotel info card */}
      <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-0">
          {/* Cover */}
          <div className="sm:w-48 h-36 sm:h-auto bg-bg-alt shrink-0 overflow-hidden">
            {hotel.cover_image ? (
              <img src={hotel.cover_image} alt={hotel.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-muted/30">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
              </div>
            )}
          </div>
          {/* Info */}
          <div className="p-5 flex-1 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-lg font-bold text-text-primary">{hotel.name}</h1>
                <p className="text-sm text-text-muted">{hotel.city}، {hotel.country}</p>
                {hotel.stars && (
                  <div className="flex gap-0.5 mt-1">
                    {Array.from({ length: hotel.stars }).map((_, i) => (
                      <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    ))}
                  </div>
                )}
              </div>
              <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full shrink-0", hotel.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")}>
                {hotel.is_active ? "نشط" : "مخفي"}
              </span>
            </div>
            {/* Details grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {hotel.check_in_time && (
                <div><p className="text-text-muted">وصول</p><p className="font-semibold text-text-primary">{hotel.check_in_time}</p></div>
              )}
              {hotel.check_out_time && (
                <div><p className="text-text-muted">مغادرة</p><p className="font-semibold text-text-primary">{hotel.check_out_time}</p></div>
              )}
              {rooms.length > 0 && (
                <div><p className="text-text-muted">الغرف</p><p className="font-semibold text-text-primary">{rooms.length} نوع</p></div>
              )}
              {hotel.google_maps_url && (
                <div>
                  <a href={hotel.google_maps_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-brand-green font-semibold hover:underline">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    الموقع
                  </a>
                </div>
              )}
            </div>
            {/* Amenities */}
            {((hotel.amenities as string[]).length > 0) && (
              <div className="flex flex-wrap gap-1.5">
                {(hotel.amenities as string[]).map(a => (
                  <span key={a} className="text-[11px] bg-bg-alt text-text-secondary px-2 py-0.5 rounded-full font-medium">{AMENITY_LABELS[a] ?? a}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rooms table */}
      <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border-light flex items-center justify-between">
          <h2 className="font-bold text-text-primary text-sm">أنواع الغرف ({rooms.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg-alt text-xs text-text-muted font-semibold border-b border-border-light">
                <th className="text-right px-4 py-2.5">نوع الغرفة</th>
                <th className="text-right px-4 py-2.5">نظام الإقامة</th>
                <th className="text-right px-4 py-2.5">السعر/ليلة</th>
                <th className="text-right px-4 py-2.5">الحد الأقصى</th>
                <th className="text-right px-4 py-2.5">التوفر</th>
                <th className="text-right px-4 py-2.5">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {rooms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-text-muted text-sm">لا توجد غرف مضافة بعد</td>
                </tr>
              ) : (
                rooms.map(room => (
                  <tr key={room.id} className="hover:bg-bg-alt/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-text-primary">{room.room_type}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{BOARD_LABELS[room.board_type] ?? room.board_type}</td>
                    <td className="px-4 py-3 font-semibold text-text-primary">{room.price_per_night.toLocaleString("ar-EG")} {room.currency}</td>
                    <td className="px-4 py-3 text-text-secondary">{room.max_occupancy} أشخاص</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleRoomAvail(room)}
                        className={cn("text-xs font-semibold px-2.5 py-1 rounded-full transition",
                          room.is_available ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        )}
                      >
                        {room.is_available ? "متاح" : "غير متاح"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setDeleteRoomId(room.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
              {/* Add room inline row */}
              <AddRoomRow hotelId={id} onAdded={r => setRooms(p => [...p, r])} />
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete room confirm */}
      {deleteRoomId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" dir="rtl">
          <div className="bg-white rounded-2xl p-6 w-72 space-y-4 shadow-xl">
            <p className="text-sm text-text-primary">هل تريد حذف هذا النوع من الغرف؟</p>
            <div className="flex gap-3">
              <button onClick={() => deleteRoom(deleteRoomId)} className="flex-1 h-10 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition">حذف</button>
              <button onClick={() => setDeleteRoomId(null)} className="flex-1 h-10 border border-border-light text-sm rounded-xl hover:bg-bg-alt transition">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
