"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";

const DIFFICULTY_META: Record<string, { label: string; color: string; icon: string }> = {
  easy:        { label: "سهل",   color: "bg-green-100 text-green-700 border-green-200",   icon: "🟢" },
  moderate:    { label: "متوسط", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: "🟡" },
  challenging: { label: "صعب",   color: "bg-red-100 text-red-700 border-red-200",         icon: "🔴" },
};

const COUNTRY_FLAG: Record<string, string> = {
  "فرنسا": "🇫🇷", "تركيا": "🇹🇷", "الإمارات": "🇦🇪",
  "رومانيا": "🇷🇴", "المجر": "🇭🇺", "مصر": "🇪🇬",
};

const TABS = [
  { id: "itinerary", label: "البرنامج اليومي" },
  { id: "includes",  label: "يشمل / لا يشمل" },
  { id: "pricing",   label: "الأسعار" },
  { id: "notes",     label: "ملاحظات مهمة" },
];

export default function TourDetailPage() {
  const params = useParams();
  const { isRTL } = useI18n();
  const locale = (params?.locale as string) || "ar";
  const slug = params?.slug as string;

  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("itinerary");

  useEffect(() => {
    fetch("/api/v1/trips/search")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          const found = (j.data || []).find((t: any) => t.slug === slug);
          setTrip(found || null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-alt flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-brand-green border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-text-muted text-sm">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-bg-alt flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-4xl mb-3">🗺️</div>
          <p className="text-text-primary font-bold mb-2">الرحلة غير موجودة</p>
          <Link href={`/${locale}/tours`} className="text-brand-green text-sm font-semibold hover:underline">
            ← العودة للرحلات
          </Link>
        </div>
      </div>
    );
  }

  const diff = DIFFICULTY_META[trip.difficulty] ?? { label: trip.difficulty, color: "bg-muted text-text-muted border-border-light", icon: "⚪" };
  const flag = COUNTRY_FLAG[trip.country] ?? "🌍";

  // Pricing tiers
  const priceSingle = Math.round(trip.price_per_person * 1.35);
  const priceDouble = trip.price_per_person;
  const priceTriple = Math.round(trip.price_per_person * 0.92);
  const priceChild  = Math.round(trip.price_per_person * 0.75);
  const priceInfant = Math.round(trip.price_per_person * 0.15);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-bg-alt pt-16 pb-28" dir={isRTL ? "rtl" : "ltr"}>
      {/* Back button + hero */}
      <div className="bg-brand-dark px-4 pt-12 pb-6">
        <Link
          href={`/${locale}/tours`}
          className="inline-flex items-center gap-2 text-white/70 text-sm hover:text-white transition mb-4"
        >
          <span className={isRTL ? "" : "rotate-180"}>←</span>
          الرحلات السياحية
        </Link>

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {trip.is_featured && (
                <span className="text-xs bg-brand-yellow/20 text-brand-yellow font-bold px-2 py-0.5 rounded-full border border-brand-yellow/30">
                  ⭐ عرض مميز
                </span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${diff.color}`}>
                {diff.icon} {diff.label}
              </span>
            </div>
            <h1 className="text-xl font-bold text-white leading-snug">{trip.title_ar}</h1>
            <p className="text-white/60 text-sm mt-1">
              {flag} {trip.destination} • {trip.country}
            </p>
          </div>
          <div className="text-start shrink-0">
            <p className="text-xs text-white/50">يبدأ من</p>
            <p className="text-2xl font-bold text-brand-yellow">{trip.price_per_person?.toLocaleString()}</p>
            <p className="text-xs text-white/50">ج.م / شخص</p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 mt-5">
          {[
            { icon: "🗓", label: "المدة",            value: `${trip.duration_days} أيام` },
            { icon: "👥", label: "المقاعد المتاحة",  value: trip.spots_available },
            { icon: "🚫", label: "إلغاء مجاني",      value: `قبل ${trip.cancellation_days} يوم` },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/8 border border-white/10 rounded-xl p-2.5 text-center">
              <p className="text-lg">{stat.icon}</p>
              <p className="text-white font-bold text-sm">{stat.value}</p>
              <p className="text-white/50 text-[10px]">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Meeting point banner */}
      {trip.meeting_point && (
        <div className="mx-4 mt-4 bg-brand-yellow/10 border border-brand-yellow/30 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-xl">📍</span>
          <div>
            <p className="text-xs font-bold text-brand-yellow mb-0.5">نقطة التجمع والانطلاق</p>
            <p className="text-sm text-text-primary font-semibold">{trip.meeting_point}</p>
            {trip.meeting_time && (
              <p className="text-xs text-text-muted">الساعة {trip.meeting_time}</p>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b border-border-light mt-4 sticky top-16 z-10">
        <div className="max-w-2xl mx-auto px-4 flex gap-1 overflow-x-auto py-2 no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-brand-green text-white"
                  : "text-text-secondary hover:bg-bg-alt"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-2xl mx-auto px-4 py-5">

        {/* ITINERARY TAB */}
        {activeTab === "itinerary" && (
          <div className="space-y-3">
            <h2 className="text-base font-bold text-text-primary mb-4">البرنامج اليومي</h2>
            {trip.itinerary?.map((day: any) => (
              <div key={day.day} className="bg-white rounded-2xl border border-border-light p-4 flex gap-4">
                <div className="shrink-0 w-10 h-10 rounded-full bg-brand-green/10 border border-brand-green/20 flex items-center justify-center text-brand-green font-bold text-sm">
                  {day.day}
                </div>
                <div>
                  <p className="font-bold text-text-primary text-sm">{day.title}</p>
                  {day.description && (
                    <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{day.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* INCLUDES TAB */}
        {activeTab === "includes" && (
          <div className="space-y-4">
            {trip.includes?.length > 0 && (
              <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
                <div className="bg-green-50 px-4 py-3 border-b border-border-light">
                  <p className="font-bold text-green-700 text-sm">✓ العرض يشمل</p>
                </div>
                <div className="p-4 space-y-2">
                  {trip.includes.map((item: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <span className="text-green-600 mt-px shrink-0">✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {trip.excludes?.length > 0 && (
              <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
                <div className="bg-red-50 px-4 py-3 border-b border-border-light">
                  <p className="font-bold text-red-600 text-sm">✗ العرض لا يشمل</p>
                </div>
                <div className="p-4 space-y-2">
                  {trip.excludes.map((item: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <span className="text-red-500 mt-px shrink-0">✗</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PRICING TAB */}
        {activeTab === "pricing" && (
          <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
            <div className="bg-brand-green/8 px-4 py-3 border-b border-border-light">
              <p className="font-bold text-brand-green text-sm">أسعار العرض</p>
            </div>
            <div className="divide-y divide-border-light">
              {[
                { label: "سعر الفرد في الغرفة المزدوجة / الثلاثية", price: priceDouble, highlight: true },
                { label: "سعر الغرفة المفردة",                        price: priceSingle },
                { label: "الثلاثية (3 أشخاص في الغرفة)",              price: priceTriple },
                { label: "الأطفال من 6–11 سنة",                       price: priceChild },
                { label: "الرضيع أقل من سنتين",                       price: priceInfant },
              ].map((row) => (
                <div
                  key={row.label}
                  className={`flex items-center justify-between px-4 py-3 ${row.highlight ? "bg-brand-green/5" : ""}`}
                >
                  <span className={`text-sm ${row.highlight ? "font-bold text-text-primary" : "text-text-secondary"}`}>
                    {row.label}
                  </span>
                  <span className={`font-bold ${row.highlight ? "text-brand-green text-lg" : "text-text-primary"}`}>
                    {row.price.toLocaleString()} ج.م
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NOTES TAB */}
        {activeTab === "notes" && (
          <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
            <div className="bg-brand-yellow/10 px-4 py-3 border-b border-border-light">
              <p className="font-bold text-brand-yellow text-sm">⚠️ ملاحظات مهمة</p>
            </div>
            <div className="p-4 space-y-2.5 text-sm text-text-secondary">
              <p>• الأسعار غير سارية في فترات المؤتمرات والمواسم والأعياد الرسمية</p>
              <p>• يمكن تعديل مدة الرحلة حسب رغبة العميل بزيادة أو نقصان الليالي</p>
              <p>• يُلزم إحضار صورة من جواز السفر ساري المفعول لمدة 6 أشهر على الأقل</p>
              <p>• يُنصح بالتقديم على التأشيرة مبكراً قبل موعد الرحلة بـ 3 أسابيع</p>
              <p>• يتوفر استقبال خاص في شهر العسل حسب الإمكانية عند الوصول</p>
              <p>• جميع الأسعار بالجنيه المصري وقابلة للتغيير عند تقلب أسعار العملة</p>
              <p>• الإلغاء المجاني متاح قبل {trip.cancellation_days} يوم من تاريخ الرحلة</p>
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-20 left-0 right-0 z-40 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-border-light rounded-2xl shadow-xl px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-text-muted">السعر يبدأ من</p>
              <p className="text-xl font-bold text-brand-green">{trip.price_per_person?.toLocaleString()} ج.م</p>
            </div>
            <Link
              href={`/${locale}/tours`}
              className="flex items-center gap-2 bg-brand-green text-white font-bold px-6 py-3 rounded-xl hover:bg-brand-green/90 transition-colors text-sm"
            >
              احجز الآن
              <span className={isRTL ? "rotate-180" : ""}>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
      <Footer />
      <BottomNav />
    </>
  );
}
