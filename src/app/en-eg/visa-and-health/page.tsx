"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { CheckIcon, ShieldIcon, HeartPulseIcon, PillIcon, SunIcon, InfoIcon } from "@/components/icons";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface DocItem {
  ar: string;
  en: string;
  note?: { ar: string; en: string };
}

interface VisaEntry {
  country: string;
  countryAr: string;
  flag: string;
  visaTypeEn: string;
  visaTypeAr: string;
  validityEn: string;
  validityAr: string;
  feeEn: string;
  feeAr: string;
  processingEn: string;
  processingAr: string;
  applyAtEn: string;
  applyAtAr: string;
  docs: DocItem[];
  notesEn?: string;
  notesAr?: string;
  sourceUrl: string;
  sourceLabel: string;
}

// ─── Visa Data (verified August 2026) ─────────────────────────────────────────

const VISAS: VisaEntry[] = [
  {
    country: "Egypt",
    countryAr: "مصر",
    flag: "🇪🇬",
    visaTypeEn: "e-Visa / Visa on Arrival",
    visaTypeAr: "تأشيرة إلكترونية / عند الوصول",
    validityEn: "90 days from issue (max 30-day stay)",
    validityAr: "90 يوماً من الإصدار (إقامة 30 يوماً كحد أقصى)",
    feeEn: "$25 single entry · $60 multiple entry",
    feeAr: "25 دولار دخول واحد · 60 دولار دخول متعدد",
    processingEn: "3–5 business days online · Immediate on arrival",
    processingAr: "3–5 أيام عمل إلكترونياً · فوري عند الوصول",
    applyAtEn: "Online: visa2egypt.gov.eg — or at airport kiosks on arrival (cash $25)",
    applyAtAr: "إلكترونياً: visa2egypt.gov.eg — أو عند أكشاك الوصول في المطار (نقداً 25 دولار)",
    docs: [
      { en: "Valid passport (min. 6 months validity from entry date)", ar: "جواز سفر ساري (6 أشهر على الأقل من تاريخ الدخول)" },
      { en: "Digital passport-size photo (white background, recent)", ar: "صورة شخصية رقمية (خلفية بيضاء، حديثة)" },
      { en: "Valid email address for e-Visa delivery", ar: "بريد إلكتروني فعّال لاستلام التأشيرة" },
      { en: "Credit/debit card for online payment", ar: "بطاقة ائتمان أو خصم مباشر للدفع الإلكتروني" },
      { en: "Return or onward flight ticket", ar: "تذكرة عودة أو رحلة مواصلة" },
      { en: "Hotel booking confirmation or proof of accommodation", ar: "تأكيد حجز فندق أو دليل على مكان الإقامة" },
    ],
    notesEn: "78+ nationalities are eligible. Visa on arrival (cash only) available at Cairo, Hurghada, Sharm el-Sheikh, Luxor, Aswan, and Marsa Alam airports.",
    notesAr: "أكثر من 78 جنسية مؤهلة. التأشيرة عند الوصول (نقداً فقط) متاحة في مطارات القاهرة والغردقة وشرم الشيخ والأقصر وأسوان ومرسى علم.",
    sourceUrl: "https://www.visa2egypt.gov.eg",
    sourceLabel: "visa2egypt.gov.eg",
  },
  {
    country: "Hungary (Schengen)",
    countryAr: "المجر (شنغن)",
    flag: "🇭🇺",
    visaTypeEn: "Schengen Type C (Short Stay)",
    visaTypeAr: "تأشيرة شنغن نوع C (إقامة قصيرة)",
    validityEn: "Up to 90 days in any 180-day period across Schengen Area",
    validityAr: "حتى 90 يوماً في أي فترة 180 يوماً عبر منطقة شنغن",
    feeEn: "€80 (adults) · €40 (children 6–12)",
    feeAr: "80 يورو (بالغون) · 40 يورو (أطفال 6–12 سنة)",
    processingEn: "15 business days (up to 45 days possible)",
    processingAr: "15 يوم عمل (قد يمتد حتى 45 يوماً)",
    applyAtEn: "VFS Global Egypt (Cairo) — appointment required: visa.vfsglobal.com/egy/en/hun",
    applyAtAr: "VFS Global مصر (القاهرة) — موعد مسبق مطلوب: visa.vfsglobal.com/egy/en/hun",
    docs: [
      { en: "Valid passport + photocopy of all pages (passport must be valid 3+ months after return)", ar: "جواز سفر ساري + نسخة من جميع الصفحات (يجب أن يكون صالحاً 3 أشهر بعد العودة)" },
      { en: "Completed Schengen visa application form (signed)", ar: "استمارة طلب تأشيرة شنغن مكتملة (موقّعة)" },
      { en: "2 recent passport-size photos (35×45 mm, white background)", ar: "2 صورة شخصية حديثة (35×45 مم، خلفية بيضاء)" },
      { en: "Travel medical insurance (min. €30,000 coverage, valid for full Schengen area)", ar: "تأمين طبي للسفر (تغطية 30,000 يورو كحد أدنى، ساري في كامل منطقة شنغن)" },
      { en: "Round-trip flight booking / itinerary", ar: "حجز رحلة ذهاب وعودة / مسار الرحلة" },
      { en: "Hotel reservations or accommodation proof for entire stay", ar: "حجوزات فندقية أو دليل إقامة لكامل المدة" },
      { en: "Proof of sufficient funds: bank statements (last 3–6 months)", ar: "إثبات توافر أموال كافية: كشوف حساب بنكي (آخر 3–6 أشهر)" },
      { en: "Employment letter stating salary, position, approved leave dates + employer stamp", ar: "خطاب من صاحب العمل يتضمن الراتب والمنصب وتواريخ الإجازة المعتمدة مع خاتم الشركة" },
      { en: "Family register extract (قيد عائلي) from Mugamma", ar: "مستخرج قيد عائلي من المجمع" },
      { en: "Copy of national ID (front and back)", ar: "نسخة من بطاقة الرقم القومي (الوجهان)" },
      {
        en: "Biometric data (fingerprints + photo) — mandatory on first application or if older than 5 years",
        ar: "البيانات البيومترية (بصمات + صورة) — إلزامية للتقديم الأول أو إذا مضى أكثر من 5 سنوات",
        note: { en: "Must be submitted in person at VFS", ar: "يجب تقديمها شخصياً في VFS" },
      },
    ],
    notesEn: "A valid Schengen visa from another country also allows entry to Hungary. Apply at least 2–3 weeks before travel; do not apply more than 6 months in advance.",
    notesAr: "تأشيرة شنغن سارية من أي دولة شنغن أخرى تتيح الدخول إلى المجر. تقدّم قبل السفر بأسبوعين إلى 3 أسابيع على الأقل، ولا تتقدم أكثر من 6 أشهر مسبقاً.",
    sourceUrl: "https://visa.vfsglobal.com/egy/en/hun",
    sourceLabel: "VFS Global — Hungary Egypt",
  },
  {
    country: "Kuwait",
    countryAr: "الكويت",
    flag: "🇰🇼",
    visaTypeEn: "Embassy Visa (Egyptian citizens require embassy application)",
    visaTypeAr: "تأشيرة سفارة (المواطنون المصريون يتقدمون عبر السفارة)",
    validityEn: "30 days single entry (extendable inside Kuwait)",
    validityAr: "30 يوماً دخول واحد (قابل للتمديد داخل الكويت)",
    feeEn: "Approx. 3 KWD (verify with embassy)",
    feeAr: "حوالي 3 دينار كويتي (تحقق من السفارة)",
    processingEn: "7–10 business days",
    processingAr: "7–10 أيام عمل",
    applyAtEn: "Kuwait Embassy in Cairo — or online for eligible nationalities at evisa.moi.gov.kw (check eligibility)",
    applyAtAr: "سفارة الكويت في القاهرة — أو إلكترونياً للجنسيات المؤهلة عبر evisa.moi.gov.kw (تحقق من الأهلية)",
    docs: [
      { en: "Valid passport (min. 6 months validity from travel date)", ar: "جواز سفر ساري (6 أشهر على الأقل من تاريخ السفر)" },
      { en: "Completed visa application form", ar: "استمارة طلب تأشيرة مكتملة" },
      { en: "2 recent passport-size photos", ar: "2 صورة شخصية حديثة" },
      { en: "Copy of national ID", ar: "نسخة من بطاقة الرقم القومي" },
      { en: "Round-trip flight booking", ar: "حجز رحلة ذهاب وعودة" },
      { en: "Hotel booking or invitation letter from host in Kuwait", ar: "حجز فندق أو خطاب دعوة من مضيف في الكويت" },
      { en: "Bank statement showing sufficient funds (last 3 months)", ar: "كشف حساب بنكي يُثبت توافر أموال كافية (آخر 3 أشهر)" },
      { en: "Employment letter or proof of income / pension", ar: "خطاب من صاحب العمل أو إثبات الدخل / المعاش" },
    ],
    notesEn: "Kuwait's new e-Visa system (relaunched Jan 2025) covers 50+ nationalities — but Egyptian passport holders are not currently on the eligible list. Apply through the Kuwait Embassy in Cairo, Nasr City.",
    notesAr: "نظام التأشيرة الإلكترونية الكويتي الجديد (أُعيد إطلاقه يناير 2025) يشمل أكثر من 50 جنسية — لكن حاملي الجواز المصري غير مدرجين حالياً. تقدّم عبر سفارة الكويت في القاهرة، مدينة نصر.",
    sourceUrl: "https://www.kuwaitembassy.org/about-kuwait/visa-requirements",
    sourceLabel: "Kuwait Embassy",
  },
];

