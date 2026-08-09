"use client";

import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";

const ROUTES = [
  { from: "Cairo", fromAr: "القاهرة", to: "Sharm el-Sheikh", toAr: "شرم الشيخ", duration: "1h 05m", freq: "Daily", freqAr: "يومياً", code: "CAI→SSH" },
  { from: "Cairo", fromAr: "القاهرة", to: "Hurghada", toAr: "الغردقة", duration: "1h 00m", freq: "Daily", freqAr: "يومياً", code: "CAI→HRG" },
  { from: "Cairo", fromAr: "القاهرة", to: "Luxor", toAr: "الأقصر", duration: "1h 10m", freq: "3×/week", freqAr: "3 مرات أسبوعياً", code: "CAI→LXR" },
  { from: "Cairo", fromAr: "القاهرة", to: "Aswan", toAr: "أسوان", duration: "1h 25m", freq: "3×/week", freqAr: "3 مرات أسبوعياً", code: "CAI→ASW" },
  { from: "Cairo", fromAr: "القاهرة", to: "Marsa Alam", toAr: "مرسى علم", duration: "1h 20m", freq: "4×/week", freqAr: "4 مرات أسبوعياً", code: "CAI→RMF" },
  { from: "Cairo", fromAr: "القاهرة", to: "Alexandria", toAr: "الإسكندرية", duration: "0h 50m", freq: "Daily", freqAr: "يومياً", code: "CAI→HBE" },
  { from: "Kuwait", fromAr: "الكويت", to: "Cairo", toAr: "القاهرة", duration: "2h 45m", freq: "4×/week", freqAr: "4 مرات أسبوعياً", code: "KWI→CAI" },
  { from: "Cairo", fromAr: "القاهرة", to: "Budapest", toAr: "بودابست", duration: "4h 15m", freq: "2×/week", freqAr: "مرتان أسبوعياً", code: "CAI→BUD" },
];

const HUBS = [
  { code: "CAI", city: "Cairo", cityAr: "القاهرة", country: "Egypt", countryAr: "مصر", routes: 7 },
  { code: "SSH", city: "Sharm el-Sheikh", cityAr: "شرم الشيخ", country: "Egypt", countryAr: "مصر", routes: 1 },
  { code: "HRG", city: "Hurghada", cityAr: "الغردقة", country: "Egypt", countryAr: "مصر", routes: 1 },
  { code: "LXR", city: "Luxor", cityAr: "الأقصر", country: "Egypt", countryAr: "مصر", routes: 1 },
  { code: "ASW", city: "Aswan", cityAr: "أسوان", country: "Egypt", countryAr: "مصر", routes: 1 },
  { code: "RMF", city: "Marsa Alam", cityAr: "مرسى علم", country: "Egypt", countryAr: "مصر", routes: 1 },
  { code: "HBE", city: "Alexandria", cityAr: "الإسكندرية", country: "Egypt", countryAr: "مصر", routes: 1 },
  { code: "KWI", city: "Kuwait City", cityAr: "الكويت", country: "Kuwait", countryAr: "الكويت", routes: 1 },
  { code: "BUD", city: "Budapest", cityAr: "بودابست", country: "Hungary", countryAr: "المجر", routes: 1 },
];

export default function RouteMapPage() {
  const { locale, isRTL } = useI18n();
  const isAr = locale === "ar";

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bg-alt pt-18 pb-20 lg:pb-0" dir={isRTL ? "rtl" : "ltr"}>
        {/* Hero */}
        <section className="bg-brand-red text-white py-14 sm:py-20">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              {isAr ? "خريطة الرحلات" : "Route Map"}
            </h1>
            <p className="text-white/80">
              {isAr
                ? `${ROUTES.length} خط طيران يصلك بأجمل الوجهات`
                : `${ROUTES.length} routes connecting you to the best destinations`}
            </p>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 py-10 lg:py-14">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              { value: ROUTES.length, labelAr: "خط طيران", labelEn: "Routes" },
              { value: HUBS.length, labelAr: "مطار", labelEn: "Airports" },
              { value: 4, labelAr: "دول", labelEn: "Countries" },
            ].map((s) => (
              <div key={s.labelEn} className="bg-white rounded-2xl border border-border-light p-5 text-center">
                <p className="text-3xl font-extrabold text-brand-red">{s.value}</p>
                <p className="text-sm text-text-secondary mt-1">{isAr ? s.labelAr : s.labelEn}</p>
              </div>
            ))}
          </div>

          {/* Routes table */}
          <div className="bg-white rounded-2xl border border-border-light overflow-hidden mb-10">
            <div className="px-5 py-4 border-b border-border-light">
              <h2 className="font-bold text-text-primary">
                {isAr ? "جميع الخطوط" : "All Routes"}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-bg-alt text-text-secondary text-xs uppercase">
                  <tr>
                    <th className={cn("px-5 py-3 font-semibold", isAr ? "text-right" : "text-left")}>{isAr ? "من" : "From"}</th>
                    <th className={cn("px-5 py-3 font-semibold", isAr ? "text-right" : "text-left")}>{isAr ? "إلى" : "To"}</th>
                    <th className={cn("px-5 py-3 font-semibold", isAr ? "text-right" : "text-left")}>{isAr ? "المدة" : "Duration"}</th>
                    <th className={cn("px-5 py-3 font-semibold", isAr ? "text-right" : "text-left")}>{isAr ? "التكرار" : "Frequency"}</th>
                    <th className={cn("px-5 py-3 font-semibold", isAr ? "text-right" : "text-left")}>{isAr ? "الرمز" : "Code"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {ROUTES.map((r) => (
                    <tr key={r.code} className="hover:bg-bg-alt/50 transition-colors">
                      <td className={cn("px-5 py-3.5 font-medium text-text-primary", isAr ? "text-right" : "")}>{isAr ? r.fromAr : r.from}</td>
                      <td className={cn("px-5 py-3.5 font-medium text-text-primary", isAr ? "text-right" : "")}>{isAr ? r.toAr : r.to}</td>
                      <td className={cn("px-5 py-3.5 text-text-secondary tabular-nums", isAr ? "text-right" : "")}>{r.duration}</td>
                      <td className={cn("px-5 py-3.5 text-text-secondary", isAr ? "text-right" : "")}>{isAr ? r.freqAr : r.freq}</td>
                      <td className={cn("px-5 py-3.5 font-mono text-xs text-text-muted", isAr ? "text-right" : "")}>{r.code}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Airports */}
          <h2 className={cn("font-bold text-xl text-text-primary mb-5", isAr ? "text-right" : "")}>
            {isAr ? "المطارات" : "Airports"}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {HUBS.map((h) => (
              <div key={h.code} className="bg-white rounded-xl border border-border-light p-4">
                <p className="text-2xl font-extrabold text-brand-red tabular-nums">{h.code}</p>
                <p className="font-semibold text-sm text-text-primary mt-1">{isAr ? h.cityAr : h.city}</p>
                <p className="text-xs text-text-muted">{isAr ? h.countryAr : h.country}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
