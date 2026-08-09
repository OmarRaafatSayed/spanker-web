"use client";

import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";

import {
  UtensilsIcon, MonitorIcon, ArmchairIcon, ShoppingBagIcon,
  BabyIcon, AccessibilityIcon,
} from "@/components/icons";

const SERVICES = [
  { Icon: UtensilsIcon, titleEn: "Meals & Beverages",  titleAr: "الوجبات والمشروبات", descEn: "Freshly prepared meals tailored to your destination. Hot and cold beverages served throughout the flight. Special dietary meals available on request.", descAr: "وجبات طازجة مُعدّة خصيصاً لوجهتك. مشروبات ساخنة وباردة طوال الرحلة. وجبات خاصة متاحة بالطلب المسبق." },
  { Icon: MonitorIcon, titleEn: "Entertainment",  titleAr: "الترفيه", descEn: "Personal seatback screens with movies, TV shows, music, and games on select aircraft. Complimentary Wi-Fi on long-haul routes.", descAr: "شاشات شخصية على بعض الطائرات تتضمن أفلاماً ومسلسلات وموسيقى وألعاباً. واي-فاي مجاني على الرحلات الطويلة." },
  { Icon: ArmchairIcon, titleEn: "Comfort & Seats",  titleAr: "الراحة والمقاعد", descEn: "Ergonomically designed seats with adjustable headrests. Extra legroom and business class seats available for purchase during booking.", descAr: "مقاعد مُصمَّمة بشكل مريح مع مساند رأس قابلة للتعديل. مقاعد بمساحة أرجل إضافية ودرجة الأعمال متاحة للشراء عند الحجز." },
  { Icon: ShoppingBagIcon, titleEn: "Duty-Free Shopping",  titleAr: "التسوق المعفى من الرسوم", descEn: "Browse and purchase from our exclusive duty-free catalogue on board. Fragrances, cosmetics, accessories and more.", descAr: "تصفّح وشترِ من كتالوج الـ duty-free الحصري على متن الطائرة. عطور ومستحضرات تجميل وإكسسوارات والمزيد." },
  { Icon: BabyIcon, titleEn: "Travelling with Children",  titleAr: "السفر مع الأطفال", descEn: "Children's meals, bassinets (on request), and priority boarding for families with young children.", descAr: "وجبات للأطفال، مهود للرضع (بالطلب المسبق)، وصعود أولوية للعائلات مع الأطفال الصغار." },
  { Icon: AccessibilityIcon, titleEn: "Special Assistance",  titleAr: "المساعدة الخاصة", descEn: "Dedicated support for passengers with reduced mobility, medical needs, or special requirements. Notify us at booking.", descAr: "دعم مخصص لركاب ذوي الاحتياجات الخاصة أو الاحتياجات الطبية. أخبرنا عند الحجز." },
];

const CABINS = [
  {
    classEn: "Economy",  classAr: "الدرجة الاقتصادية",
    pitchEn: "30\" seat pitch",  pitchAr: "مسافة مقعد 30 بوصة",
    featuresEn: ["Complimentary meal", "20 kg baggage", "Personal screen (select routes)", "Snacks & beverages"],
    featuresAr: ["وجبة مجانية", "20 كجم أمتعة", "شاشة شخصية (مسارات مختارة)", "وجبات خفيفة ومشروبات"],
    highlight: false,
  },
  {
    classEn: "Business",  classAr: "درجة الأعمال",
    pitchEn: "45\" seat pitch",  pitchAr: "مسافة مقعد 45 بوصة",
    featuresEn: ["Premium multi-course meal", "32 kg baggage", "Dedicated screen", "Priority boarding & check-in", "Lie-flat seats (select routes)"],
    featuresAr: ["وجبة متعددة الأطباق", "32 كجم أمتعة", "شاشة مخصصة", "صعود وتسجيل وصول أولوية", "مقاعد مستلقية (مسارات مختارة)"],
    highlight: true,
  },
];

export default function OnBoardPage() {
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
              {isAr ? "على متن الطائرة" : "On Board"}
            </h1>
            <p className="text-white/80">
              {isAr
                ? "اكتشف كل ما تقدمه سبانكر خلال رحلتك"
                : "Discover everything Spanker offers during your flight"}
            </p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 py-12 flex flex-col gap-14">
          {/* Cabin comparison */}
          <div>
            <h2 className={cn("text-2xl font-bold text-text-primary mb-6", isAr ? "text-right" : "")}>
              {isAr ? "درجات السفر" : "Cabin Classes"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {CABINS.map((c) => (
                <div
                  key={c.classEn}
                  className={cn(
                    "rounded-2xl border p-6 flex flex-col gap-4",
                    c.highlight
                      ? "bg-brand-red text-white border-brand-red"
                      : "bg-white border-border-light"
                  )}
                >
                  <div>
                    <h3 className="font-bold text-xl">{isAr ? c.classAr : c.classEn}</h3>
                    <p className={cn("text-sm mt-0.5", c.highlight ? "text-white/70" : "text-text-muted")}>
                      {isAr ? c.pitchAr : c.pitchEn}
                    </p>
                  </div>
                  <ul className="flex flex-col gap-2">
                    {(isAr ? c.featuresAr : c.featuresEn).map((f) => (
                      <li key={f} className={cn("flex items-center gap-2 text-sm", isAr ? "flex-row-reverse text-right" : "")}>
                        <svg className={cn("w-4 h-4 shrink-0", c.highlight ? "text-white/80" : "text-brand-red")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Services grid */}
          <div>
            <h2 className={cn("text-2xl font-bold text-text-primary mb-6", isAr ? "text-right" : "")}>
              {isAr ? "خدمات على متن الطائرة" : "On-board Services"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {SERVICES.map((s) => (
                <div key={s.titleEn} className="bg-white rounded-2xl border border-border-light p-5 flex gap-4">
                  <div className="w-11 h-11 bg-brand-red/10 rounded-xl flex items-center justify-center shrink-0">
                    <s.Icon size={22} className="text-brand-red" />
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary mb-1.5 text-sm">{isAr ? s.titleAr : s.titleEn}</h3>
                    <p className={cn("text-xs text-text-secondary leading-relaxed", isAr ? "text-right" : "")}>{isAr ? s.descAr : s.descEn}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