// ─── Health Tips ───────────────────────────────────────────────────────────────

const HEALTH_TIPS = [
  { Icon: HeartPulseIcon, titleEn: "Vaccinations", titleAr: "التطعيمات", bodyEn: "Keep routine vaccinations up to date. Yellow fever certificate required when arriving from endemic countries. Hepatitis A & B, Typhoid, and Rabies vaccines are recommended for extended stays.", bodyAr: "حافظ على تحديث التطعيمات الروتينية. شهادة الحمى الصفراء مطلوبة عند القدوم من الدول الموبوءة. يُوصى بتطعيمات التهاب الكبد A وB وحمى التيفويد والسُّعار للإقامات الطويلة." },
  { Icon: ShieldIcon, titleEn: "Travel Insurance", titleAr: "تأمين السفر", bodyEn: "Mandatory for Schengen (min. €30,000 medical cover). Strongly recommended for all destinations — covers emergency evacuation, hospitalization, and trip cancellation.", bodyAr: "إلزامي للحصول على تأشيرة شنغن (تغطية طبية 30,000 يورو كحد أدنى). موصى به بشدة لجميع الوجهات — يشمل الإجلاء الطارئ والاستشفاء وإلغاء الرحلة." },
  { Icon: PillIcon, titleEn: "Medications", titleAr: "الأدوية", bodyEn: "Carry enough medication for your trip plus 3 extra days. Keep prescriptions in original packaging with a doctor's note in English. Some medications require a special permit to carry abroad.", bodyAr: "احمل أدوية تكفي لمدة رحلتك مع 3 أيام احتياطية. احتفظ بالوصفات في عبواتها الأصلية مع خطاب طبيب بالإنجليزية. بعض الأدوية تستلزم تصريحاً خاصاً للسفر بها." },
  { Icon: SunIcon, titleEn: "Climate Preparation", titleAr: "الاستعداد للمناخ", bodyEn: "Egyptian summer heat is extreme (40°C+). Stay hydrated, use SPF 50+ sunscreen, and avoid outdoor activity between 12–4 pm. In winter destinations like Budapest, pack warm layers.", bodyAr: "حرارة الصيف المصري شديدة (40°C+). اشرب الماء كثيراً، استخدم واقياً شمسياً 50+، وتجنب الخروج بين الساعة 12 ظهراً و4 عصراً. في وجهات شتوية كبودابست، احمل ملابس دافئة." },
];

