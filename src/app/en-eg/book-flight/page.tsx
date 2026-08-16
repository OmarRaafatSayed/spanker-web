"use client";

import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";

const features = [
  {
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
        <path d="M8 12l2 2 4-4" />
      </svg>
    ),
    title: "أفضل الأسعار",
    titleEn: "Best Prices",
    desc: "نضمن لك أقل الأسعار على جميع الرحلات الداخلية والدولية. إذا وجدت سعراً أفضل، سنطابقه فوراً.",
  },
  {
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.24h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.78a16 16 0 0 0 6 6l.95-.95a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
    title: "دعم ٢٤/٧",
    titleEn: "24/7 Support",
    desc: "فريق خدمة العملاء متاح على مدار الساعة طوال أيام الأسبوع للإجابة على استفساراتك وحل أي مشكلة.",
  },
  {
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 12l2 2 4-4" />
        <path d="M21 12c0 4.97-4.03 9-9 9S3 16.97 3 12 7.03 3 12 3s9 4.03 9 9z" />
      </svg>
    ),
    title: "تأكيد فوري",
    titleEn: "Instant Confirmation",
    desc: "استلم تأكيد حجزك فوراً عبر البريد الإلكتروني والرسائل النصية بمجرد إتمام عملية الدفع.",
  },
];

const steps = [
  { num: "١", title: "اختر وجهتك", desc: "استخدم محرك البحث لاختيار نقطة المغادرة والوجهة وتاريخ السفر." },
  { num: "٢", title: "قارن الرحلات", desc: "استعرض الخيارات المتاحة وقارن الأسعار ومواعيد الإقلاع والوصول." },
  { num: "٣", title: "أدخل بيانات المسافرين", desc: "أدخل بيانات المسافرين بدقة كما تظهر في جواز السفر أو البطاقة الشخصية." },
  { num: "٤", title: "أتمم الدفع", desc: "ادفع بأمان باستخدام البطاقة الائتمانية أو المدينة أو فودافون كاش أو إنستاباي." },
];

export default function BookFlightPage() {
  return (
    <PageShell
      pageId="book-flight"
      heroTitle="احجز رحلتك"
      heroSubtitle="ابحث عن أفضل الرحلات واحجز بسهولة وأمان"
      maxWidth="xl"
      heroIcon={
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2c-.5.1-.9.6-.6 1.1l1.5 2.5c.2.4.7.6 1.1.5L8 9.5l-2 3.5L4 14c-.4.3-.4.8 0 1l2 2c.3.4.8.4 1 0l1.5-2 3.5-2-.5 4.2c-.1.5.2.9.7 1l2.5 1.5c.5.3 1 0 1.1-.5z" />
        </svg>
      }
    >
      {/* CTA Section */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center mb-10">
        <h2 className="text-2xl font-bold text-white mb-2">Book Your Flight</h2>
        <p className="text-white/65 text-sm mb-6 max-w-lg mx-auto">
          استخدم محرك البحث في الصفحة الرئيسية للعثور على أفضل الرحلات المتاحة من وإلى مصر وأوروبا والشرق الأوسط.
        </p>
        <Link
          href="/"
          className="inline-block bg-brand-green text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-green-dark transition-colors"
        >
          ابحث عن رحلتك الآن
        </Link>
      </div>

      {/* Steps */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-white mb-6">كيف تحجز رحلتك؟</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {steps.map((s) => (
            <div key={s.num} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-green/20 border border-brand-green/40 flex items-center justify-center text-brand-yellow font-black text-lg shrink-0">
                {s.num}
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">{s.title}</h3>
                <p className="text-white/65 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Cards */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-white mb-6">لماذا تحجز مع سبانكر؟</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-brand-green/20 border border-brand-green/30 flex items-center justify-center mx-auto mb-4 text-brand-green">
                {f.icon}
              </div>
              <h3 className="font-bold text-white mb-1">{f.title}</h3>
              <p className="text-xs font-semibold text-brand-yellow mb-2">{f.titleEn}</p>
              <p className="text-white/65 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Payment methods */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">وسائل الدفع المقبولة</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {["Visa / Mastercard", "فيزا مباشر", "فودافون كاش", "إنستاباي"].map((m) => (
            <div key={m} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <p className="text-white/80 text-sm font-semibold">{m}</p>
            </div>
          ))}
        </div>
        <p className="text-white/50 text-xs mt-4">
          ✓ جميع المعاملات مشفرة ومؤمّنة بتقنية SSL 256-bit
        </p>
      </div>
    </PageShell>
  );
}
