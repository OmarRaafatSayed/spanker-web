"use client";

import { PageShell } from "@/components/layout/PageShell";

const destinations = [
  { city: "القاهرة", cityEn: "Cairo", country: "مصر", flag: "🇪🇬", code: "CAI", freq: "يومياً", type: "domestic" },
  { city: "الغردقة", cityEn: "Hurghada", country: "مصر", flag: "🇪🇬", code: "HRG", freq: "يومياً", type: "domestic" },
  { city: "شرم الشيخ", cityEn: "Sharm el-Sheikh", country: "مصر", flag: "🇪🇬", code: "SSH", freq: "يومياً", type: "domestic" },
  { city: "الأقصر", cityEn: "Luxor", country: "مصر", flag: "🇪🇬", code: "LXR", freq: "٣× أسبوعياً", type: "domestic" },
  { city: "أسوان", cityEn: "Aswan", country: "مصر", flag: "🇪🇬", code: "ASW", freq: "٤× أسبوعياً", type: "domestic" },
  { city: "الإسكندرية", cityEn: "Alexandria", country: "مصر", flag: "🇪🇬", code: "ALY", freq: "٥× أسبوعياً", type: "domestic" },
  { city: "مرسى علم", cityEn: "Marsa Alam", country: "مصر", flag: "🇪🇬", code: "RMF", freq: "٢× أسبوعياً", type: "domestic" },
  { city: "دبي", cityEn: "Dubai", country: "الإمارات", flag: "🇦🇪", code: "DXB", freq: "يومياً", type: "international" },
  { city: "إسطنبول", cityEn: "Istanbul", country: "تركيا", flag: "🇹🇷", code: "IST", freq: "٥× أسبوعياً", type: "international" },
  { city: "بودابست", cityEn: "Budapest", country: "المجر", flag: "🇭🇺", code: "BUD", freq: "٣× أسبوعياً", type: "international" },
  { city: "لندن", cityEn: "London", country: "المملكة المتحدة", flag: "🇬🇧", code: "LHR", freq: "٤× أسبوعياً", type: "international" },
  { city: "باريس", cityEn: "Paris", country: "فرنسا", flag: "🇫🇷", code: "CDG", freq: "٣× أسبوعياً", type: "international" },
];

export default function RouteMapPage() {
  const domestic = destinations.filter((d) => d.type === "domestic");
  const international = destinations.filter((d) => d.type === "international");

  return (
    <PageShell
      pageId="route-map"
      heroTitle="خريطة الرحلات"
      heroSubtitle="استكشف وجهاتنا الداخلية والدولية"
      maxWidth="xl"
      heroIcon={
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <polygon points="3 11 22 2 13 21 11 13 3 11" />
        </svg>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
          <p className="text-brand-yellow font-black text-4xl mb-1">٢٠+</p>
          <p className="text-white/60 text-sm">وجهة</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
          <p className="text-brand-yellow font-black text-4xl mb-1">١٢</p>
          <p className="text-white/60 text-sm">رحلة يومية</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
          <p className="text-brand-yellow font-black text-4xl mb-1">٨</p>
          <p className="text-white/60 text-sm">دول</p>
        </div>
      </div>

      {/* Domestic */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-xl font-bold text-white">الرحلات الداخلية</h2>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-brand-green/20 text-brand-green">
            {domestic.length} وجهة
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {domestic.map((d) => (
            <div key={d.code} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{d.flag}</span>
                <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-white/10 text-white/60">{d.code}</span>
              </div>
              <h3 className="font-bold text-white text-base mb-0.5">{d.city}</h3>
              <p className="text-white/50 text-xs mb-3">{d.cityEn} · {d.country}</p>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-green shrink-0" />
                <span className="text-brand-green text-xs font-semibold">{d.freq}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* International */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-xl font-bold text-white">الرحلات الدولية</h2>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/20 text-blue-400">
            {international.length} وجهة
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {international.map((d) => (
            <div key={d.code} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{d.flag}</span>
                <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-white/10 text-white/60">{d.code}</span>
              </div>
              <h3 className="font-bold text-white text-base mb-0.5">{d.city}</h3>
              <p className="text-white/50 text-xs mb-3">{d.cityEn} · {d.country}</p>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                <span className="text-blue-400 text-xs font-semibold">{d.freq}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-5">
        <p className="text-white/50 text-xs leading-relaxed text-center">
          * جداول الرحلات قابلة للتغيير حسب الموسم والطلب. تحقق من مواعيد الرحلات الحالية عند الحجز.
          جميع الأوقات بالتوقيت المحلي لكل وجهة.
        </p>
      </div>
    </PageShell>
  );
}