// ─── Components ────────────────────────────────────────────────────────────────

function DocList({ docs, isAr }: { docs: DocItem[]; isAr: boolean }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {docs.map((d, i) => (
        <li key={i} className={cn("flex items-start gap-3", isAr ? "flex-row-reverse" : "")}>
          <div className="w-5 h-5 rounded-full bg-brand-red/10 flex items-center justify-center shrink-0 mt-0.5">
            <CheckIcon size={12} className="text-brand-red" />
          </div>
          <div className={cn("flex-1", isAr ? "text-right" : "")}>
            <span className="text-sm text-text-secondary">{isAr ? d.ar : d.en}</span>
            {d.note && (
              <span className="block text-xs text-text-muted mt-0.5 italic">
                {isAr ? d.note.ar : d.note.en}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function VisaCard({ visa, isAr }: { visa: VisaEntry; isAr: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center justify-between gap-4 p-5 hover:bg-bg-alt/50 transition-colors",
          isAr ? "flex-row-reverse" : ""
        )}
      >
        <div className={cn("flex items-center gap-3", isAr ? "flex-row-reverse" : "")}>
          <span className="text-2xl">{visa.flag}</span>
          <div className={isAr ? "text-right" : ""}>
            <h3 className="font-bold text-text-primary text-base">
              {isAr ? visa.countryAr : visa.country}
            </h3>
            <span className="text-xs font-medium text-brand-red bg-brand-red/8 px-2 py-0.5 rounded-full">
              {isAr ? visa.visaTypeAr : visa.visaTypeEn}
            </span>
          </div>
        </div>
        <svg
          width="18" height="18"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={cn("text-text-muted shrink-0 transition-transform duration-200", open ? "rotate-180" : "")}
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Quick stats — always visible */}
      <div className={cn("grid grid-cols-2 sm:grid-cols-3 gap-px bg-border-light border-t border-border-light")}>
        {[
          { labelEn: "Fee", labelAr: "الرسوم", value: isAr ? visa.feeAr : visa.feeEn },
          { labelEn: "Validity", labelAr: "المدة", value: isAr ? visa.validityAr : visa.validityEn },
          { labelEn: "Processing", labelAr: "وقت المعالجة", value: isAr ? visa.processingAr : visa.processingEn },
        ].map((s) => (
          <div key={s.labelEn} className={cn("bg-white px-4 py-3", isAr ? "text-right" : "")}>
            <p className="text-xs text-text-muted mb-0.5">{isAr ? s.labelAr : s.labelEn}</p>
            <p className="text-xs font-semibold text-text-primary leading-snug">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Expandable docs section */}
      {open && (
        <div className="border-t border-border-light p-5 flex flex-col gap-5">
          {/* Apply at */}
          <div className={cn("flex items-start gap-3 p-3 bg-brand-red/5 rounded-xl border border-brand-red/15", isAr ? "flex-row-reverse" : "")}>
            <InfoIcon size={16} className="text-brand-red shrink-0 mt-0.5" />
            <div className={isAr ? "text-right" : ""}>
              <p className="text-xs font-semibold text-text-primary mb-0.5">
                {isAr ? "أين تتقدم؟" : "Where to apply"}
              </p>
              <p className="text-xs text-text-secondary">{isAr ? visa.applyAtAr : visa.applyAtEn}</p>
            </div>
          </div>

          {/* Documents */}
          <div>
            <h4 className={cn("text-sm font-bold text-text-primary mb-3", isAr ? "text-right" : "")}>
              {isAr ? "الوثائق المطلوبة" : "Required Documents"}
            </h4>
            <DocList docs={visa.docs} isAr={isAr} />
          </div>

          {/* Notes */}
          {(visa.notesEn || visa.notesAr) && (
            <div className={cn("flex items-start gap-2.5 p-3 bg-amber-50 rounded-xl border border-amber-200", isAr ? "flex-row-reverse" : "")}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600 shrink-0 mt-0.5" aria-hidden="true">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4M12 17h.01" />
              </svg>
              <p className={cn("text-xs text-amber-800 leading-relaxed", isAr ? "text-right" : "")}>
                {isAr ? visa.notesAr : visa.notesEn}
              </p>
            </div>
          )}

          {/* Source */}
          <p className={cn("text-[11px] text-text-muted", isAr ? "text-right" : "")}>
            {isAr ? "المصدر:" : "Source:"}{" "}
            <a href={visa.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-red transition-colors">
              {visa.sourceLabel}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

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
                ? "معلومات موثّقة عن التأشيرات والأوراق المطلوبة لوجهاتنا"
                : "Verified visa requirements and documents for our destinations"}
            </p>
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-4 py-10">
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
            <div className="flex flex-col gap-4">
              <p className={cn("text-xs text-text-muted mb-1", isAr ? "text-right" : "")}>
                {isAr
                  ? "اضغط على أي بطاقة لعرض الوثائق المطلوبة بالتفصيل"
                  : "Tap any card to expand required documents"}
              </p>
              {VISAS.map((v) => (
                <VisaCard key={v.country} visa={v} isAr={isAr} />
              ))}
              <p className={cn("text-xs text-text-muted mt-2", isAr ? "text-right" : "")}>
                {isAr
                  ? "* المعلومات مُحدَّثة لأغسطس 2026 — تحقق دائماً من السفارة قبل السفر لأن المتطلبات قد تتغير."
                  : "* Information updated August 2026 — always verify with the embassy before travel as requirements may change."}
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
