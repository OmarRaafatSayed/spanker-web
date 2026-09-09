"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";

const OFFER_TYPES = ["الكل", "طيران", "فنادق", "تأشيرات", "باقات"];

const OFFERS = [
  {
    id: 1,
    type: "باقات",
    badge: "🔥 الأكثر مبيعاً",
    badgeColor: "bg-red-500",
    title: "باقة البحر الأحمر الشاملة",
    destination: "الغردقة",
    duration: "٥ أيام / ٤ ليالٍ",
    originalPrice: 8500,
    price: 5950,
    discount: 30,
    includes: ["✈️ طيران ذهاب وعودة", "🏨 فندق ٥ نجوم", "🤿 رحلة غوص", "🍽️ إفطار وعشاء"],
    validUntil: "٣١ مارس ٢٠٢٥",
    emoji: "🏖️",
  },
  {
    id: 2,
    type: "طيران",
    badge: "⚡ عرض محدود",
    badgeColor: "bg-amber-500",
    title: "تذاكر دبي بنص السعر",
    destination: "دبي",
    duration: "ذهاب وعودة",
    originalPrice: 4200,
    price: 2100,
    discount: 50,
    includes: ["✈️ طيران ذهاب وعودة", "🧳 ٢٣ كجم أمتعة", "💺 درجة سياحية"],
    validUntil: "١٥ فبراير ٢٠٢٥",
    emoji: "🌆",
  },
  {
    id: 3,
    type: "فنادق",
    badge: "✨ جديد",
    badgeColor: "bg-purple-500",
    title: "فنادق شرم ٥ نجوم",
    destination: "شرم الشيخ",
    duration: "٣ ليالٍ",
    originalPrice: 3600,
    price: 2520,
    discount: 30,
    includes: ["🏨 فندق ٥ نجوم", "🍽️ إقامة كاملة", "🏊 استخدام المسبح والسبا"],
    validUntil: "٢٨ فبراير ٢٠٢٥",
    emoji: "🤿",
  },
  {
    id: 4,
    type: "باقات",
    badge: "🌟 موصى به",
    badgeColor: "bg-brand-green",
    title: "رحلة الأقصر الفرعونية",
    destination: "الأقصر وأسوان",
    duration: "٧ أيام / ٦ ليالٍ",
    originalPrice: 12000,
    price: 8400,
    discount: 30,
    includes: ["✈️ طيران داخلي", "🛳️ كروز النيل", "🏛️ جولات المعابد", "🍽️ وجبات كاملة"],
    validUntil: "٣٠ أبريل ٢٠٢٥",
    emoji: "🏛️",
  },
  {
    id: 5,
    type: "تأشيرات",
    badge: "💼 سريع",
    badgeColor: "bg-blue-500",
    title: "تأشيرة تركيا السياحية",
    destination: "إسطنبول",
    duration: "٣٠ يوم",
    originalPrice: 2500,
    price: 1750,
    discount: 30,
    includes: ["🛂 تأشيرة ٣٠ يوم", "⚡ معالجة ٣ أيام", "🔄 قابلة للتجديد"],
    validUntil: "٣١ مارس ٢٠٢٥",
    emoji: "🕌",
  },
  {
    id: 6,
    type: "باقات",
    badge: "🌴 صيفي",
    badgeColor: "bg-teal-500",
    title: "باقة سيوة الطبيعية",
    destination: "واحة سيوة",
    duration: "٤ أيام / ٣ ليالٍ",
    originalPrice: 4800,
    price: 3360,
    discount: 30,
    includes: ["🚌 نقل من القاهرة", "🏕️ إقامة فندقية", "🌴 جولات صحراوية", "🍽️ وجبات"],
    validUntil: "٣٠ يونيو ٢٠٢٥",
    emoji: "🌴",
  },
];

const VERTICAL_HREF: Record<string, string> = {
  "باقات": "tours",
  "طيران": "book-flight",
  "فنادق": "hotel-booking",
  "تأشيرات": "visa-application",
};

export default function SpecialOffersPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "ar";
  const [activeType, setActiveType] = useState("الكل");

  const filtered = activeType === "الكل" ? OFFERS : OFFERS.filter((o) => o.type === activeType);

  return (
    <PageShell
      pageId="special-offers"
      title="العروض والوجهات"
      subtitle="أفضل الأسعار على رحلات الطيران والفنادق والرحلات السياحية"
      maxWidth="xl"
    >
      {/* Type filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {OFFER_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`text-sm px-4 py-1.5 rounded-full border font-medium transition-all ${
              activeType === type
                ? "bg-brand-green text-white border-brand-green"
                : "border-border-default text-text-secondary hover:border-brand-green/40"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Offers grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((offer) => (
          <div key={offer.id} className="bg-white rounded-2xl border border-border-light overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5">
            {/* Hero */}
            <div className="relative h-40 bg-gradient-to-br from-brand-green to-brand-green-dark flex items-center justify-center">
              <span className="text-6xl">{offer.emoji}</span>
              <div className="absolute top-3 right-3">
                <span className={`text-xs text-white font-bold px-2.5 py-1 rounded-full ${offer.badgeColor}`}>
                  {offer.badge}
                </span>
              </div>
              <div className="absolute top-3 left-3 bg-white text-brand-green font-black text-sm px-2 py-0.5 rounded-full">
                -{offer.discount}٪
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              <p className="text-xs text-text-muted mb-1">{offer.destination} • {offer.duration}</p>
              <h3 className="font-bold text-text-primary mb-3">{offer.title}</h3>

              <div className="space-y-1 mb-4">
                {offer.includes.map((item, i) => (
                  <p key={i} className="text-xs text-text-secondary">{item}</p>
                ))}
              </div>

              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-xs text-text-muted line-through">{offer.originalPrice.toLocaleString()} ج.م</p>
                  <p className="text-2xl font-bold text-brand-green">{offer.price.toLocaleString()} ج.م</p>
                </div>
                <p className="text-xs text-text-muted text-left">ينتهي<br />{offer.validUntil}</p>
              </div>

              <Link
                href={`/${locale}/${VERTICAL_HREF[offer.type] ?? "book-flight"}`}
                className="block w-full text-center py-2.5 rounded-xl bg-brand-green text-white text-sm font-bold hover:bg-brand-green-dark transition-colors"
              >
                احجز الآن
              </Link>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
