"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";

import { ShieldIcon, HeartPulseIcon, PillIcon, SunIcon } from "@/components/icons";

const VISA_INFO = [
  {
    country: "Egypt", countryAr: "مصر",
    visaType: "E-Visa / Visa on Arrival", visaTypeAr: "تأشيرة إلكترونية / عند الوصول",
    validity: "30 days", validityAr: "30 يوماً",
    fee: "25 USD", feeAr: "25 دولار",
    notes: "Available for 46 nationalities. Apply at evisa.gov.eg",
    notesAr: "متاحة لـ 46 جنسية. التقدم عبر evisa.gov.eg",
  },
  {
    country: "Hungary", countryAr: "المجر",
    visaType: "Schengen Visa", visaTypeAr: "تأشيرة شنغن",
    validity: "90 days", validityAr: "90 يوماً",
    fee: "80 EUR", feeAr: "80 يورو",
    notes: "Apply at the Hungarian embassy 3–4 weeks before travel.",
    notesAr: "تقدّم في السفارة المجرية قبل 3–4 أسابيع من السفر.",
  },
  {
    country: "Kuwait", countryAr: "الكويت",
    visaType: "eVisa", visaTypeAr: "تأشيرة إلكترونية",
    validity: "30 days", validityAr: "30 يوماً",
    fee: "3 KWD", feeAr: "3 دينار كويتي",
    notes: "Egyptian citizens apply online at evisa.moi.gov.kw",
    notesAr: "المواطنون المصريون يتقدمون إلكترونياً عبر evisa.moi.gov.kw",
  },
];

const HEALTH_TIPS = [
  { Icon: HeartPulseIcon, titleEn: "Vaccinations", titleAr: "التطعيمات", bodyEn: "Ensure routine vaccinations are up to date. Yellow fever certificate required if travelling from endemic countries.", bodyAr: "تأكد من تحديث التطعيمات الروتينية. شهادة الحمى الصفراء مطلوبة عند السفر من الدول الموبوءة." },
  { Icon: ShieldIcon, titleEn: "Travel Insurance", titleAr: "تأمين السفر", bodyEn: "We strongly recommend comprehensive travel insurance including medical coverage before every trip.", bodyAr: "نوصي بشدة بالحصول على تأمين سفر شامل يتضمن التغطية الطبية قبل كل رحلة." },
  { Icon: PillIcon, titleEn: "Medications", titleAr: "الأدوية", bodyEn: "Carry sufficient medication for the trip duration plus extra days. Keep prescriptions in their original packaging.", bodyAr: "احمل أدوية كافية لمدة الرحلة مع أيام احتياطية. احتفظ بالوصفات الطبية في عبواتها الأصلية." },
  { Icon: SunIcon, titleEn: "Climate & Sun", titleAr: "المناخ والشمس", bodyEn: "Egypt's sun is intense year-round. Use SPF 50+ sunscreen, stay hydrated, and avoid peak-hour exposure.", bodyAr: "شمس مصر قوية على مدار السنة. استخدم واقياً شمسياً 50+، اشرب الماء باستمرار، وتجنب التعرض في أشد ساعات الحرارة." },
];

export default function VisaHealthPage() {
  const { locale, isRTL } = useI18n();
  const isAr = locale === "ar";
  const [activeTab, setActiveTab] = useState<"visa" | "health">("visa");

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bg-alt pt-18 pb-20 lg:pb-0" dir={isRTL ? "rtl" : "ltr"}>
        {/* Hero */}
        <section className="bg-brand-red text-white py-14 sm:py-20">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              {isAr ? "التأشيرة والصحة" : "Visa & Health"}
            </h1>
            <p className="text-white/80">
              {isAr
                ? "كل ما تحتاجه قبل سفرك — تأشيرات ومعلومات صحية"
                : "Everything you need before you travel — visas and health information"}
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-10">
          {/* Tabs */}
          <div className="flex gap-1 bg-white rounded-xl border border-border-light p-1 mb-8 w-fit">
            {(["visa", "health"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={cn(
                  "px-5 py-2.5 rounded-lg text-sm font-semibold transition-all",
                  activeTab === t
                    ? "bg-brand-red text-white shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                {t === "visa"
                  ? isAr ? "التأشيرات" : "Visas"
                  : isAr ? "الصحة" : "Health"}
              </button>
            ))}
          </div>

          {activeTab === "visa" && (
            <div className="flex flex-col gap-5">
              {VISA_INFO.map((v) => (
                <div key={v.country} className="bg-white rounded-2xl border border-border-light p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h2 className="font-bold text-lg text-text-primary">{isAr ? v.countryAr : v.country}</h2>
                    <span className="text-xs font-semibold bg-brand-red/10 text-brand-red px-3 py-1 rounded-full shrink-0">
                      {isAr ? v.visaTypeAr : v.visaType}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-text-muted mb-1">{isAr ? "المدة" : "Validity"}</p>
                      <p className="font-semibold text-sm">{isAr ? v.validityAr : v.validity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted mb-1">{isAr ? "الرسوم" : "Fee"}</p>
                      <p className="font-semibold text-sm">{isAr ? v.feeAr : v.fee}</p>
                    </div>
                  </div>
                  <p className={cn("text-sm text-text-secondary leading-relaxed", isAr ? "text-right" : "")}>
                    {isAr ? v.notesAr : v.notes}
                  </p>
                </div>
              ))}
              <p className="text-xs text-text-muted text-center">
                {isAr
                  ? "* المعلومات للإرشاد فقط — تحقق دائماً من السفارة قبل السفر"
                  : "* Information is for guidance only — always verify with the embassy before travel"}
              </p>
            </div>
          )}

          {activeTab === "health" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {HEALTH_TIPS.map((h) => (
                <div key={h.titleEn} className="bg-white rounded-2xl border border-border-light p-6 flex gap-4">
                  <div className="w-11 h-11 bg-brand-red/10 rounded-xl flex items-center justify-center shrink-0">
                    <h.Icon size={22} className="text-brand-red" />
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary mb-2">{isAr ? h.titleAr : h.titleEn}</h3>
                    <p className={cn("text-sm text-text-secondary leading-relaxed", isAr ? "text-right" : "")}>
                      {isAr ? h.bodyAr : h.bodyEn}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
