"use client";

import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";

const offers = [
  {
    city: "القاهرة",
    cityEn: "Cairo",
    country: "مصر",
    flag: "🇪🇬",
    price: "١٫٥٠٠",
    priceNum: 1500,
    originalPrice: "٢٫٢٠٠",
    discount: 32,
    validity: "حتى ٣١ ديسمبر",
    features: ["أمتعة ٢٠ كجم", "تأكيد فوري", "قابل للإلغاء"],
    gradient: "from-[#1a4a2e] to-[#0f2a1a]",
  },
  {
    city: "الغردقة",
    cityEn: "Hurghada",
    country: "مصر",
    flag: "🇪🇬",
    price: "٢٫٢٠٠",
    priceNum: 2200,
    originalPrice: "٣٫١٠٠",
    discount: 29,
    validity: "حتى ٢٨ فبراير",
    features: ["أمتعة ٢٠ كجم", "مرونة في التغيير", "تأكيد فوري"],
    gradient: "from-[#1a3a4a] to-[#0f1a2a]",
  },
  {
    city: "شرم الشيخ",
    cityEn: "Sharm el-Sheikh",
    country: "مصر",
    flag: "🇪🇬",
    price: "٢٫٨٠٠",
    priceNum: 2800,
    originalPrice: "٣٫٩٠٠",
    discount: 28,
    validity: "حتى ٣٠ يناير",
    features: ["أمتعة ٢٠ كجم", "تأكيد فوري", "وجبة مجانية"],
    gradient: "from-[#2a1a4a] to-[#1a0f2a]",
  },
  {
    city: "دبي",
    cityEn: "Dubai",
    country: "الإمارات",
    flag: "🇦🇪",
    price: "٨٫٥٠٠",
    priceNum: 8500,
    originalPrice: "١١٫٩٠٠",
    discount: 29,
    validity: "حتى ١٥ مارس",
    features: ["أمتعة ٣٠ كجم", "وجبتان", "ترفيه على متن الطائرة"],
    gradient: "from-[#4a3a1a] to-[#2a1f0a]",
    featured: true,
  },
  {
    city: "إسطنبول",
    cityEn: "Istanbul",
    country: "تركيا",
    flag: "🇹🇷",
    price: "٦٫٥٠٠",
    priceNum: 6500,
    originalPrice: "٨٫٩٠٠",
    discount: 27,
    validity: "حتى ٢٨ فبراير",
    features: ["أمتعة ٢٥ كجم", "وجبة مجانية", "تأكيد فوري"],
    gradient: "from-[#4a1a1a] to-[#2a0f0f]",
  },
  {
    city: "بودابست",
    cityEn: "Budapest",
    country: "المجر",
    flag: "🇭🇺",
    price: "٦٫٤٨١",
    priceNum: 6481,
    originalPrice: "٩٫٢٠٠",
    discount: 30,
    validity: "حتى ٣١ يناير",
    features: ["أمتعة ٢٣ كجم", "وجبة مجانية", "مرونة في التغيير"],
    gradient: "from-[#1a2a4a] to-[#0f1a2f]",
    featured: true,
  },
];

export default function SpecialOffersPage() {
  return (
    <PageShell
      pageId="special-offers"
      heroTitle="العروض الخاصة"
      heroSubtitle="أفضل الأسعار على رحلاتنا الداخلية والدولية"
      maxWidth="xl"
      heroIcon={
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      }
    >
      {/* Alert Banner */}
      <div className="bg-brand-yellow/10 border border-brand-yellow/30 rounded-2xl p-4 mb-8 flex items-center gap-3">
        <span className="text-brand-yellow text-lg shrink-0">🔥</span>
        <p className="text-white/80 text-sm">
          <span className="text-brand-yellow font-bold">عروض محدودة!</span> الأسعار المعروضة للرحلة ذهاباً، تشمل الضرائب والرسوم. الحجز حتى نفاد الأماكن.
        </p>
      </div>

      {/* Offers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {offers.map((offer) => (
          <div
            key={offer.city}
            className={`relative bg-white/5 border rounded-2xl overflow-hidden ${offer.featured ? "border-brand-yellow/40 ring-1 ring-brand-yellow/20" : "border-white/10"}`}
          >
            {/* Image Placeholder with Gradient */}
            <div className={`h-36 bg-gradient-to-br ${offer.gradient} flex items-end p-4 relative`}>
              <span className="text-4xl absolute top-3 right-4">{offer.flag}</span>
              {offer.featured && (
                <span className="absolute top-3 left-3 bg-brand-yellow text-[#0f1a0b] text-xs font-black px-2.5 py-1 rounded-full">
                  مميّز ⭐
                </span>
              )}
              <div>
                <h3 className="text-white font-black text-xl leading-tight">{offer.city}</h3>
                <p className="text-white/60 text-xs">{offer.cityEn} · {offer.country}</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-white/40 line-through text-xs">{offer.originalPrice} ج.م</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-brand-yellow font-black text-2xl">{offer.price}</span>
                    <span className="text-white/60 text-xs">ج.م</span>
                  </div>
                </div>
                <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-black px-2.5 py-1 rounded-full">
                  -{offer.discount}%
                </span>
              </div>

              <ul className="space-y-1.5 mb-4">
                {offer.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-white/60 text-xs">
                    <span className="text-brand-green shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <p className="text-white/40 text-xs mb-4">📅 {offer.validity}</p>

              <Link
                href="/"
                className="block text-center bg-brand-green text-white py-2.5 rounded-xl font-bold hover:bg-brand-green-dark transition-colors text-sm"
              >
                احجز الآن
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Terms */}
      <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-5">
        <h3 className="font-bold text-white mb-2 text-sm">الشروط والأحكام</h3>
        <ul className="space-y-1">
          {[
            "الأسعار للفرد الواحد ذهاباً وإياباً، تشمل الضرائب والرسوم.",
            "الحجز محدود حتى نفاد الأماكن المتاحة.",
            "قد يختلف السعر حسب تاريخ السفر والتوافر.",
            "الاسترداد وفق سياسة الإلغاء المعتمدة لكل تذكرة.",
          ].map((t, i) => (
            <li key={i} className="text-white/45 text-xs flex gap-2">
              <span>•</span> {t}
            </li>
          ))}
        </ul>
      </div>
    </PageShell>
  );
}
