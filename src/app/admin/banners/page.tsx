"use client";

/**
 * /admin/banners
 * Wired to /api/admin/banners — three-zone layout with drag-to-reorder.
 * Hero zone shows a scaled live preview when editing.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

type Position = "hero" | "secondary" | "footer";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  position: Position;
  display_order: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
}

const POSITION_LABELS: Record<Position, string> = {
  hero:      "الهيرو الرئيسي",
  secondary: "ثانوي",
  footer:    "تذييل الصفحة",
};

const POSITION_COLORS: Record<Position, string> = {
  hero:      "bg-purple-50 border-purple-200",
  secondary: "bg-blue-50 border-blue-200",
  footer:    "bg-gray-50 border-gray-200",
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

// ─── Banner Form ──────────────────────────────────────────────────────────────
interface BannerFormProps {
  initial?: Partial<Banner>;
  onSave: (data: Partial<Banner>) => Promise<void>;
  onClose: () => void;
}

function BannerForm({ initial, onSave, onClose }: BannerFormProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Banner>>({
    title: "", subtitle: "", image_url: "", link_url: "",
    position: "secondary", display_order: 1,
    is_active: true, start_date: "", end_date: "",
    ...initial,
  });

  const iCls = "w-full h-10 px-3 border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green bg-white";
  const f = (k: keyof Banner, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.image_url) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  const showPreview = form.position === "hero" && form.image_url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" dir="rtl">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border-light px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
          <h2 className="font-bold text-text-primary">{initial?.id ? "تعديل البانر" : "إضافة بانر جديد"}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={submit} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">العنوان *</label>
            <input value={form.title ?? ""} onChange={e => f("title", e.target.value)} placeholder="عنوان البانر" className={iCls} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">العنوان الفرعي</label>
            <input value={form.subtitle ?? ""} onChange={e => f("subtitle", e.target.value || null)} placeholder="نص توضيحي" className={iCls} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-text-secondary mb-1">رابط الصورة *</label>
            <input value={form.image_url ?? ""} onChange={e => f("image_url", e.target.value)} placeholder="https://… أو /images/…" dir="ltr" className={iCls} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">رابط الإجراء</label>
            <input value={form.link_url ?? ""} onChange={e => f("link_url", e.target.value || null)} placeholder="/packages/dubai" dir="ltr" className={iCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">الموضع</label>
            <select value={form.position} onChange={e => f("position", e.target.value)} className={iCls}>
              <option value="hero">الهيرو الرئيسي</option>
              <option value="secondary">ثانوي</option>
              <option value="footer">تذييل الصفحة</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">ترتيب العرض</label>
            <input type="number" min={1} value={form.display_order ?? 1} onChange={e => f("display_order", Number(e.target.value))} className={iCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">تاريخ البداية</label>
            <input type="date" value={form.start_date?.slice(0, 10) ?? ""} onChange={e => f("start_date", e.target.value || null)} className={iCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">تاريخ الانتهاء</label>
            <input type="date" value={form.end_date?.slice(0, 10) ?? ""} onChange={e => f("end_date", e.target.value || null)} className={iCls} />
          </div>
          <div className="sm:col-span-2 flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={form.is_active ?? true} onChange={e => f("is_active", e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-green" />
            </label>
            <span className="text-sm text-text-secondary">ظاهر على الموقع</span>
          </div>

          {/* Hero preview */}
          {showPreview && (
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold text-text-secondary mb-2">معاينة الهيرو</p>
              <div className="relative w-full h-32 rounded-xl overflow-hidden border border-border-light">
                <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${form.image_url})` }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 right-4">
                  <p className="text-white font-bold text-sm">{form.title || "العنوان"}</p>
                  {form.subtitle && <p className="text-white/80 text-xs">{form.subtitle}</p>}
                </div>
              </div>
            </div>
          )}

          <div className="sm:col-span-2 flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 h-11 bg-brand-green text-white font-bold rounded-xl text-sm hover:bg-brand-green-dark transition disabled:opacity-50">
              {saving ? "جاري الحفظ..." : initial?.id ? "حفظ التغييرات" : "إضافة البانر"}
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

// ─── Draggable banner zone ────────────────────────────────────────────────────
function BannerZone({
  position, banners, onEdit, onDelete, onToggle, onReorder,
}: {
  position: Position;
  banners: Banner[];
  onEdit: (b: Banner) => void;
  onDelete: (b: Banner) => void;
  onToggle: (b: Banner) => void;
  onReorder: (updates: { id: string; display_order: number }[]) => void;
}) {
  const [items, setItems] = useState<Banner[]>(banners);
  const dragIdx           = useRef<number | null>(null);

  // Sync when parent banners change
  useEffect(() => { setItems(banners); }, [banners]);

  function onDragStart(i: number) { dragIdx.current = i; }

  function onDrop(targetIdx: number) {
    if (dragIdx.current === null || dragIdx.current === targetIdx) return;
    const reordered = [...items];
    const [moved]   = reordered.splice(dragIdx.current, 1);
    reordered.splice(targetIdx, 0, moved);
    dragIdx.current = null;
    setItems(reordered);
    onReorder(reordered.map((b, i) => ({ id: b.id, display_order: i + 1 })));
  }

  return (
    <div className={cn("rounded-2xl border p-4 space-y-3", POSITION_COLORS[position])}>
      <h3 className="font-bold text-text-primary text-sm flex items-center gap-2">
        <span>{POSITION_LABELS[position]}</span>
        <span className="text-xs font-normal text-text-muted">({items.length})</span>
      </h3>

      {items.length === 0 && (
        <p className="text-xs text-text-muted py-4 text-center border-2 border-dashed border-border-light rounded-xl">
          لا توجد بانرات في هذا القسم
        </p>
      )}

      {items.map((b, i) => (
        <div
          key={b.id}
          draggable
          onDragStart={() => onDragStart(i)}
          onDragOver={e => e.preventDefault()}
          onDrop={() => onDrop(i)}
          className={cn(
            "bg-white rounded-xl border overflow-hidden cursor-grab active:cursor-grabbing transition-shadow hover:shadow-sm",
            b.is_active ? "border-border-light" : "border-border-light opacity-60"
          )}
        >
          {/* Thumbnail */}
          <div className="h-24 relative overflow-hidden bg-bg-alt">
            <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${b.image_url})` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-2 right-2 left-2">
              <p className="text-white font-bold text-xs leading-tight truncate">{b.title}</p>
              {b.subtitle && <p className="text-white/75 text-[10px] truncate">{b.subtitle}</p>}
            </div>
            <span className={cn("absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full", b.is_active ? "bg-green-500 text-white" : "bg-gray-400 text-white")}>
              {b.is_active ? "نشط" : "مخفي"}
            </span>
            {/* Drag handle */}
            <div className="absolute top-2 right-2 text-white/60">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
            </div>
          </div>
          {/* Actions */}
          <div className="px-3 py-2 flex items-center justify-between">
            <span className="text-[10px] text-text-muted">ترتيب {b.display_order}</span>
            <div className="flex gap-1">
              <button onClick={() => onEdit(b)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition" title="تعديل">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button onClick={() => onToggle(b)} className={cn("p-1.5 rounded-lg transition", b.is_active ? "hover:bg-yellow-50 text-yellow-600" : "hover:bg-green-50 text-green-600")} title={b.is_active ? "إخفاء" : "تفعيل"}>
                {b.is_active
                  ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
              <button onClick={() => onDelete(b)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition" title="حذف">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminBannersPage() {
  const [banners, setBanners]     = useState<Banner[]>([]);
  const [loading, setLoading]     = useState(true);
  const [formOpen, setFormOpen]   = useState(false);
  const [editing, setEditing]     = useState<Banner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const [filterPos, setFilterPos] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    const params = filterPos !== "all" ? `?position=${filterPos}` : "";
    const res = await apiFetch(`/api/admin/banners${params}`);
    if (res.success) setBanners(res.data ?? []);
    setLoading(false);
  }, [filterPos]);

  useEffect(() => { load(); }, [load]);

  const byPosition = (pos: Position) =>
    banners.filter(b => b.position === pos).sort((a, b) => a.display_order - b.display_order);

  async function saveBanner(data: Partial<Banner>) {
    if (editing?.id) {
      const res = await apiFetch(`/api/admin/banners/${editing.id}`, { method: "PATCH", body: JSON.stringify(data) });
      if (res.success) setBanners(p => p.map(b => b.id === editing.id ? res.data : b));
    } else {
      const res = await apiFetch("/api/admin/banners", { method: "POST", body: JSON.stringify(data) });
      if (res.success) setBanners(p => [...p, res.data]);
    }
    setFormOpen(false);
    setEditing(null);
  }

  async function deleteBanner(id: string) {
    await apiFetch(`/api/admin/banners/${id}`, { method: "DELETE" });
    setBanners(p => p.filter(b => b.id !== id));
    setDeleteTarget(null);
  }

  async function toggleBanner(b: Banner) {
    const res = await apiFetch(`/api/admin/banners/${b.id}`, { method: "PATCH", body: JSON.stringify({ is_active: !b.is_active }) });
    if (res.success) setBanners(p => p.map(i => i.id === b.id ? res.data : i));
  }

  async function reorder(updates: { id: string; display_order: number }[]) {
    const res = await apiFetch("/api/admin/banners/reorder", { method: "PATCH", body: JSON.stringify({ updates }) });
    if (res.success) {
      // Merge updated display_orders
      const map = new Map((res.data as Array<{ id: string; display_order: number }>).map(u => [u.id, u.display_order]));
      setBanners(p => p.map(b => map.has(b.id) ? { ...b, display_order: map.get(b.id)! } : b));
    }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">البانرات</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {banners.length} بانر · {banners.filter(b => b.is_active).length} نشط
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="flex items-center gap-2 bg-brand-green text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-green-dark transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          بانر جديد
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {["all", "hero", "secondary", "footer"].map(pos => (
          <button key={pos} onClick={() => setFilterPos(pos)}
            className={cn("text-xs font-semibold px-3 py-1.5 rounded-full transition",
              filterPos === pos ? "bg-brand-green text-white" : "bg-white border border-border-light text-text-secondary hover:bg-bg-alt"
            )}>
            {pos === "all" ? "الكل" : POSITION_LABELS[pos as Position]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        /* Three-column zone layout */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["hero", "secondary", "footer"] as Position[])
            .filter(pos => filterPos === "all" || filterPos === pos)
            .map(pos => (
              <BannerZone
                key={pos}
                position={pos}
                banners={byPosition(pos)}
                onEdit={b => { setEditing(b); setFormOpen(true); }}
                onDelete={setDeleteTarget}
                onToggle={toggleBanner}
                onReorder={reorder}
              />
            ))}
        </div>
      )}

      {/* Modals */}
      {formOpen && (
        <BannerForm initial={editing ?? undefined} onSave={saveBanner} onClose={() => { setFormOpen(false); setEditing(null); }} />
      )}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" dir="rtl">
          <div className="bg-white rounded-2xl p-6 w-80 space-y-4 shadow-xl">
            <p className="text-sm text-text-primary">هل تريد حذف بانر <strong>{deleteTarget.title}</strong>؟</p>
            <div className="flex gap-3">
              <button onClick={() => deleteBanner(deleteTarget.id)} className="flex-1 h-10 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition">حذف</button>
              <button onClick={() => setDeleteTarget(null)} className="flex-1 h-10 border border-border-light text-sm rounded-xl hover:bg-bg-alt transition">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
