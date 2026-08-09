"use client";

import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";

const COUNTERS = [
  { terminal: "T2 — Cairo Int'l", terminalAr: "T2 — القاهرة الدولي", counters: "F1–F12", hours: "3h before departure", hoursAr: "3 ساعات قبل الإقلاع" },
  { terminal: "T1 — Hurghada Int'l", terminalAr: "T1 — مطار الغردقة الدولي", counters: "B1–B4", hours: "2.5h before departure", hoursAr: "2.5 ساعة قبل الإقلاع" },
  { terminal: "T1 — Sharm el-Sheikh", terminalAr: "T1 — شرم الشيخ", counters: "C1–C6", hours: "2.5h before departure", hoursAr: "2.5 ساعة قبل الإقلاع" },
];

const DOCS = [
  { en: "Valid passport (min. 6 months validity)", ar: "جواز سفر ساري (6 أشهر على الأقل)" },
  { en: "Booking confirmation / e-ticket", ar: "تأكيد الحجز / التذكرة الإلكترونية" },
  { en: "Visa (if required for destination)", ar: "التأشيرة (إن كانت مطلوبة للوجهة)" },
  { en: "Valid ID or national card", ar: "هوية سارية أو بطاقة قومية" },
];

export default function AirportCheckinPage() {
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
              {isAr ? "تسجيل الوصول بالمطار" : "Airport Check-in"}
            </h1>
            <p className="text-white/80">
              {isAr
                ? "اعرف مكان كاونترات سبانكر ومستنداتك المطلوبة"
                : "Find Spanker check-in counters and required documents"}
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col gap-10">
          {/* Check-in counters */}
          <div>
            <h2 className={cn("text-xl font-bold text-text-primary mb-5", isAr ? "text-right" : "")}>
              {isAr ? "كاونترات تسجيل الوصول" : "Check-in Counters"}
            </h2>
            <div className="flex flex-col gap-4">
              {COUNTERS.map((c) => (
                <div key={c.terminal} className="bg-white rounded-2xl border border-border-light p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-text-primary">{isAr ? c.terminalAr : c.terminal}</h3>
                      <p className="text-sm text-text-secondary mt-1">
                        {isAr ? "الكاونترات" : "Counters"}: <span className="font-semibold text-text-primary font-mono">{c.counters}</span>
                      </p>
                    </div>
                    <span className="text-xs bg-brand-red/10 text-brand-red font-medium px-3 py-1 rounded-full shrink-0">
                      {isAr ? c.hoursAr : c.hours}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Required documents */}
          <div>
            <h2 className={cn("text-xl font-bold text-text-primary mb-5", isAr ? "text-right" : "")}>
              {isAr ? "المستندات المطلوبة" : "Required Documents"}
            </h2>
            <div className="bg-white rounded-2xl border border-border-light p-6">
              <ul className="flex flex-col gap-3">
                {DOCS.map((d, i) => (
                  <li key={i} className={cn("flex items-start gap-3 text-sm text-text-secondary", isAr ? "flex-row-reverse text-right" : "")}>
                    <svg className="w-5 h-5 text-brand-red shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {isAr ? d.ar : d.en}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Tip */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-3">
            <span className="text-2xl shrink-0">⏰</span>
            <p className={cn("text-sm text-amber-800 leading-relaxed", isAr ? "text-right" : "")}>
              {isAr
                ? "يُنصح بالوصول إلى المطار قبل موعد إقلاع رحلتك بـ 3 ساعات على الأقل للرحلات الدولية وساعتين للرحلات الداخلية."
                : "We recommend arriving at the airport at least 3 hours before your international flight and 2 hours before domestic flights."}
            </p>
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
