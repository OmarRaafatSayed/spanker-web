"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

const COUNTRY_FLAG: Record<string, string> = {
  "فرنسا": "🇫🇷",
  "تركيا": "🇹🇷",
  "الإمارات": "🇦🇪",
  "رومانيا": "🇷🇴",
  "المجر": "🇭🇺",
  "مصر": "🇪🇬",
};

const DIFFICULTY_META: Record<string, { label: string; color: string }> = {
  easy:        { label: "سهل",   color: "bg-green-100 text-green-700" },
  moderate:    { label: "متوسط", color: "bg-yellow-100 text-yellow-700" },
  challenging: { label: "صعب",   color: "bg-red-100 text-red-700" },
};

const CATEGORY_FILTERS = [
  { id: "all",      label: "الكل",   labelEn: "All" },
  { id: "local",    label: "داخلية", labelEn: "Domestic" },
  { id: "intl",     label: "خارجية", labelEn: "International" },
  { id: "featured", label: "مميزة",  labelEn: "Featured" },
];

export default function ToursPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "ar";
  const { isRTL } = useI18n();

  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    fetch("/api/v1/trips/search")
      .then((r) => r.json())
      .then((j) => { if (j.success) setTrips(j.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = trips.filter((t) => {
    const matchSearch = !searchText || t.title_ar.includes(searchText) || t.destination.includes(searchText);
    if (category === "local")    return matchSearch && t.country === "مصر";
    if (category === "intl")     return matchSearch && t.country !== "مصر";
    if (category === "featured") return matchSearch && t.is_featured;
    return matchSearch;
  });

  return (
    <div className="min-h-screen bg-bg-alt" dir={isRTL ? "rtl" : "ltr"}>
      {/* Hero header */}
      <div className="bg-brand-dark px-4 pt-12 pb-8">
        <div className="max-w-2xl mx-auto">
          <p className="text-brand-yellow text-xs font-bold uppercase tracking-widest mb-2">الرحلات السياحية</p>
          <h1 className="text-2xl font-bold text-white mb-1">سافر بثقة — معانا</h1>
          <p className="text-white/60 text-sm">طيران + فندق + خدمات في باقة واحدة</p>

          {/* Search */}
          <div className="mt-5 relative">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="ابحث عن وجهة..."
              className="w-full h-11 px-4 pe-10 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow/40"
            />
            <span className="absolute top-1/2 -translate-y-1/2 end-3 text-white/40 text-sm">🔍</span>
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="bg-white border-b border-border-light sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 flex gap-1 overflow-x-auto py-3 no-scrollbar">
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                category === cat.id
                  ? "bg-brand-green text-white"
                  : "bg-bg-alt text-text-secondary hover:bg-brand-green/10"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-border-light p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2 mb-3" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🗺️</div>
            <p className="text-text-muted text-sm">لا توجد رحلات بهذه المعايير</p>
            <button
              onClick={() => { setCategory("all"); setSearchText(""); }}
              className="mt-3 text-sm text-brand-green font-semibold hover:underline"
            >
              عرض الكل
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-text-muted mb-4 font-medium">{filtered.length} رحلة متاحة</p>
            <div className="space-y-4">
              {filtered.map((trip) => {
                const flag = COUNTRY_FLAG[trip.country] ?? "🌍";
                const diff = DIFFICULTY_META[trip.difficulty] ?? { label: trip.difficulty, color: "bg-muted text-text-muted" };
                return (
                  <div
                    key={trip.id}
                    className="bg-white rounded-2xl border border-border-light overflow-hidden hover:border-brand-green/40 hover:shadow-md transition-all"
                  >
                    {/* Card header */}
                    <div className="p-4">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {trip.is_featured && (
                              <span className="text-xs bg-brand-yellow/20 text-brand-yellow font-bold px-2 py-0.5 rounded-full border border-brand-yellow/30">
                                ⭐ مميزة
                              </span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${diff.color}`}>
                              {diff.label}
                            </span>
                          </div>
                          <h3 className="font-bold text-text-primary text-base leading-tight">{trip.title_ar}</h3>
                          <p className="text-sm text-text-muted mt-0.5">
                            {flag} {trip.destination} • {trip.country}
                          </p>
                        </div>
                        <div className="text-start shrink-0">
                          <p className="text-xs text-text-muted">يبدأ من</p>
                          <p className="text-xl font-bold text-brand-green">{trip.price_per_person?.toLocaleString()}</p>
                          <p className="text-xs text-text-muted">ج.م / شخص</p>
                        </div>
                      </div>

                      {/* Meta row */}
                      <div className="flex items-center gap-3 mt-3 text-xs text-text-secondary flex-wrap">
                        <span className="flex items-center gap-1">
                          <span>🗓</span>
                          {trip.duration_days} {trip.duration_days === 1 ? "يوم" : "أيام"}
                        </span>
                        <span className="flex items-center gap-1">
                          <span>👥</span>
                          {trip.spots_available} مقعد متاح
                        </span>
                        <span className="flex items-center gap-1">
                          <span>📅</span>
                          {trip.start_date}
                        </span>
                      </div>

                      {/* Includes preview */}
                      {trip.includes?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {trip.includes.slice(0, 3).map((item: string, i: number) => (
                            <span key={i} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                              ✓ {item}
                            </span>
                          ))}
                          {trip.includes.length > 3 && (
                            <span className="text-xs text-text-muted">+{trip.includes.length - 3} أخرى</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card footer */}
                    <div className="border-t border-border-light px-4 py-3 flex items-center justify-between">
                      <p className="text-xs text-text-muted">
                        إلغاء مجاني قبل {trip.cancellation_days} يوم
                      </p>
                      <Link
                        href={`/${locale}/tours/${trip.slug}`}
                        className="flex items-center gap-1.5 text-sm font-bold text-white bg-brand-green px-4 py-2 rounded-xl hover:bg-brand-green/90 transition-colors"
                      >
                        عرض التفاصيل
                        <span className={isRTL ? "rotate-180" : ""}>←</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
