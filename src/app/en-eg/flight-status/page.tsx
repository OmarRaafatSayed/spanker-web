"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";

type SearchType = "flight-number" | "route";

interface FlightResult {
  flightNumber: string;
  route: string;
  routeAr: string;
  scheduled: string;
  estimated: string;
  status: "on-time" | "delayed" | "boarding" | "departed" | "arrived" | "cancelled";
  terminal: string;
  gate: string;
}

const MOCK_RESULTS: FlightResult[] = [
  { flightNumber: "SP 101", route: "Cairo → Sharm el-Sheikh", routeAr: "القاهرة ← شرم الشيخ", scheduled: "08:00", estimated: "08:00", status: "on-time", terminal: "T2", gate: "G14" },
  { flightNumber: "SP 204", route: "Cairo → Luxor", routeAr: "القاهرة ← الأقصر", scheduled: "10:30", estimated: "10:55", status: "delayed", terminal: "T2", gate: "G08" },
  { flightNumber: "SP 315", route: "Hurghada → Cairo", routeAr: "الغردقة ← القاهرة", scheduled: "13:15", estimated: "13:15", status: "boarding", terminal: "T1", gate: "G03" },
  { flightNumber: "SP 420", route: "Cairo → Aswan", routeAr: "القاهرة ← أسوان", scheduled: "15:45", estimated: "15:45", status: "departed", terminal: "T2", gate: "G11" },
  { flightNumber: "SP 533", route: "Marsa Alam → Cairo", routeAr: "مرسى علم ← القاهرة", scheduled: "17:20", estimated: "17:20", status: "arrived", terminal: "T1", gate: "G07" },
];

const STATUS_CONFIG = {
  "on-time":  { ar: "في الموعد",         en: "On Time",    color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  "delayed":  { ar: "متأخر",             en: "Delayed",    color: "bg-amber-100 text-amber-700 border-amber-200" },
  "boarding": { ar: "جاري الصعود",       en: "Boarding",   color: "bg-blue-100 text-blue-700 border-blue-200" },
  "departed": { ar: "أقلعت",             en: "Departed",   color: "bg-brand-red/10 text-brand-red border-brand-red/20" },
  "arrived":  { ar: "وصلت",              en: "Arrived",    color: "bg-gray-100 text-gray-600 border-gray-200" },
  "cancelled":{ ar: "ملغاة",             en: "Cancelled",  color: "bg-red-100 text-red-600 border-red-200" },
};

export default function FlightStatusPage() {
  const { locale, isRTL } = useI18n();
  const isAr = locale === "ar";
  const [searchType, setSearchType] = useState<SearchType>("flight-number");
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<FlightResult[]>([]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearched(true);
    if (!query.trim()) { setResults(MOCK_RESULTS); return; }
    const q = query.toLowerCase().replace(/\s/g, "");
    setResults(
      MOCK_RESULTS.filter((r) =>
        r.flightNumber.toLowerCase().replace(/\s/g, "").includes(q) ||
        r.route.toLowerCase().includes(q) ||
        r.routeAr.includes(q)
      )
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bg-alt pt-18 pb-20 lg:pb-0" dir={isRTL ? "rtl" : "ltr"}>
        {/* Hero */}
        <section className="bg-brand-red text-white py-14 sm:py-20">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              {isAr ? "حالة الرحلة" : "Flight Status"}
            </h1>
            <p className="text-white/80">
              {isAr ? "تتبّع رحلتك في الوقت الفعلي" : "Track your flight in real time"}
            </p>
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-4 py-10">
          {/* Search card */}
          <div className="bg-white rounded-2xl border border-border-light p-6 mb-8">
            {/* Tabs */}
            <div className="flex gap-1 mb-5 border-b border-border-light">
              {(["flight-number", "route"] as SearchType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setSearchType(t); setSearched(false); }}
                  className={cn(
                    "px-4 py-2 text-sm font-semibold -mb-px border-b-2 transition-colors",
                    searchType === t
                      ? "border-brand-red text-brand-red"
                      : "border-transparent text-text-muted hover:text-text-primary"
                  )}
                >
                  {t === "flight-number"
                    ? isAr ? "رقم الرحلة" : "Flight Number"
                    : isAr ? "المسار" : "Route"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearch} className="flex gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  searchType === "flight-number"
                    ? isAr ? "مثال: SP 101" : "e.g. SP 101"
                    : isAr ? "مثال: القاهرة" : "e.g. Cairo"
                }
                className={cn(
                  "flex-1 h-11 px-4 border border-border-light rounded-xl text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition",
                  isAr ? "text-right" : ""
                )}
              />
              <button
                type="submit"
                className="px-6 h-11 bg-brand-red text-white text-sm font-semibold rounded-xl hover:bg-brand-red-dark transition-colors shrink-0"
              >
                {isAr ? "بحث" : "Search"}
              </button>
            </form>
          </div>

          {/* Results */}
          {searched && (
            results.length === 0 ? (
              <p className="text-center text-text-secondary text-sm py-10">
                {isAr ? "لا توجد نتائج" : "No flights found"}
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {results.map((r) => {
                  const s = STATUS_CONFIG[r.status];
                  return (
                    <div key={r.flightNumber} className="bg-white rounded-2xl border border-border-light p-5">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <p className="font-bold text-lg text-text-primary">{r.flightNumber}</p>
                          <p className="text-sm text-text-secondary mt-0.5">
                            {isAr ? r.routeAr : r.route}
                          </p>
                        </div>
                        <span className={cn("text-xs font-semibold px-3 py-1 rounded-full border shrink-0", s.color)}>
                          {isAr ? s.ar : s.en}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-text-muted mb-0.5">{isAr ? "المقرر" : "Scheduled"}</p>
                          <p className="font-semibold">{r.scheduled}</p>
                        </div>
                        <div>
                          <p className="text-xs text-text-muted mb-0.5">{isAr ? "المتوقع" : "Estimated"}</p>
                          <p className={cn("font-semibold", r.scheduled !== r.estimated ? "text-amber-600" : "")}>
                            {r.estimated}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-text-muted mb-0.5">{isAr ? "الصالة" : "Terminal"}</p>
                          <p className="font-semibold">{r.terminal}</p>
                        </div>
                        <div>
                          <p className="text-xs text-text-muted mb-0.5">{isAr ? "البوابة" : "Gate"}</p>
                          <p className="font-semibold">{r.gate}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {!searched && (
            <p className="text-center text-text-muted text-sm py-8">
              {isAr ? "أدخل رقم الرحلة أو المسار للبحث" : "Enter a flight number or route to search"}
            </p>
          )}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
