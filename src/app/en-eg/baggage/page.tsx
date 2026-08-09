"use client";

import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import {
  LuggageIcon, BriefcaseIcon, BackpackIcon,
  DropletIcon, ScissorsIcon, FlameIcon, ZapIcon,
  BikeIcon, MusicIcon, HeartPulseIcon,
  CheckIcon, AlertTriangleIcon,
} from "@/components/icons";

function SectionTitle({ en, ar, isAr }: { en: string; ar: string; isAr: boolean }) {
  return (
    <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-4">
      {isAr ? ar : en}
    </h2>
  );
}

function InfoCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white rounded-2xl border border-border-light p-5 sm:p-6 shadow-sm", className)}>
      {children}
    </div>
  );
}

export default function BaggagePage() {
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
              {isAr ? "الأمتعة" : "Baggage"}
            </h1>
            <p className="text-white/80 text-base">
              {isAr
                ? "كل ما تحتاج معرفته عن سياسات الأمتعة مع سبانكر"
                : "Everything you need to know about Spanker's baggage policy"}
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

          {/* 1. Cabin Baggage */}
          <section>
            <SectionTitle en="Cabin Baggage" ar="أمتعة المقصورة" isAr={isAr} />
            <div className="grid sm:grid-cols-2 gap-4">
              <InfoCard>
                <div className={cn("flex items-start gap-4", isAr ? "flex-row-reverse" : "")}>
                  <div className="w-11 h-11 bg-brand-red/10 rounded-xl flex items-center justify-center shrink-0">
                    <BackpackIcon size={22} className="text-brand-red" />
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary mb-1">{isAr ? "الدرجة الاقتصادية" : "Economy Class"}</h3>
                    <p className="text-sm text-text-secondary mb-1">{isAr ? "حقيبة واحدة — 7 كجم" : "1 bag — 7 kg"}</p>
                    <p className="text-xs text-text-muted">{isAr ? "الأبعاد: 55 × 40 × 20 سم" : "Dimensions: 55 × 40 × 20 cm"}</p>
                  </div>
                </div>
              </InfoCard>
              <InfoCard>
                <div className={cn("flex items-start gap-4", isAr ? "flex-row-reverse" : "")}>
                  <div className="w-11 h-11 bg-brand-red/10 rounded-xl flex items-center justify-center shrink-0">
                    <BriefcaseIcon size={22} className="text-brand-red" />
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary mb-1">{isAr ? "درجة رجال الأعمال" : "Business Class"}</h3>
                    <p className="text-sm text-text-secondary mb-1">{isAr ? "حقيبتان — 7 كجم لكل منهما" : "2 bags — 7 kg each"}</p>
                    <p className="text-xs text-text-muted">{isAr ? "الأبعاد: 55 × 40 × 20 سم لكل حقيبة" : "Dimensions: 55 × 40 × 20 cm each"}</p>
                  </div>
                </div>
              </InfoCard>
            </div>
            <p className="text-xs text-text-muted mt-3 px-1">
              {isAr
                ? "* يجب أن تتسع الحقيبة في صندوق التخزين العلوي أو تحت المقعد أمامك."
                : "* Bags must fit in the overhead bin or under the seat in front of you."}
            </p>
          </section>

          {/* 2. Checked Baggage */}
          <section>
            <SectionTitle en="Checked Baggage" ar="الأمتعة المسجّلة" isAr={isAr} />
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <InfoCard>
                <div className={cn("flex items-start gap-4", isAr ? "flex-row-reverse" : "")}>
                  <div className="w-11 h-11 bg-brand-red/10 rounded-xl flex items-center justify-center shrink-0">
                    <LuggageIcon size={22} className="text-brand-red" />
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary mb-1">{isAr ? "الدرجة الاقتصادية" : "Economy Class"}</h3>
                    <p className="text-sm text-text-secondary">{isAr ? "20 كجم مشمولة في السعر" : "20 kg included in fare"}</p>
                  </div>
                </div>
              </InfoCard>
              <InfoCard>
                <div className={cn("flex items-start gap-4", isAr ? "flex-row-reverse" : "")}>
                  <div className="w-11 h-11 bg-brand-red/10 rounded-xl flex items-center justify-center shrink-0">
                    <BriefcaseIcon size={22} className="text-brand-red" />
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary mb-1">{isAr ? "درجة رجال الأعمال" : "Business Class"}</h3>
                    <p className="text-sm text-text-secondary">{isAr ? "30 كجم مشمولة في السعر" : "30 kg included in fare"}</p>
                  </div>
                </div>
              </InfoCard>
            </div>

            {/* Overweight fees */}
            <InfoCard className="border-amber-200 bg-amber-50">
              <h3 className="font-bold text-text-primary mb-3">{isAr ? "رسوم الوزن الزائد" : "Excess Weight Fees"}</h3>
              <div className="space-y-2">
                <div className={cn("flex justify-between items-center text-sm py-2 border-b border-amber-100", isAr ? "flex-row-reverse" : "")}>
                  <span className="text-text-secondary">{isAr ? "23 – 32 كجم" : "23 – 32 kg"}</span>
                  <span className="font-bold text-text-primary">{isAr ? "150 جنيه" : "150 EGP"}</span>
                </div>
                <div className={cn("flex justify-between items-center text-sm py-2", isAr ? "flex-row-reverse" : "")}>
                  <span className="text-text-secondary">{isAr ? "33 – 40 كجم" : "33 – 40 kg"}</span>
                  <span className="font-bold text-text-primary">{isAr ? "250 جنيه" : "250 EGP"}</span>
                </div>
              </div>
              <p className="text-xs text-text-muted mt-3">
                {isAr
                  ? "لا تُقبل الأمتعة التي يزيد وزنها عن 40 كجم كأمتعة مسجّلة."
                  : "Baggage exceeding 40 kg cannot be accepted as checked luggage."}
              </p>
            </InfoCard>
          </section>

          {/* 3. Prohibited Items */}
          <section>
            <SectionTitle en="Prohibited Items" ar="العناصر الممنوعة" isAr={isAr} />
            <InfoCard className="border-red-200 bg-red-50">
              <ul className="space-y-4">
                {[
                  { en: "Liquids over 100 ml in cabin baggage (bottles, cans, tubes, gels)", ar: "السوائل التي تزيد عن 100 مل في أمتعة المقصورة", Icon: DropletIcon },
                  { en: "Sharp objects: knives, scissors (blade > 6 cm), razor blades", ar: "الأغراض الحادة: السكاكين، المقصات (الشفرة أكبر من 6 سم)، شفرات الحلاقة", Icon: ScissorsIcon },
                  { en: "Flammable materials: lighters with fuel, matches, aerosol sprays", ar: "المواد القابلة للاشتعال: الولاعات المحتوية على وقود، الكبريت، رذاذ مضغوط", Icon: FlameIcon },
                  { en: "Explosive or corrosive substances of any kind", ar: "المواد المتفجرة أو الأكّالة من أي نوع", Icon: ZapIcon },
                ].map((item) => (
                  <li key={item.en} className={cn("flex items-start gap-3 text-sm text-text-secondary", isAr ? "flex-row-reverse text-right" : "")}>
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <item.Icon size={16} className="text-red-500" />
                    </div>
                    <span className="pt-1">{isAr ? item.ar : item.en}</span>
                  </li>
                ))}
              </ul>
            </InfoCard>
          </section>

          {/* 4. Special Items */}
          <section>
            <SectionTitle en="Special Items" ar="العناصر الخاصة" isAr={isAr} />
            <InfoCard>
              <p className={cn("text-sm text-text-secondary mb-5", isAr ? "text-right" : "")}>
                {isAr
                  ? "يُرجى التواصل مع فريقنا قبل 48 ساعة على الأقل من موعد رحلتك لترتيب نقل الأغراض التالية:"
                  : "Please contact our team at least 48 hours before your flight to arrange transportation of the following items:"}
              </p>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { en: "Sports Equipment", ar: "المعدات الرياضية", detail_en: "Bicycles, golf clubs, surfboards, diving gear", detail_ar: "دراجات، عصي غولف، ألواح تزلج، معدات غوص", Icon: BikeIcon },
                  { en: "Musical Instruments", ar: "الآلات الموسيقية", detail_en: "Guitars, violins, keyboards (may need extra seat)", detail_ar: "غيتار، كمان، لوحات مفاتيح (قد تحتاج مقعدًا إضافيًا)", Icon: MusicIcon },
                  { en: "Medical Devices", ar: "الأجهزة الطبية", detail_en: "Oxygen concentrators, wheelchairs, CPAP machines", detail_ar: "أجهزة تركيز الأكسجين، الكراسي المتحركة، أجهزة CPAP", Icon: HeartPulseIcon },
                ].map((item) => (
                  <div key={item.en} className="p-4 bg-bg-alt rounded-xl text-center">
                    <div className="w-12 h-12 bg-brand-red/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <item.Icon size={24} className="text-brand-red" />
                    </div>
                    <h4 className="font-bold text-sm text-text-primary mb-1">{isAr ? item.ar : item.en}</h4>
                    <p className="text-xs text-text-muted">{isAr ? item.detail_ar : item.detail_en}</p>
                  </div>
                ))}
              </div>
            </InfoCard>
          </section>

          {/* 5. Tips */}
          <section>
            <InfoCard className="bg-brand-red border-brand-red">
              <h2 className={cn("text-lg font-bold text-white mb-4", isAr ? "text-right" : "")}>
                {isAr ? "نصائح للأمتعة" : "Baggage Tips"}
              </h2>
              <ul className="space-y-3">
                {[
                  { en: "Tag your luggage with your name, phone number, and destination address.", ar: "ضع بطاقة تعريفية على أمتعتك تحتوي على اسمك ورقم هاتفك وعنوان وجهتك." },
                  { en: "Take a photo of your checked bags before departure — useful if they get misplaced.", ar: "التقط صورة لحقائبك المسجّلة قبل السفر — تساعد في حالة الضياع." },
                  { en: "Arrive at the airport at least 2 hours before domestic and 3 hours before international flights.", ar: "احضر إلى المطار قبل ساعتين للرحلات الداخلية وثلاث ساعات للدولية." },
                  { en: "Do not pack valuables, medications, or electronics in your checked baggage.", ar: "لا تضع الأشياء الثمينة أو الأدوية أو الإلكترونيات في الأمتعة المسجّلة." },
                ].map((tip, i) => (
                  <li key={i} className={cn("flex items-start gap-3 text-sm text-white/90", isAr ? "flex-row-reverse text-right" : "")}>
                    <CheckIcon size={16} className="text-brand-yellow shrink-0 mt-0.5" />
                    <span>{isAr ? tip.ar : tip.en}</span>
                  </li>
                ))}
              </ul>
            </InfoCard>
          </section>

        </div>
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
