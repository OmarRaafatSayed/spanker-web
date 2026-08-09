"use client";

import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { FlightSearchWidget } from "@/components/home/FlightSearchWidget";

export default function BookFlightPage() {
  const { locale, isRTL } = useI18n();
  const isAr = locale === "ar";

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bg-alt pt-18 pb-20 lg:pb-0" dir={isRTL ? "rtl" : "ltr"}>
        {/* Hero */}
        <section className="bg-brand-red text-white py-14 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              {isAr ? "احجز رحلتك" : "Book a Flight"}
            </h1>
            <p className="text-white/80 mb-10">
              {isAr
                ? "أفضل أسعار الرحلات إلى وجهاتك المفضلة"
                : "Best fares to your favourite destinations"}
            </p>
            {/* Widget inside hero */}
            <FlightSearchWidget />
          </div>
        </section>

        {/* How it works */}
        <div className="max-w-4xl mx-auto px-4 py-14">
          <h2 className={cn("text-2xl font-bold text-text-primary mb-8 text-center")}>
            {isAr ? "كيف تحجز؟" : "How to book"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: "01", titleEn: "Search", titleAr: "ابحث", descEn: "Enter your origin, destination and travel dates.", descAr: "أدخل المغادرة والوجهة وتواريخ السفر." },
              { step: "02", titleEn: "Choose", titleAr: "اختر", descEn: "Select the flight and cabin class that suits you.", descAr: "اختر الرحلة ودرجة السفر المناسبة لك." },
              { step: "03", titleEn: "Confirm", titleAr: "أكّد", descEn: "Enter passenger details and complete your booking.", descAr: "أدخل بيانات المسافرين وأتمّ الحجز." },
            ].map((s) => (
              <div key={s.step} className={cn("bg-white rounded-2xl border border-border-light p-6 text-center")}>
                <div className="w-12 h-12 rounded-full bg-brand-red/10 text-brand-red font-extrabold text-lg flex items-center justify-center mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="font-bold text-text-primary mb-2">{isAr ? s.titleAr : s.titleEn}</h3>
                <p className="text-sm text-text-secondary">{isAr ? s.descAr : s.descEn}</p>
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
