"use client";

/**
 * /admin/packages — Complete Trips Management
 * All DB operations go through /api/admin/packages (service role, bypasses RLS).
 * NO direct Supabase client calls from browser — fixes 403 RLS errors.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Map, Plus, Search, Upload, RefreshCw, Edit,
  Power, Trash2, X, Check, AlertTriangle, Calendar,
  Users, ChevronDown, ChevronUp, Plane, Flag, FileSpreadsheet,
  Info, CheckCircle2, XCircle, Loader2, Eye, Star,
} from "lucide-react";

// ─── Meta pack/unpack ─────────────────────────────────────────────────────────

const META_PREFIX = "__meta__:";

interface TripMeta {
  title_ar: string; title_en: string; slug: string;
  difficulty: "easy" | "moderate" | "hard";
  meeting_point: string; image_url: string; is_domestic: boolean;
  tags: string[]; includes_raw: string; excludes_raw: string;
  itinerary_raw: string; cancellation_days: number;
}

const DEFAULT_META: TripMeta = {
  title_ar: "", title_en: "", slug: "", difficulty: "easy",
  meeting_point: "", image_url: "", is_domestic: false, tags: [],
  includes_raw: "", excludes_raw: "", itinerary_raw: "", cancellation_days: 7,
};

function packDesc(meta: TripMeta, plain: string): string {
  return `${META_PREFIX}${JSON.stringify(meta)}\n${plain}`;
}

function unpackDesc(desc: string | null): { meta: TripMeta; plain: string } {
  if (!desc?.startsWith(META_PREFIX)) return { meta: { ...DEFAULT_META, title_ar: desc ?? "" }, plain: desc ?? "" };
  const nl = desc.indexOf("\n");
  const jsonStr = nl === -1 ? desc.slice(META_PREFIX.length) : desc.slice(META_PREFIX.length, nl);
  const plain = nl === -1 ? "" : desc.slice(nl + 1);
  try { return { meta: { ...DEFAULT_META, ...JSON.parse(jsonStr) }, plain }; }
  catch { return { meta: DEFAULT_META, plain: desc }; }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Trip {
  id: string; name: string; destination: string; description: string | null;
  duration_days: number; start_date: string; end_date: string;
  price_per_person: number | null; currency: string | null;
  available_spots: number; max_travelers: number | null;
  inclusions: string[] | null; exclusions: string[] | null;
  itinerary: { day: number; title: string; description: string }[] | null;
  is_active: boolean; is_public: boolean; created_at: string;
  meta: TripMeta; plain: string;
}

interface ImportStats { total: number; valid: number; inserted: number; failed: number; }
interface ValidationError { row: number; field: string; message: string; }

// ─── API helpers — all calls go through server routes (bypasses RLS) ──────────

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

// ─── Form State ───────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: "", title_ar: "", title_en: "", destination: "", country: "مصر",
  is_domestic: false, duration_days: "", start_date: "", end_date: "",
  price_per_person: "", currency: "EGP", available_spots: "20", max_travelers: "25",
  difficulty: "easy" as TripMeta["difficulty"], meeting_point: "",
  image_url: "", tags: "", description: "", cancellation_days: "7",
  includes_raw: "", excludes_raw: "", itinerary_raw: "",
  is_active: true, is_public: true,
};
type FormState = typeof EMPTY_FORM;

const EGYPT_DESTS = ["الأقصر والأسوان", "شرم الشيخ", "الغردقة", "مرسى علم", "سيوة", "سيناء", "الفيوم", "القاهرة التاريخية", "الإسكندرية"];
const INTL_DESTS  = ["دبي", "إسطنبول", "باريس", "لندن", "روما", "أمستردام", "برشلونة", "بودابست", "طوكيو"];

const DIFF_META: Record<string, { label: string; cls: string }> = {
  easy:     { label: "سهل",   cls: "bg-green-100 text-green-700" },
  moderate: { label: "متوسط", cls: "bg-yellow-100 text-yellow-700" },
  hard:     { label: "صعب",   cls: "bg-red-100 text-red-700" },
};

function autoSlug(v: string) {
  return v.toLowerCase().replace(/[\u0600-\u06FF\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminPackagesPage() {
  const [trips, setTrips]             = useState<Trip[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [filterType, setFilterType]   = useState<"all"|"domestic"|"international">("all");
  const [filterActive, setFilterActive] = useState<"all"|"active"|"inactive">("all");

  const [showForm, setShowForm]       = useState(false);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [form, setForm]               = useState<FormState>({ ...EMPTY_FORM });
  const [formTab, setFormTab]         = useState<"basic"|"itinerary"|"includes"|"preview">("basic");
  const [saving, setSaving]           = useState(false);
  const [formError, setFormError]     = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Trip | null>(null);
  const [deleting, setDeleting]       = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading]     = useState(false);
  const [importResult, setImportResult] = useState<{
    stats?: ImportStats; errors?: ValidationError[]; message?: string; fatalError?: string;
  } | null>(null);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Load via API (service role — bypasses RLS) ────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterActive !== "all") params.set("active", filterActive === "active" ? "true" : "false");
      params.set("limit", "100");
      const res = await apiFetch(`/api/admin/packages?${params}`);
      if (res.success) {
        const normalized = (res.data ?? []).map((t: Record<string, unknown>) => {
          const { meta, plain } = unpackDesc(t.description as string | null);
          return { ...t, meta, plain } as Trip;
        });
        setTrips(normalized);
      }
    } finally {
      setLoading(false);
    }
  }, [filterActive]);

  useEffect(() => { load(); }, [load]);

  // ── Client-side filter ──
  const filtered = trips.filter(t => {
    if (search) {
      const hay = `${t.meta.title_ar} ${t.name} ${t.destination}`.toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    if (filterType === "domestic"      && !t.meta.is_domestic) return false;
    if (filterType === "international" && t.meta.is_domestic)  return false;
    return true;
  });

  // ── Form helpers ──
  function setF(k: keyof FormState, v: unknown) { setForm(p => ({ ...p, [k]: v })); }

  function openCreate() {
    setForm({ ...EMPTY_FORM }); setEditingId(null); setFormError(null);
    setFormTab("basic"); setShowForm(true);
  }

  function openEdit(t: Trip) {
    setForm({
      name: t.name, title_ar: t.meta.title_ar || t.name, title_en: t.meta.title_en,
      destination: t.destination, country: t.meta.is_domestic ? "مصر" : t.destination,
      is_domestic: t.meta.is_domestic, duration_days: String(t.duration_days),
      start_date: t.start_date, end_date: t.end_date,
      price_per_person: t.price_per_person ? String(t.price_per_person) : "",
      currency: t.currency ?? "EGP", available_spots: String(t.available_spots),
      max_travelers: t.max_travelers ? String(t.max_travelers) : "25",
      difficulty: t.meta.difficulty, meeting_point: t.meta.meeting_point,
      image_url: t.meta.image_url, tags: t.meta.tags.join(", "), description: t.plain,
      cancellation_days: String(t.meta.cancellation_days || 7),
      includes_raw: t.meta.includes_raw || (t.inclusions ?? []).join("\n"),
      excludes_raw: t.meta.excludes_raw || (t.exclusions ?? []).join("\n"),
      itinerary_raw: t.meta.itinerary_raw || (t.itinerary
        ? t.itinerary.map(d => `يوم ${d.day}: ${d.title} - ${d.description}`).join("\n") : ""),
      is_active: t.is_active, is_public: t.is_public,
    });
    setEditingId(t.id); setFormError(null); setFormTab("basic"); setShowForm(true);
  }

  function buildPayload() {
    let itinerary: Trip["itinerary"] = null;
    if (form.itinerary_raw.trim()) {
      try { itinerary = JSON.parse(form.itinerary_raw); }
      catch {
        itinerary = form.itinerary_raw.trim().split("\n").filter(Boolean).map((line, i) => {
          const clean = line.replace(/^يوم\s*\d+\s*[::\-]\s*/i, "").trim();
          const dash = clean.indexOf(" - ");
          return { day: i + 1, title: dash !== -1 ? clean.slice(0, dash).trim() : clean, description: dash !== -1 ? clean.slice(dash + 3).trim() : "" };
        });
      }
    }
    const meta: TripMeta = {
      title_ar: form.title_ar, title_en: form.title_en,
      slug: autoSlug(form.title_en || form.title_ar) || `trip-${Date.now()}`,
      difficulty: form.difficulty, meeting_point: form.meeting_point,
      image_url: form.image_url, is_domestic: form.is_domestic,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      includes_raw: form.includes_raw, excludes_raw: form.excludes_raw,
      itinerary_raw: form.itinerary_raw, cancellation_days: Number(form.cancellation_days) || 7,
    };
    return {
      name: form.title_ar.trim(),
      destination: form.destination.trim(),
      description: packDesc(meta, form.description.trim()),
      duration_days: Number(form.duration_days) || Math.max(1, Math.ceil(
        (new Date(form.end_date).getTime() - new Date(form.start_date).getTime()) / 86400000)),
      start_date: form.start_date, end_date: form.end_date,
      price_per_person: Number(form.price_per_person),
      currency: form.currency,
      available_spots: Number(form.available_spots) || 20,
      max_travelers: Number(form.max_travelers) || 25,
      inclusions: form.includes_raw ? form.includes_raw.split("\n").map(l => l.trim()).filter(Boolean) : null,
      exclusions: form.excludes_raw ? form.excludes_raw.split("\n").map(l => l.trim()).filter(Boolean) : null,
      itinerary,
      is_active: form.is_active, is_public: form.is_public,
    };
  }

  // ── Save via API ──────────────────────────────────────────────────────────
  async function save() {
    if (!form.title_ar.trim())    { setFormError("العنوان بالعربية مطلوب"); return; }
    if (!form.destination.trim()) { setFormError("الوجهة مطلوبة"); return; }
    if (!form.start_date)         { setFormError("تاريخ البداية مطلوب"); return; }
    if (!form.end_date)           { setFormError("تاريخ النهاية مطلوب"); return; }
    if (!form.price_per_person || isNaN(Number(form.price_per_person))) {
      setFormError("السعر مطلوب"); return;
    }
    setSaving(true); setFormError(null);
    try {
      const payload = buildPayload();
      const res = editingId
        ? await apiFetch(`/api/admin/packages/${editingId}`, { method: "PATCH", body: JSON.stringify(payload) })
        : await apiFetch("/api/admin/packages", { method: "POST", body: JSON.stringify(payload) });
      if (!res.success) throw new Error(res.error ?? res.details ?? "فشل الحفظ");
      setShowForm(false); load();
    } catch (e: unknown) {
      setFormError((e as Error).message ?? "حدث خطأ");
    } finally { setSaving(false); }
  }

  // ── Toggle via API ────────────────────────────────────────────────────────
  async function toggle(id: string, field: "is_active" | "is_public", cur: boolean) {
    await apiFetch(`/api/admin/packages/${id}`, { method: "PATCH", body: JSON.stringify({ [field]: !cur }) });
    load();
  }

  // ── Delete via API ────────────────────────────────────────────────────────
  async function doDelete(id: string) {
    setDeleting(true);
    await apiFetch(`/api/admin/packages/${id}`, { method: "DELETE" });
    setDeleting(false); setDeleteTarget(null); load();
  }

  // ── Import via API ────────────────────────────────────────────────────────
  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setImportResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const token = getToken();
      const res = await fetch("/api/admin/trips/import", {
        method: "POST", body: fd,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (!json.success && !json.stats) {
        setImportResult({ fatalError: json.error ?? "فشل الاستيراد", errors: json.validation_errors });
      } else {
        setImportResult({ stats: json.stats, errors: json.validation_errors ?? [], message: json.message });
        if (json.stats?.inserted > 0) load();
      }
    } catch (err: unknown) {
      setImportResult({ fatalError: (err as Error).message });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function downloadTemplate() { window.open("/api/admin/trips/template", "_blank"); }

  const domestic = trips.filter(t => t.meta.is_domestic);
  const intl     = trips.filter(t => !t.meta.is_domestic);
  const iCls = "w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green bg-white text-gray-900 transition-colors";

  return (
    <div className="space-y-5 max-w-7xl" dir="rtl">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-text-primary flex items-center gap-2">
            <Map className="w-6 h-6 text-brand-green" /> إدارة الرحلات
          </h1>
          <div className="flex flex-wrap gap-3 mt-1 text-sm text-text-muted">
            <span className="flex items-center gap-1"><Flag className="w-3.5 h-3.5 text-green-600" />{domestic.length} داخلية</span>
            <span className="flex items-center gap-1"><Plane className="w-3.5 h-3.5 text-blue-600" />{intl.length} دولية</span>
            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5 text-brand-green" />{trips.filter(t => t.is_active).length} نشطة</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={downloadTemplate}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 transition-all">
            <FileSpreadsheet className="w-4 h-4" /> تحميل نموذج Excel
          </button>
          <label className={cn("flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border-default text-sm font-semibold cursor-pointer transition-all",
            uploading ? "opacity-60 pointer-events-none bg-muted" : "hover:bg-muted text-text-secondary")}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? "جاري الاستيراد..." : "استيراد Excel / CSV"}
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
          </label>
          <button onClick={load} className="p-2.5 rounded-xl border border-border-default hover:bg-muted transition-all">
            <RefreshCw className="w-4 h-4 text-text-secondary" />
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-green text-white text-sm font-bold hover:bg-brand-green-dark transition-all shadow-sm">
            <Plus className="w-4 h-4" /> رحلة جديدة
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl text-sm">
        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-blue-800">قبل الاستيراد — تحميل النموذج أولاً</p>
          <p className="text-blue-700 text-xs leading-relaxed mt-0.5">
            اضغط <strong>«تحميل نموذج Excel»</strong> للحصول على ملف جاهز بالأعمدة الصحيحة وورقة التعليمات.
            الأعمدة المطلوبة مميزة بـ <strong>*</strong>. الصفوف غير المكتملة تُتخطى مع تقرير الأخطاء.
          </p>
        </div>
      </div>

      {/* Import Result */}
      {importResult && (
        <div className={cn("rounded-2xl border p-4 space-y-3",
          importResult.fatalError ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {importResult.fatalError ? <XCircle className="w-5 h-5 text-red-600" /> : <CheckCircle2 className="w-5 h-5 text-green-600" />}
              <span className={cn("font-bold text-sm", importResult.fatalError ? "text-red-700" : "text-green-700")}>
                {importResult.fatalError ?? importResult.message}
              </span>
            </div>
            <button onClick={() => setImportResult(null)}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          {importResult.stats && (
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: "إجمالي", value: importResult.stats.total, cls: "bg-gray-100 text-gray-700" },
                { label: "صالح", value: importResult.stats.valid, cls: "bg-blue-100 text-blue-700" },
                { label: "تم إضافته", value: importResult.stats.inserted, cls: "bg-green-100 text-green-700" },
                { label: "فشل", value: importResult.stats.failed, cls: "bg-red-100 text-red-600" },
              ].map(s => (
                <div key={s.label} className={cn("rounded-xl p-2", s.cls)}>
                  <p className="text-lg font-black">{s.value}</p><p className="text-xs">{s.label}</p>
                </div>
              ))}
            </div>
          )}
          {(importResult.errors ?? []).length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer font-semibold text-red-700 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> {importResult.errors!.length} أخطاء تحقق
              </summary>
              <div className="space-y-1 mt-2 max-h-48 overflow-y-auto">
                {importResult.errors!.map((e, i) => (
                  <div key={i} className="bg-white border border-red-200 rounded-lg px-3 py-1.5 flex gap-2">
                    <span className="text-red-500 font-mono">صف {e.row}</span>
                    <span className="text-gray-500">|</span><span className="text-gray-600">{e.field}</span>
                    <span className="text-gray-500">|</span><span className="text-red-700">{e.message}</span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute top-1/2 right-3 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث بالاسم أو الوجهة..."
            className="w-full h-10 pr-9 pl-3 border border-border-default rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/30" />
        </div>
        <div className="flex gap-1 bg-muted p-1 rounded-xl">
          {([ { val: "all", label: "الكل" }, { val: "domestic", label: "🇪🇬 داخلية" }, { val: "international", label: "✈️ دولية" } ] as const).map(f => (
            <button key={f.val} onClick={() => setFilterType(f.val)}
              className={cn("text-xs font-semibold px-3 py-1.5 rounded-lg transition-all whitespace-nowrap",
                filterType === f.val ? "bg-white shadow-sm text-brand-green" : "text-text-muted hover:text-text-secondary")}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-muted p-1 rounded-xl">
          {([ { val: "all", label: "الكل" }, { val: "active", label: "نشطة" }, { val: "inactive", label: "مخفية" } ] as const).map(f => (
            <button key={f.val} onClick={() => setFilterActive(f.val)}
              className={cn("text-xs font-semibold px-3 py-1.5 rounded-lg transition-all",
                filterActive === f.val ? "bg-white shadow-sm text-brand-green" : "text-text-muted hover:text-text-secondary")}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trip cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-56 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Map className="w-14 h-14 mx-auto mb-3 text-text-muted opacity-30" />
          <p className="text-text-muted">لا توجد رحلات</p>
          <button onClick={openCreate} className="mt-4 text-sm text-brand-green font-bold hover:underline">+ أضف أول رحلة</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => {
            const isOpen = expandedId === t.id;
            const diff = DIFF_META[t.meta.difficulty] ?? DIFF_META.easy;
            return (
              <div key={t.id} className={cn("bg-white rounded-2xl border transition-all overflow-hidden flex flex-col",
                isOpen ? "border-brand-green shadow-lg" : "border-border-light hover:shadow-sm")}>
                {t.meta.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.meta.image_url} alt={t.meta.title_ar} className="w-full h-36 object-cover" />
                ) : (
                  <div className={cn("w-full h-28 flex items-center justify-center",
                    t.meta.is_domestic ? "bg-gradient-to-br from-green-800 to-green-600" : "bg-gradient-to-br from-blue-700 to-blue-500")}>
                    {t.meta.is_domestic ? <Flag className="w-9 h-9 text-white/50" /> : <Plane className="w-9 h-9 text-white/50" />}
                  </div>
                )}
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex gap-1.5 flex-wrap mb-2">
                    <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full",
                      t.meta.is_domestic ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700")}>
                      {t.meta.is_domestic ? "🇪🇬 داخلية" : "✈️ دولية"}
                    </span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                      t.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500")}>
                      {t.is_active ? "نشطة" : "مخفية"}
                    </span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", diff.cls)}>{diff.label}</span>
                  </div>
                  <h3 className="font-bold text-text-primary text-sm leading-snug mb-0.5">{t.meta.title_ar || t.name}</h3>
                  <p className="text-xs text-text-muted mb-2">{t.destination} · {t.duration_days} أيام</p>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-black text-brand-green">{(t.price_per_person ?? 0).toLocaleString()}</span>
                      <span className="text-xs text-text-muted mr-1">{t.currency ?? "EGP"} / شخص</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-text-muted">
                      <Users className="w-3 h-3" />{t.available_spots} مقعد
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-text-muted mb-3">
                    <Calendar className="w-3 h-3" />{t.start_date} → {t.end_date}
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <button onClick={() => openEdit(t)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition-all">
                      <Edit className="w-3 h-3" /> تعديل
                    </button>
                    <button onClick={() => toggle(t.id, "is_active", t.is_active)}
                      className={cn("flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-semibold transition-all",
                        t.is_active ? "bg-red-50 text-red-500 hover:bg-red-100" : "bg-green-50 text-green-700 hover:bg-green-100")}>
                      <Power className="w-3 h-3" />{t.is_active ? "إخفاء" : "تفعيل"}
                    </button>
                    <button onClick={() => setDeleteTarget(t)}
                      className="p-1.5 rounded-xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button onClick={() => setExpandedId(isOpen ? null : t.id)}
                    className="w-full flex items-center justify-center gap-1 mt-2 text-xs text-text-muted hover:text-text-secondary">
                    {isOpen ? <><ChevronUp className="w-3 h-3" /> إخفاء</> : <><ChevronDown className="w-3 h-3" /> تفاصيل</>}
                  </button>
                  {isOpen && (
                    <div className="mt-3 pt-3 border-t border-border-light space-y-2 text-xs text-text-secondary">
                      {t.meta.meeting_point && <p>📍 {t.meta.meeting_point}</p>}
                      {(t.inclusions ?? []).length > 0 && (
                        <div>
                          <p className="font-semibold text-green-700 mb-1">✓ يشمل</p>
                          {(t.inclusions ?? []).slice(0, 4).map((inc, i) => (
                            <div key={i} className="flex items-start gap-1"><Check className="w-3 h-3 text-green-600 mt-0.5 shrink-0" />{inc}</div>
                          ))}
                        </div>
                      )}
                      {t.meta.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {t.meta.tags.map(tag => <span key={tag} className="bg-brand-green/10 text-brand-green px-2 py-0.5 rounded-full">{tag}</span>)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8" dir="rtl">
            <div className="flex items-center justify-between p-5 border-b border-border-light">
              <div>
                <h3 className="text-lg font-black">{editingId ? "تعديل الرحلة" : "إضافة رحلة جديدة"}</h3>
                <p className="text-xs text-text-muted mt-0.5">أكمل جميع التبويبات لعرض احترافي</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-muted"><X className="w-5 h-5 text-text-muted" /></button>
            </div>
            <div className="flex gap-0.5 bg-muted p-1.5 mx-5 mt-4 rounded-xl">
              {([ { k: "basic", l: "المعلومات الأساسية" }, { k: "itinerary", l: "برنامج الرحلة" }, { k: "includes", l: "يشمل / لا يشمل" }, { k: "preview", l: "👁 معاينة" } ] as const).map(tab => (
                <button key={tab.k} onClick={() => setFormTab(tab.k)}
                  className={cn("flex-1 text-xs font-semibold py-2 rounded-lg transition-all whitespace-nowrap",
                    formTab === tab.k ? "bg-white shadow-sm text-brand-green" : "text-text-muted hover:text-text-secondary")}>
                  {tab.l}
                </button>
              ))}
            </div>
            <div className="p-5">
              {formTab === "basic" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-border-default">
                    <span className="text-sm text-text-secondary shrink-0">نوع الرحلة:</span>
                    <div className="flex gap-2">
                      {[ { val: false, label: "✈️ دولية", cls: "bg-blue-600 text-white border-blue-600" }, { val: true, label: "🇪🇬 داخلية (مصر)", cls: "bg-green-600 text-white border-green-600" } ].map(({ val, label, cls }) => (
                        <button key={String(val)} type="button" onClick={() => setF("is_domestic", val)}
                          className={cn("px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                            form.is_domestic === val ? cls : "bg-white text-text-secondary border-border-default hover:border-gray-400")}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <F label="العنوان بالعربية *">
                      <input value={form.title_ar} onChange={e => { setF("title_ar", e.target.value); if (!form.name) setF("name", e.target.value); }}
                        placeholder="الأقصر وأسوان — ٥ أيام" className={iCls} />
                    </F>
                    <F label="العنوان بالإنجليزية">
                      <input value={form.title_en} onChange={e => setF("title_en", e.target.value)} placeholder="Luxor & Aswan — 5 Days" className={iCls} />
                    </F>
                    <F label="الوجهة *">
                      <input list="dest-list" value={form.destination} onChange={e => setF("destination", e.target.value)} placeholder="الأقصر والأسوان" className={iCls} />
                      <datalist id="dest-list">{(form.is_domestic ? EGYPT_DESTS : INTL_DESTS).map(d => <option key={d} value={d} />)}</datalist>
                    </F>
                    <F label="مستوى الصعوبة">
                      <select value={form.difficulty} onChange={e => setF("difficulty", e.target.value as TripMeta["difficulty"])} className={iCls}>
                        <option value="easy">سهل</option><option value="moderate">متوسط</option><option value="hard">صعب</option>
                      </select>
                    </F>
                    <F label="تاريخ البداية *">
                      <input type="date" value={form.start_date} onChange={e => {
                        setF("start_date", e.target.value);
                        if (e.target.value && form.end_date) setF("duration_days", String(Math.ceil((new Date(form.end_date).getTime() - new Date(e.target.value).getTime()) / 86400000)));
                      }} className={iCls} />
                    </F>
                    <F label="تاريخ النهاية *">
                      <input type="date" value={form.end_date} onChange={e => {
                        setF("end_date", e.target.value);
                        if (form.start_date && e.target.value) setF("duration_days", String(Math.ceil((new Date(e.target.value).getTime() - new Date(form.start_date).getTime()) / 86400000)));
                      }} className={iCls} />
                    </F>
                    <F label="عدد الأيام">
                      <input type="number" min={1} value={form.duration_days} onChange={e => setF("duration_days", e.target.value)} placeholder="يُحسب تلقائياً" className={iCls} />
                    </F>
                    <F label="السعر / شخص *">
                      <div className="flex gap-2">
                        <input type="number" min={0} value={form.price_per_person} onChange={e => setF("price_per_person", e.target.value)} placeholder="9800" className={cn(iCls, "flex-1")} />
                        <select value={form.currency} onChange={e => setF("currency", e.target.value)} className="h-10 px-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none w-20">
                          <option value="EGP">EGP</option><option value="USD">USD</option><option value="EUR">EUR</option>
                        </select>
                      </div>
                    </F>
                    <F label="المقاعد المتاحة">
                      <input type="number" min={1} value={form.available_spots} onChange={e => setF("available_spots", e.target.value)} className={iCls} />
                    </F>
                    <F label="أيام الإلغاء المجاني">
                      <input type="number" min={0} value={form.cancellation_days} onChange={e => setF("cancellation_days", e.target.value)} className={iCls} />
                    </F>
                    <F label="نقطة التجمع">
                      <input value={form.meeting_point} onChange={e => setF("meeting_point", e.target.value)} placeholder="مطار القاهرة — صالة 2" className={iCls} />
                    </F>
                    <F label="رابط صورة الغلاف">
                      <div className="flex gap-2">
                        <input value={form.image_url} onChange={e => setF("image_url", e.target.value)} placeholder="https://..." className={cn(iCls, "flex-1")} />
                        {form.image_url && <img src={form.image_url} alt="" className="w-10 h-10 rounded-lg object-cover border shrink-0" />}
                      </div>
                    </F>
                    <F label="الكلمات الدلالية" className="sm:col-span-2">
                      <input value={form.tags} onChange={e => setF("tags", e.target.value)} placeholder="ثقافية, عائلية (مفصولة بفاصلة)" className={iCls} />
                    </F>
                    <F label="الوصف" className="sm:col-span-2">
                      <textarea rows={3} value={form.description} onChange={e => setF("description", e.target.value)} placeholder="وصف تسويقي جذاب..." className={cn(iCls, "h-auto resize-none")} />
                    </F>
                    <div className="sm:col-span-2 flex flex-wrap gap-5 p-3 bg-muted/40 rounded-xl">
                      {([ { field: "is_active" as const, label: "نشطة (يمكن الحجز)" }, { field: "is_public" as const, label: "ظاهرة للعملاء" } ]).map(({ field, label }) => (
                        <label key={field} className="flex items-center gap-2.5 cursor-pointer">
                          <div className={cn("w-10 h-5 rounded-full relative transition-colors shrink-0", form[field] ? "bg-brand-green" : "bg-gray-300")} onClick={() => setF(field, !form[field])}>
                            <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all", form[field] ? "right-0.5" : "left-0.5")} />
                          </div>
                          <span className="text-sm font-medium text-text-secondary">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {formTab === "itinerary" && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-700 space-y-1">
                    <p className="font-bold">📋 سطر لكل يوم:</p>
                    <code className="block bg-white/60 px-2 py-1 rounded">يوم 1: الوصول والاستقبال - نقل للفندق وراحة</code>
                  </div>
                  <F label="برنامج الرحلة اليومي">
                    <textarea rows={14} value={form.itinerary_raw} onChange={e => setF("itinerary_raw", e.target.value)}
                      placeholder={"يوم 1: الوصول - نقل للفندق\nيوم 2: معبد الكرنك\nيوم 3: وادي الملوك\nيوم 4: السد العالي\nيوم 5: المغادرة"}
                      className={cn(iCls, "h-auto resize-y font-mono text-xs leading-relaxed")} />
                  </F>
                </div>
              )}
              {formTab === "includes" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <F label="يشمل ✓ (سطر لكل بند)">
                    <textarea rows={12} value={form.includes_raw} onChange={e => setF("includes_raw", e.target.value)}
                      placeholder={"تذكرة قطار\nفندق 3 نجوم\nإفطار يومي\nمرشد سياحي"}
                      className={cn(iCls, "h-auto resize-none font-mono text-xs leading-relaxed")} />
                  </F>
                  <F label="لا يشمل ✗ (سطر لكل بند)">
                    <textarea rows={12} value={form.excludes_raw} onChange={e => setF("excludes_raw", e.target.value)}
                      placeholder={"المصروفات الشخصية\nوجبات الغداء\nالجولات الاختيارية"}
                      className={cn(iCls, "h-auto resize-none font-mono text-xs leading-relaxed")} />
                  </F>
                </div>
              )}
              {formTab === "preview" && (
                <div className="space-y-3">
                  <p className="text-xs text-text-muted font-semibold flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-brand-yellow" /> كيف ستبدو للعميل:
                  </p>
                  <div className="bg-brand-dark rounded-2xl p-4 text-white">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex gap-1.5 flex-wrap mb-1.5">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100/20 text-green-300 border border-green-300/30">
                            {DIFF_META[form.difficulty]?.label}
                          </span>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-bold border",
                            form.is_domestic ? "bg-green-100/20 text-green-300 border-green-300/30" : "bg-blue-100/20 text-blue-300 border-blue-300/30")}>
                            {form.is_domestic ? "🇪🇬 داخلية" : "✈️ دولية"}
                          </span>
                        </div>
                        <h3 className="font-bold text-white text-base">{form.title_ar || "عنوان الرحلة"}</h3>
                        <p className="text-white/60 text-sm mt-0.5">{form.destination || "الوجهة"}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-white/50">يبدأ من</p>
                        <p className="text-2xl font-black text-brand-yellow">{form.price_per_person ? Number(form.price_per_person).toLocaleString() : "—"}</p>
                        <p className="text-xs text-white/50">{form.currency} / شخص</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-white/8 rounded-xl p-2"><p className="text-white font-bold">{form.duration_days || "—"} أيام</p><p className="text-white/50">المدة</p></div>
                      <div className="bg-white/8 rounded-xl p-2"><p className="text-white font-bold">{form.available_spots || "—"}</p><p className="text-white/50">مقعد متاح</p></div>
                      <div className="bg-white/8 rounded-xl p-2"><p className="text-white font-bold">{form.cancellation_days || "7"} يوم</p><p className="text-white/50">إلغاء مجاني</p></div>
                    </div>
                    {form.meeting_point && (
                      <div className="mt-3 bg-brand-yellow/10 rounded-xl p-2 text-xs flex items-center gap-2">
                        <span>📍</span><div><p className="text-brand-yellow font-bold text-[10px]">نقطة التجمع</p><p className="text-white">{form.meeting_point}</p></div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mt-4">
                  <AlertTriangle className="w-4 h-4 shrink-0" />{formError}
                </div>
              )}
            </div>
            <div className="flex gap-3 p-5 border-t border-border-light">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-border-default text-sm text-text-secondary hover:bg-muted transition-all">إلغاء</button>
              <button onClick={save} disabled={saving}
                className="flex-1 py-3 rounded-xl bg-brand-green text-white text-sm font-bold hover:bg-brand-green-dark transition-all disabled:opacity-60">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin inline ml-2" />جاري الحفظ...</> : editingId ? "حفظ التعديلات" : "نشر الرحلة"}
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
              <div><p className="font-bold text-sm">حذف الرحلة</p><p className="text-xs text-text-muted">{deleteTarget.meta.title_ar || deleteTarget.name}</p></div>
            </div>
            <p className="text-sm text-text-secondary">هل أنت متأكد؟ لا يمكن التراجع.</p>
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

function F({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-text-secondary mb-1.5">{label}</label>
      {children}
    </div>
  );
}
