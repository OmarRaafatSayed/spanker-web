"use client";

import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";

const FLEET = [
  {
    model: "Airbus A320neo",
    type: "Narrow-body", typeAr: "جسم ضيق",
    seats: 180,
    range: "6,300 km",
    engines: "CFM LEAP-1A",
    usedFor: "Domestic & regional routes", usedForAr: "الرحلات الداخلية والإقليمية",
    count: 6,
    features: ["Sharklet wingtips", "LED cabin lighting", "Lower fuel burn by 20%"],
    featuresAr: ["أجنحة Sharklet", "إضاءة LED داخل الكابينة", "استهلاك وقود أقل بنسبة 20%"],
  },
  {
    model: "Airbus A321",
    type: "Narrow-body", typeAr: "جسم ضيق",
    seats: 220,
    range: "5,950 km",
    engines: "CFM56-5B",
    usedFor: "High-density domestic routes", usedForAr: "الخطوط الداخلية عالية الكثافة",
    count: 4,
    features: ["Extra legroom options", "Overhead bin upgrade", "Quiet cabin technology"],
    featuresAr: ["خيارات مسافة أرجل إضافية", "حقائب علوية محسّنة", "تقنية تقليل الضوضاء"],
  },
  {
    model: "Airbus A220-300",
    type: "Narrow-body", typeAr: "جسم ضيق",
    seats: 130,
    range: "6,300 km",
    engines: "Pratt & Whitney PW1500G",
    usedFor: "Secondary destinations", usedForAr: "الوجهات الثانوية",
    count: 3,
    features: ["Widest seats in class", "Large windows", "Ultra-quiet cabin"],
    featuresAr: ["أعرض مقاعد في فئتها", "نوافذ كبيرة", "كابينة هادئة للغاية"],
  },
];

export default function OurFleetPage() {
  const { locale, isRTL } = useI18n();
  const isAr = locale === "ar";

  const totalAircraft = FLEET.reduce((a, f) => a + f.count, 0);
  const totalSeats = FLEET.reduce((a, f) => a + f.seats * f.count, 0);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bg-alt pt-18 pb-20 lg:pb-0" dir={isRTL ? "rtl" : "ltr"}>
        {/* Hero */}
        <section className="bg-brand-red text-white py-14 sm:py-20">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              {isAr ? "أسطولنا" : "Our Fleet"}
            </h1>
            <p className="text-white/80">
              {isAr
                ? "أسطول حديث وآمن يضمن لك رحلة مريحة"
                : "A modern, safe fleet designed for your comfort"}
            </p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 py-12 flex flex-col gap-10">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: totalAircraft, labelEn: "Aircraft", labelAr: "طائرة" },
              { value: FLEET.length, labelEn: "Aircraft Types", labelAr: "نوع طائرة" },
              { value: totalSeats.toLocaleString(), labelEn: "Total Seats", labelAr: "إجمالي المقاعد" },
            ].map((s) => (
              <div key={s.labelEn} className="bg-white rounded-2xl border border-border-light p-5 text-center">
                <p className="text-3xl font-extrabold text-brand-red">{s.value}</p>
                <p className="text-sm text-text-secondary mt-1">{isAr ? s.labelAr : s.labelEn}</p>
              </div>
            ))}
          </div>

          {/* Aircraft cards */}
          <div className="flex flex-col gap-6">
            {FLEET.map((f) => (
              <div key={f.model} className="bg-white rounded-2xl border border-border-light overflow-hidden">
                {/* Header */}
                <div className="bg-brand-red/5 border-b border-border-light px-6 py-5 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-bold text-xl text-text-primary">{f.model}</h2>
                    <p className="text-sm text-text-secondary mt-0.5">{isAr ? f.typeAr : f.type} · {isAr ? f.usedForAr : f.usedFor}</p>
                  </div>
                  <div className="text-end shrink-0">
                    <p className="text-2xl font-extrabold text-brand-red">{f.count}</p>
                    <p className="text-xs text-text-muted">{isAr ? "طائرة" : "aircraft"}</p>
                  </div>
                </div>

                {/* Specs */}
                <div className="px-6 py-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                    {[
                      { labelEn: "Seats", labelAr: "المقاعد", value: f.seats },
                      { labelEn: "Range", labelAr: "المدى", value: f.range },
                      { labelEn: "Engines", labelAr: "المحركات", value: f.engines },
                    ].map((spec) => (
                      <div key={spec.labelEn}>
                        <p className="text-xs text-text-muted mb-0.5">{isAr ? spec.labelAr : spec.labelEn}</p>
                        <p className="font-semibold text-sm text-text-primary">{spec.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2">
                    {(isAr ? f.featuresAr : f.features).map((feat) => (
                      <span key={feat} className="text-xs bg-bg-alt border border-border-light text-text-secondary px-3 py-1 rounded-full">
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
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
