"use client";

/**
 * /admin/packages
 * Professional trips management — domestic (Egypt) + international.
 * Wired to the real `trips` table via Supabase client.
 * Extra fields (title_ar, title_en, slug, difficulty, meeting_point,
 * image_url, is_domestic, tags) are stored as a JSON blob inside `description`
 * (prefixed __meta__:) until a schema migration adds them as columns.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  Map, Plus, Search, Upload, RefreshCw, Star, Edit,
  Power, X, Check, Globe, Calendar, Users, ChevronDown, ChevronUp,
  Trash2, AlertTriangle, Plane, Flag,
} from "lucide-react";

// ─── Meta helpers ─────────────────────────────────────────────────────────────
// Extra fields not in `trips` schema are packed into description as JSON.

const META_PREFIX = "__meta__:";

interface TripMeta {
  title_ar: string;
  title_en: string;
  slug: string;
  difficulty: "easy" | "moderate" | "hard";
  meeting_point: string;
  image_url: string;
  is_domestic: boolean;   // true = Egypt internal trip
  tags: string[];
  includes_raw: string;   // newline-separated list for form
  excludes_raw: string;
  itinerary_raw: string;  // JSON string of day objects
}

function packDescription(meta: TripMeta, plain: string): string {
  return `${META_PREFIX}${JSON.stringify(meta)}\n${plain}`;
}

function unpackDescription(desc: string | null): { meta: TripMeta; plain: string } {
  const DEFAULT_META: TripMeta = {
    title_ar: "", title_en: "", slug: "", difficulty: "easy",
    meeting_point: "", image_url: "", is_domestic: false, tags: [],
    includes_raw: "", excludes_raw: "", itinerary_raw: "",
  };
  if (!desc) return { meta: DEFAULT_META, plain: "" };
  if (!desc.startsWith(META_PREFIX)) return { meta: DEFAULT_META, plain: desc };
  const nlIdx = desc.indexOf("\n");
  const jsonStr = nlIdx === -1 ? desc.slice(META_PREFIX.length) : desc.slice(META_PREFIX.length, nlIdx);
  const plain   = nlIdx === -1 ? "" : desc.slice(nlIdx + 1);
  try { return { meta: { ...DEFAULT_META, ...JSON.parse(jsonStr) }, plain }; }
  catch { return { meta: DEFAULT_META, plain: desc }; }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Trip {
  id: string;
  name: string;
  destination: string;
  description: string | null;
  duration_days: number;
  start_date: string;
  end_date: string;
  price_per_person: number | null;
  currency: string | null;
  available_spots: number;
  max_travelers: number | null;
  inclusions: string[] | null;
  exclusions: string[] | null;
  itinerary: { day: number; title: string; description: string }[] | null;
  is_active: boolean;
  is_public: boolean;
  created_at: string;
}

const EMPTY_FORM = {
  // DB fields
  name:            "",
  destination:     "",
  duration_days:   "",
  start_date:      "",
  end_date:        "",
  price_per_person:"",
  currency:        "EGP",
  available_spots: "20",
  max_travelers:   "25",
  is_active:       true,
  is_public:       true,
  // Meta fields
  title_ar:        "",
  title_en:        "",
  slug:            "",
  difficulty:      "easy" as TripMeta["difficulty"],
  meeting_point:   "",
  image_url:       "",
  is_domestic:     false,
  tags:            "",
  includes_raw:    "",
  excludes_raw:    "",
  itinerary_raw:   "",
  // Plain description
  description:     "",
};

type FormState = typeof EMPTY_FORM;

const EGYPT_DESTINATIONS = [
  "الأقصر والأسوان", "شرم الشيخ", "الغردقة", "مرسى علم",
  "سيوة", "البحر الأحمر", "سيناء", "الفيوم", "القاهرة التاريخية",
];

const INTL_DESTINATIONS = [
  "دبي", "إسطنبول", "باريس", "لندن", "روما", "أمستردام",
  "برشلونة", "بودابست", "طوكيو", "بانكوك",
];

// ─── CSV import helper ────────────────────────────────────────────────────────

function parseCSVTrips(text: string): Partial<FormState>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map(line => {
    const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ""; });
    return obj as Partial<FormState>;
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminPackagesPage() {
  const supabase = createClient();

  const [trips, setTrips]             = useState<Trip[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [filterType, setFilterType]   = useState<"all" | "domestic" | "international">("all");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");

  const [showForm, setShowForm]       = useState(false);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [form, setForm]               = useState<FormState>({ ...EMPTY_FORM });
  const [saving, setSaving]           = useState(false);
  const [formError, setFormError]     = useState<string | null>(null);
  const [activeTab, setActiveTab]     = useState<"basic"|"itinerary"|"includes"|"visibility">("basic");

  const [deleteTarget, setDeleteTarget] = useState<Trip | null>(null);
  const [expandedId, setExpandedId]     = useState<string | null>(null);

  const [importing, setImporting]       = useState(false);
  const [importResults, setImportResults] = useState<{ ok: number; fail: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── fetch ──
  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("trips").select("*").order("created_at", { ascending: false });
    if (filterActive === "active")   q = q.eq("is_active", true);
    if (filterActive === "inactive") q = q.eq("is_active", false);
    const { data } = await q;
    setTrips((data as Trip[]) || []);
    setLoading(false);
  }, [filterActive]);

  useEffect(() => { load(); }, [load]);

  // ── Filter client-side for domestic/intl ──
  const filtered = trips.filter(t => {
    if (search) {
      const { meta } = unpackDescription(t.description);
      const haystack = `${t.name} ${t.destination} ${meta.title_ar} ${meta.title_en}`.toLowerCase();
      if (!haystack.includes(search.toLowerCase())) return false;
    }
    if (filterType !== "all") {
      const { meta } = unpackDescription(t.description);
      if (filterType === "domestic" && !meta.is_domestic) return false;
      if (filterType === "international" && meta.is_domestic) return false;
    }
    return true;
  });

  // ── form helpers ──
  function setF(k: keyof FormState, v: unknown) { setForm(p => ({ ...p, [k]: v })); }

  function autoSlug(name: string) {
    return name.toLowerCase()
      .replace(/[\u0600-\u06FF\s]+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function openCreate() {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setFormError(null);
    setActiveTab("basic");
    setShowForm(true);
  }

  function openEdit(t: Trip) {
    const { meta, plain } = unpackDescription(t.description);
    setForm({
      name:             t.name,
      destination:      t.destination,
      duration_days:    String(t.duration_days),
      start_date:       t.start_date,
      end_date:         t.end_date,
      price_per_person: t.price_per_person ? String(t.price_per_person) : "",
      currency:         t.currency ?? "EGP",
      available_spots:  String(t.available_spots),
      max_travelers:    t.max_travelers ? String(t.max_travelers) : "25",
      is_active:        t.is_active,
      is_public:        t.is_public,
      title_ar:         meta.title_ar,
      title_en:         meta.title_en,
      slug:             meta.slug,
      difficulty:       meta.difficulty,
      meeting_point:    meta.meeting_point,
      image_url:        meta.image_url,
      is_domestic:      meta.is_domestic,
      tags:             meta.tags.join(", "),
      includes_raw:     meta.includes_raw || (t.inclusions ?? []).join("\n"),
      excludes_raw:     meta.excludes_raw || (t.exclusions ?? []).join("\n"),
      itinerary_raw:    meta.itinerary_raw || (t.itinerary ? JSON.stringify(t.itinerary, null, 2) : ""),
      description:      plain,
    });
    setEditingId(t.id);
    setFormError(null);
    setActiveTab("basic");
    setShowForm(true);
  }

  // ── save ──
  async function save() {
    if (!form.name.trim())        { setFormError("اسم الرحلة مطلوب"); return; }
    if (!form.destination.trim()) { setFormError("الوجهة مطلوبة"); return; }
    if (!form.start_date)         { setFormError("تاريخ البداية مطلوب"); return; }
    if (!form.end_date)           { setFormError("تاريخ النهاية مطلوب"); return; }
    if (!form.price_per_person || isNaN(Number(form.price_per_person))) {
      setFormError("السعر مطلوب"); return;
    }

    setSaving(true);
    setFormError(null);

    // Parse itinerary
    let parsedItinerary: Trip["itinerary"] = null;
    if (form.itinerary_raw.trim()) {
      try {
        parsedItinerary = JSON.parse(form.itinerary_raw);
      } catch {
        // Build from textarea lines: "Day 1: Title - Description"
        parsedItinerary = form.itinerary_raw.trim().split("\n").map((line, i) => {
          const parts = line.replace(/^يوم\s*\d+[:\-]\s*/i, "").split(" - ");
          return { day: i + 1, title: parts[0]?.trim() || `اليوم ${i + 1}`, description: parts[1]?.trim() || "" };
        });
      }
    }

    const meta: TripMeta = {
      title_ar:      form.title_ar || form.name,
      title_en:      form.title_en,
      slug:          form.slug || autoSlug(form.name),
      difficulty:    form.difficulty,
      meeting_point: form.meeting_point,
      image_url:     form.image_url,
      is_domestic:   form.is_domestic,
      tags:          form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      includes_raw:  form.includes_raw,
      excludes_raw:  form.excludes_raw,
      itinerary_raw: form.itinerary_raw,
    };

    const payload = {
      name:             form.name.trim(),
      destination:      form.destination.trim(),
      description:      packDescription(meta, form.description.trim()),
      duration_days:    Number(form.duration_days) || Math.ceil(
        (new Date(form.end_date).getTime() - new Date(form.start_date).getTime()) / 86400000
      ),
      start_date:       form.start_date,
      end_date:         form.end_date,
      price_per_person: Number(form.price_per_person),
      currency:         form.currency,
      available_spots:  Number(form.available_spots) || 20,
      max_travelers:    Number(form.max_travelers) || 25,
      inclusions:       form.includes_raw ? form.includes_raw.split("\n").map(l => l.trim()).filter(Boolean) : null,
      exclusions:       form.excludes_raw ? form.excludes_raw.split("\n").map(l => l.trim()).filter(Boolean) : null,
      itinerary:        parsedItinerary,
      is_active:        form.is_active,
      is_public:        form.is_public,
    };

    try {
      if (editingId) {
        const { error } = await supabase.from("trips").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("trips").insert(payload as never);
        if (error) throw error;
      }
      setShowForm(false);
      load();
    } catch (e: unknown) {
      setFormError((e as Error).message ?? "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  // ── toggle ──
  async function toggle(id: string, field: "is_active" | "is_public", current: boolean) {
    await supabase.from("trips").update({ [field]: !current } as never).eq("id", id);
    load();
  }

  // ── delete ──
  async function deleteTrip(id: string) {
    await supabase.from("trips").delete().eq("id", id);
    setDeleteTarget(null);
    load();
  }

  // ── import ──
  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResults(null);
    const text = await file.text();
    let rows: Partial<FormState>[] = [];
    try {
      if (file.name.endsWith(".json")) rows = JSON.parse(text);
      else rows = parseCSVTrips(text);
    } catch {
      alert("ملف غير صالح"); setImporting(false); return;
    }

    let ok = 0; let fail = 0;
    for (const row of rows) {
      const isDomestic: boolean = String(row.is_domestic) === "true" || Boolean(row.destination?.includes("مصر"));
      const meta: TripMeta = {
        title_ar: row.title_ar || row.name || "",
        title_en: row.title_en || "",
        slug: autoSlug(row.name || ""),
        difficulty: (row.difficulty as TripMeta["difficulty"]) || "easy",
        meeting_point: row.meeting_point || "",
        image_url: row.image_url || "",
        is_domestic: isDomestic,
        tags: [],
        includes_raw: row.includes_raw || "",
        excludes_raw: row.excludes_raw || "",
        itinerary_raw: "",
      };
      const payload = {
        name:             row.name || "—",
        destination:      row.destination || "",
        description:      packDescription(meta, row.description || ""),
        duration_days:    Number(row.duration_days || 3),
        start_date:       row.start_date || new Date().toISOString().split("T")[0],
        end_date:         row.end_date || "2027-12-31",
        price_per_person: Number(row.price_per_person || 0),
        currency:         row.currency || "EGP",
        available_spots:  Number(row.available_spots || 20),
        max_travelers:    Number(row.max_travelers || 25),
        inclusions:       row.includes_raw ? row.includes_raw.split("\n").filter(Boolean) : null,
        exclusions:       row.excludes_raw ? row.excludes_raw.split("\n").filter(Boolean) : null,
        is_active:        true,
        is_public:        true,
      };
      const { error } = await supabase.from("trips").insert(payload as never);
      if (error) fail++; else ok++;
    }

    setImportResults({ ok, fail });
    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
    load();
  }

  // ─── JSX ───────────────────────────────────────────────────────────────────

  const iCls = "w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green bg-white text-gray-900 transition-colors";

  const domestic  = trips.filter(t => unpackDescription(t.description).meta.is_domestic);
  const intl      = trips.filter(t => !unpackDescription(t.description).meta.is_domestic);

  return (
    <div className="space-y-5 max-w-7xl" dir="rtl">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-text-primary flex items-center gap-2">
            <Map className="w-6 h-6 text-brand-green" />
            إدارة الرحلات والباقات
          </h1>
          <div className="flex gap-4 mt-1 text-sm text-text-muted">
            <span className="flex items-center gap-1">
              <Flag className="w-3.5 h-3.5 text-green-600" />
              {domestic.length} رحلة داخلية
            </span>
            <span className="flex items-center gap-1">
              <Plane className="w-3.5 h-3.5 text-blue-600" />
              {intl.length} رحلة دولية
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className={cn(
            "flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border-default text-sm font-semibold cursor-pointer transition-all",
            importing ? "opacity-60 pointer-events-none" : "hover:bg-muted text-text-secondary"
          )}>
            <Upload className="w-4 h-4" />
            {importing ? "جاري الاستيراد..." : "استيراد CSV / JSON"}
            <input ref={fileRef} type="file" accept=".csv,.json" className="hidden" onChange={handleImportFile} />
          </label>
          <button onClick={load} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border-default text-sm text-text-secondary hover:bg-muted transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-green text-white text-sm font-bold hover:bg-brand-green-dark transition-all shadow-sm">
            <Plus className="w-4 h-4" />
            رحلة جديدة
          </button>
        </div>
      </div>

      {/* Import result */}
      {importResults && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-200 text-sm">
          <Check className="w-4 h-4 text-green-600 shrink-0" />
          <span>تم استيراد <strong>{importResults.ok}</strong> رحلة
            {importResults.fail > 0 && <span className="text-red-600"> · {importResults.fail} سطر فشل</span>}
          </span>
          <button onClick={() => setImportResults(null)} className="mr-auto text-gray-400"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Import hint */}
      <details className="text-xs text-text-muted border border-border-light rounded-xl p-3">
        <summary className="cursor-pointer font-semibold text-text-secondary flex items-center gap-1">
          <Upload className="w-3 h-3" /> تنسيق ملف الاستيراد
        </summary>
        <div className="mt-2 space-y-1">
          <p className="font-semibold">CSV — الأعمدة:</p>
          <code className="block bg-muted px-2 py-1 rounded text-xs">
            name, destination, duration_days, start_date, end_date, price_per_person, currency, available_spots, is_domestic, title_ar, title_en, difficulty, meeting_point, image_url
          </code>
          <p className="font-semibold mt-2">JSON — مثال:</p>
          <code className="block bg-muted px-2 py-1 rounded text-xs whitespace-pre">
{`[{ "name": "الأقصر وأسوان - ٥ أيام",
   "destination": "الأقصر والأسوان",
   "duration_days": 5,
   "start_date": "2026-11-01",
   "end_date": "2026-11-06",
   "price_per_person": 9800,
   "is_domestic": true }]`}
          </code>
        </div>
      </details>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute top-1/2 right-3 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو الوجهة..."
            className="w-full h-10 pr-9 pl-3 border border-border-default rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/30" />
        </div>

        {/* Type filter */}
        <div className="flex gap-1 bg-muted p-1 rounded-xl">
          {([
            { val: "all",           label: "الكل" },
            { val: "domestic",      label: "🇪🇬 داخلية" },
            { val: "international", label: "✈️ دولية" },
          ] as const).map(f => (
            <button key={f.val} onClick={() => setFilterType(f.val)}
              className={cn("text-xs font-semibold px-3 py-1.5 rounded-lg transition-all whitespace-nowrap",
                filterType === f.val ? "bg-white shadow-sm text-brand-green" : "text-text-muted hover:text-text-secondary"
              )}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1 bg-muted p-1 rounded-xl">
          {([
            { val: "all",      label: "الكل" },
            { val: "active",   label: "نشطة" },
            { val: "inactive", label: "مخفية" },
          ] as const).map(f => (
            <button key={f.val} onClick={() => setFilterActive(f.val)}
              className={cn("text-xs font-semibold px-3 py-1.5 rounded-lg transition-all",
                filterActive === f.val ? "bg-white shadow-sm text-brand-green" : "text-text-muted hover:text-text-secondary"
              )}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Trips list ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-44 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <Map className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>لا توجد رحلات</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => {
            const { meta } = unpackDescription(t.description);
            const isOpen = expandedId === t.id;
            return (
              <div key={t.id} className={cn(
                "bg-white rounded-2xl border transition-all overflow-hidden",
                isOpen ? "border-brand-green shadow-lg" : "border-border-light hover:shadow-sm"
              )}>
                {/* Card image */}
                {meta.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={meta.image_url} alt={t.name} className="w-full h-32 object-cover" />
                )}
                {!meta.image_url && (
                  <div className={cn(
                    "w-full h-20 flex items-center justify-center",
                    meta.is_domestic ? "bg-gradient-to-br from-green-800 to-green-600" : "bg-gradient-to-br from-blue-700 to-blue-500"
                  )}>
                    {meta.is_domestic
                      ? <Flag className="w-8 h-8 text-white/60" />
                      : <Plane className="w-8 h-8 text-white/60" />
                    }
                  </div>
                )}

                <div className="p-4">
                  {/* Badges */}
                  <div className="flex gap-1.5 mb-2 flex-wrap">
                    <span className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded-full",
                      meta.is_domestic ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                    )}>
                      {meta.is_domestic ? "🇪🇬 داخلية" : "✈️ دولية"}
                    </span>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      t.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                    )}>
                      {t.is_active ? "نشطة" : "مخفية"}
                    </span>
                    {meta.difficulty !== "easy" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                        {meta.difficulty === "moderate" ? "متوسطة" : "صعبة"}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-text-primary text-sm leading-tight mb-1">
                    {meta.title_ar || t.name}
                  </h3>
                  <p className="text-xs text-text-muted mb-2">{t.destination} · {t.duration_days} أيام</p>

                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-black text-brand-green">{(t.price_per_person ?? 0).toLocaleString()}</span>
                      <span className="text-xs text-text-muted mr-1">{t.currency ?? "EGP"} / شخص</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-text-muted">
                      <Users className="w-3 h-3" />
                      {t.available_spots} مقعد
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-1 text-xs text-text-muted mb-3">
                    <Calendar className="w-3 h-3" />
                    {t.start_date} → {t.end_date}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(t)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition-all">
                      <Edit className="w-3 h-3" /> تعديل
                    </button>
                    <button onClick={() => toggle(t.id, "is_active", t.is_active)}
                      className={cn("flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-semibold transition-all",
                        t.is_active ? "bg-red-50 text-red-500 hover:bg-red-100" : "bg-green-50 text-green-700 hover:bg-green-100"
                      )}>
                      <Power className="w-3 h-3" /> {t.is_active ? "إخفاء" : "تفعيل"}
                    </button>
                    <button onClick={() => setDeleteTarget(t)}
                      className="p-1.5 rounded-xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Expand details */}
                  <button onClick={() => setExpandedId(isOpen ? null : t.id)}
                    className="w-full flex items-center justify-center gap-1 mt-2 text-xs text-text-muted hover:text-text-secondary">
                    {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {isOpen ? "إخفاء التفاصيل" : "عرض التفاصيل"}
                  </button>

                  {isOpen && (
                    <div className="mt-3 pt-3 border-t border-border-light space-y-2 text-xs text-text-secondary">
                      {meta.meeting_point && <p><strong>نقطة التجمع:</strong> {meta.meeting_point}</p>}
                      {t.inclusions && t.inclusions.length > 0 && (
                        <div>
                          <p className="font-semibold text-green-700 mb-1">✓ يشمل:</p>
                          <ul className="space-y-0.5 list-none">
                            {t.inclusions.slice(0, 4).map((inc, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <Check className="w-3 h-3 text-green-600 mt-0.5 shrink-0" />
                                {inc}
                              </li>
                            ))}
                            {t.inclusions.length > 4 && <li className="text-text-muted">+{t.inclusions.length - 4} أخرى</li>}
                          </ul>
                        </div>
                      )}
                      {t.exclusions && t.exclusions.length > 0 && (
                        <div>
                          <p className="font-semibold text-red-600 mb-1">✗ لا يشمل:</p>
                          <ul className="space-y-0.5">
                            {t.exclusions.slice(0, 3).map((exc, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <X className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />
                                {exc}
                              </li>
                            ))}
                          </ul>
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

      {/* ════════════════════════════════════════════════════════════════════
          Trip Form Modal — Full professional form with tabs
          ════════════════════════════════════════════════════════════════════ */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8" dir="rtl">

            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-border-light">
              <div>
                <h3 className="text-lg font-black text-text-primary">
                  {editingId ? "تعديل الرحلة" : "إضافة رحلة جديدة"}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">أكمل جميع التبويبات لعرض احترافي على الموقع</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-muted transition-all">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-0.5 bg-muted p-1.5 mx-5 mt-4 rounded-xl">
              {([
                { key: "basic",      label: "المعلومات الأساسية" },
                { key: "itinerary",  label: "برنامج الرحلة" },
                { key: "includes",   label: "يشمل / لا يشمل" },
                { key: "visibility", label: "الظهور والإعدادات" },
              ] as const).map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex-1 text-xs font-semibold py-2 rounded-lg transition-all whitespace-nowrap",
                    activeTab === tab.key ? "bg-white shadow-sm text-brand-green" : "text-text-muted hover:text-text-secondary"
                  )}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-5">

              {/* ── Tab 1: Basic info ── */}
              {activeTab === "basic" && (
                <div className="space-y-4">
                  {/* Domestic toggle */}
                  <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-border-default">
                    <span className="text-sm text-text-secondary">نوع الرحلة:</span>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setF("is_domestic", false)}
                        className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                          !form.is_domestic ? "bg-blue-600 text-white border-blue-600" : "bg-white text-text-secondary border-border-default hover:border-blue-400"
                        )}>
                        <Plane className="w-3.5 h-3.5" /> دولية (خارج مصر)
                      </button>
                      <button type="button" onClick={() => setF("is_domestic", true)}
                        className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                          form.is_domestic ? "bg-green-600 text-white border-green-600" : "bg-white text-text-secondary border-border-default hover:border-green-400"
                        )}>
                        <Flag className="w-3.5 h-3.5" /> داخلية (مصر)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TField label="اسم الرحلة (للأدمن)" required>
                      <input value={form.name} onChange={e => setF("name", e.target.value)}
                        placeholder="Luxor & Aswan — 5 Days" className={iCls} />
                    </TField>
                    <TField label="العنوان بالعربية (للعملاء)" required>
                      <input value={form.title_ar} onChange={e => {
                        setF("title_ar", e.target.value);
                        if (!form.slug) setF("slug", autoSlug(e.target.value));
                      }}
                        placeholder="الأقصر وأسوان — ٥ أيام" className={iCls} />
                    </TField>
                    <TField label="العنوان بالإنجليزية">
                      <input value={form.title_en} onChange={e => setF("title_en", e.target.value)}
                        placeholder="Luxor & Aswan — 5 Days" className={iCls} />
                    </TField>
                    <TField label="Slug (رابط الصفحة)">
                      <input value={form.slug} onChange={e => setF("slug", e.target.value)}
                        placeholder="luxor-aswan-5days" className={iCls} />
                    </TField>

                    <TField label="الوجهة" required>
                      <input list="dest-list" value={form.destination} onChange={e => setF("destination", e.target.value)}
                        placeholder="الأقصر والأسوان" className={iCls} />
                      <datalist id="dest-list">
                        {(form.is_domestic ? EGYPT_DESTINATIONS : INTL_DESTINATIONS).map(d => (
                          <option key={d} value={d} />
                        ))}
                      </datalist>
                    </TField>

                    <TField label="مستوى الصعوبة">
                      <select value={form.difficulty} onChange={e => setF("difficulty", e.target.value as TripMeta["difficulty"])} className={iCls}>
                        <option value="easy">سهل — مناسب للجميع</option>
                        <option value="moderate">متوسط — يتطلب لياقة معتدلة</option>
                        <option value="hard">صعب — للمغامرين</option>
                      </select>
                    </TField>

                    <TField label="تاريخ البداية" required>
                      <input type="date" value={form.start_date} onChange={e => {
                        setF("start_date", e.target.value);
                        if (e.target.value && form.end_date) {
                          const d = Math.ceil((new Date(form.end_date).getTime() - new Date(e.target.value).getTime()) / 86400000);
                          if (d > 0) setF("duration_days", String(d));
                        }
                      }} className={iCls} />
                    </TField>

                    <TField label="تاريخ النهاية" required>
                      <input type="date" value={form.end_date} onChange={e => {
                        setF("end_date", e.target.value);
                        if (form.start_date && e.target.value) {
                          const d = Math.ceil((new Date(e.target.value).getTime() - new Date(form.start_date).getTime()) / 86400000);
                          if (d > 0) setF("duration_days", String(d));
                        }
                      }} className={iCls} />
                    </TField>

                    <TField label="عدد الأيام">
                      <input type="number" min={1} value={form.duration_days} onChange={e => setF("duration_days", e.target.value)}
                        placeholder="يُحسب تلقائياً" className={iCls} />
                    </TField>

                    <TField label="السعر / شخص" required>
                      <div className="flex gap-2">
                        <input type="number" min={0} value={form.price_per_person}
                          onChange={e => setF("price_per_person", e.target.value)}
                          placeholder="9800" className={cn(iCls, "flex-1")} />
                        <select value={form.currency} onChange={e => setF("currency", e.target.value)}
                          className="h-10 px-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/30">
                          <option value="EGP">EGP</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                        </select>
                      </div>
                    </TField>

                    <TField label="المقاعد المتاحة">
                      <input type="number" min={1} value={form.available_spots}
                        onChange={e => setF("available_spots", e.target.value)} className={iCls} />
                    </TField>

                    <TField label="الحد الأقصى للمجموعة">
                      <input type="number" min={1} value={form.max_travelers}
                        onChange={e => setF("max_travelers", e.target.value)} className={iCls} />
                    </TField>

                    <TField label="نقطة التجمع">
                      <input value={form.meeting_point} onChange={e => setF("meeting_point", e.target.value)}
                        placeholder="مثال: مطار القاهرة الدولي — صالة 2" className={iCls} />
                    </TField>

                    <TField label="رابط الصورة الغلاف">
                      <div className="flex gap-2">
                        <input value={form.image_url} onChange={e => setF("image_url", e.target.value)}
                          placeholder="https://..." className={cn(iCls, "flex-1")} />
                        {form.image_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={form.image_url} alt="" className="w-10 h-10 rounded-lg object-cover border shrink-0" />
                        )}
                      </div>
                    </TField>

                    <TField label="الكلمات الدلالية (tags)" className="sm:col-span-2">
                      <input value={form.tags} onChange={e => setF("tags", e.target.value)}
                        placeholder="ثقافية, عائلية, مغامرة, شهر عسل (مفصولة بفاصلة)" className={iCls} />
                    </TField>

                    <TField label="الوصف التسويقي (للعملاء)" className="sm:col-span-2">
                      <textarea rows={3} value={form.description} onChange={e => setF("description", e.target.value)}
                        placeholder="اكتب وصفاً جذاباً يشجع العملاء على الحجز..."
                        className={cn(iCls, "h-auto resize-none")} />
                    </TField>
                  </div>
                </div>
              )}

              {/* ── Tab 2: Itinerary ── */}
              {activeTab === "itinerary" && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-700 space-y-1">
                    <p className="font-semibold">📋 تنسيق برنامج الرحلة — سطر لكل يوم:</p>
                    <code className="block bg-white/60 px-2 py-1 rounded">يوم 1: استقبال في المطار - نقل للفندق وراحة</code>
                    <code className="block bg-white/60 px-2 py-1 rounded">يوم 2: زيارة معبد الكرنك - جولة في المدينة</code>
                    <p className="mt-1">أو أدخل JSON مباشرة: <code>[{`{"day":1,"title":"...","description":"..."}`}]</code></p>
                  </div>
                  <TField label="برنامج الرحلة — يوماً بيوم" required>
                    <textarea
                      rows={14}
                      value={form.itinerary_raw}
                      onChange={e => setF("itinerary_raw", e.target.value)}
                      placeholder={`يوم 1: الوصول والاستقبال - استقبال في المطار ونقل للفندق\nيوم 2: معبد الكرنك - زيارة أضخم معابد مصر الفرعونية\nيوم 3: معبد الأقصر والتمثالان - جولة صباحية\nيوم 4: أسوان والسد العالي - رحلة بالقارب على النيل\nيوم 5: أبو سمبل والمغادرة - زيارة معبد رمسيس والعودة`}
                      className={cn(iCls, "h-auto resize-y font-mono text-xs leading-relaxed")}
                    />
                  </TField>
                </div>
              )}

              {/* ── Tab 3: Includes / Excludes ── */}
              {activeTab === "includes" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TField label="ما تشمله الرحلة ✓">
                      <textarea
                        rows={10}
                        value={form.includes_raw}
                        onChange={e => setF("includes_raw", e.target.value)}
                        placeholder={`تذكرة قطار أو طيران\nفندق 3 نجوم نيلي\nجميع الوجبات\nمرشد سياحي متخصص\nرحلة البالون الهوائي\nجميع تذاكر المعابد`}
                        className={cn(iCls, "h-auto resize-none font-mono text-xs leading-relaxed")}
                      />
                      <p className="text-xs text-text-muted mt-1">سطر لكل بند</p>
                    </TField>
                    <TField label="ما لا تشمله الرحلة ✗">
                      <textarea
                        rows={10}
                        value={form.excludes_raw}
                        onChange={e => setF("excludes_raw", e.target.value)}
                        placeholder={`المصروفات الشخصية\nالجولات الاختيارية الإضافية\nالمشروبات خارج الوجبات\nالبقشيش`}
                        className={cn(iCls, "h-auto resize-none font-mono text-xs leading-relaxed")}
                      />
                      <p className="text-xs text-text-muted mt-1">سطر لكل بند</p>
                    </TField>
                  </div>
                </div>
              )}

              {/* ── Tab 4: Visibility ── */}
              {activeTab === "visibility" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 bg-muted/40 rounded-2xl space-y-4">
                      {([
                        { field: "is_active" as const, label: "نشطة", desc: "الرحلة مفعّلة ويمكن للعملاء حجزها" },
                        { field: "is_public" as const, label: "ظاهرة على الموقع", desc: "تظهر في قائمة الرحلات للزوار" },
                      ]).map(({ field, label, desc }) => (
                        <label key={field} className="flex items-start gap-3 cursor-pointer">
                          <div className={cn(
                            "w-11 h-6 rounded-full relative transition-colors mt-0.5 shrink-0",
                            form[field] ? "bg-brand-green" : "bg-gray-300"
                          )} onClick={() => setF(field, !form[field])}>
                            <div className={cn(
                              "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all",
                              form[field] ? "right-0.5" : "left-0.5"
                            )} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-text-primary">{label}</p>
                            <p className="text-xs text-text-muted">{desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>

                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                      <p className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                        <Star className="w-4 h-4" /> معاينة الرحلة كما ستظهر للعميل
                      </p>
                      <div className="bg-white rounded-xl p-3 text-sm space-y-1">
                        <p className="font-bold text-text-primary">{form.title_ar || form.name || "اسم الرحلة"}</p>
                        <p className="text-xs text-text-muted">{form.destination || "الوجهة"} · {form.duration_days || "؟"} أيام</p>
                        <p className="text-brand-green font-bold">{form.price_per_person ? Number(form.price_per_person).toLocaleString() : "—"} {form.currency} / شخص</p>
                        {form.meeting_point && <p className="text-xs text-text-muted">📍 {form.meeting_point}</p>}
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {form.is_domestic
                            ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">🇪🇬 رحلة داخلية</span>
                            : <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">✈️ رحلة دولية</span>
                          }
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {form.difficulty === "easy" ? "سهل" : form.difficulty === "moderate" ? "متوسط" : "صعب"}
                          </span>
                          {form.tags && form.tags.split(",").filter(Boolean).slice(0, 2).map(tag => (
                            <span key={tag} className="text-xs bg-brand-green/10 text-brand-green px-2 py-0.5 rounded-full">{tag.trim()}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {formError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mt-4">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
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
                {saving ? "جاري الحفظ..." : editingId ? "حفظ التعديلات" : "نشر الرحلة"}
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
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="font-bold text-text-primary text-sm">حذف الرحلة</p>
                <p className="text-xs text-text-muted">{deleteTarget.name}</p>
              </div>
            </div>
            <p className="text-sm text-text-secondary">هل أنت متأكد؟ لا يمكن التراجع.</p>
            <div className="flex gap-3">
              <button onClick={() => deleteTrip(deleteTarget.id)}
                className="flex-1 h-10 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-all">
                حذف
              </button>
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 h-10 border border-border-light text-sm rounded-xl hover:bg-muted transition-all">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function TField({ label, required, className, children }: {
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
