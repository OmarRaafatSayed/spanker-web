"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";

type SeatType = "standard" | "legroom" | "front" | "business" | "exit" | "taken";

interface Seat {
  id: string;
  type: SeatType;
}

function buildRow(rowNum: number, type: SeatType): Seat[] {
  return ["A", "B", "C", "D", "E", "F"].map((col) => ({
    id: `${rowNum}${col}`,
    type,
  }));
}

const SEAT_ROWS: Seat[][] = [
  buildRow(1, "business"),
  buildRow(2, "business"),
  buildRow(3, "front"),
  buildRow(4, "front"),
  buildRow(5, "standard").map((s, i) => (i === 1 || i === 4 ? { ...s, type: "taken" as SeatType } : s)),
  buildRow(6, "standard"),
  buildRow(7, "exit"),
  buildRow(8, "legroom"),
  buildRow(9, "legroom"),
  buildRow(10, "standard").map((s, i) => (i === 2 ? { ...s, type: "taken" as SeatType } : s)),
  buildRow(11, "standard"),
  buildRow(12, "standard").map((s, i) => (i === 0 || i === 5 ? { ...s, type: "taken" as SeatType } : s)),
  buildRow(13, "standard"),
  buildRow(14, "exit"),
  buildRow(15, "standard"),
];

const SEAT_STYLES: Record<SeatType, string> = {
  standard: "bg-bg-alt border-border-light text-text-muted hover:bg-brand-red hover:text-white hover:border-brand-red cursor-pointer",
  legroom: "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-500 hover:text-white hover:border-blue-500 cursor-pointer",
  front: "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-400 hover:text-white hover:border-amber-400 cursor-pointer",
  business: "bg-brand-red border-brand-red text-white cursor-pointer opacity-80",
  exit: "bg-green-50 border-green-200 text-green-700 hover:bg-green-500 hover:text-white hover:border-green-500 cursor-pointer",
  taken: "bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed",
};

export default function SeatSelectionPage() {
  const { locale, isRTL } = useI18n();
  const isAr = locale === "ar";
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);

  function handleSeatClick(seat: Seat) {
    if (seat.type === "taken" || seat.type === "business") return;
    setSelectedSeat((prev) => (prev === seat.id ? null : seat.id));
  }

  const FAQ = [
    {
      q_en: "When can I select my seat?",
      q_ar: "متى يمكنني اختيار مقعدي؟",
      a_en: "You can select or change your seat during booking, through online check-in up to 48 hours before departure, or at the airport counter.",
      a_ar: "يمكنك اختيار أو تغيير مقعدك خلال الحجز، أو من خلال تسجيل الوصول الإلكتروني حتى 48 ساعة قبل الإقلاع، أو عند مكتب المطار.",
    },
    {
      q_en: "Can I change my seat after selecting it?",
      q_ar: "هل يمكنني تغيير مقعدي بعد اختياره؟",
      a_en: "Yes, you can change your seat free of charge up to 24 hours before departure via the Spanker app or website.",
      a_ar: "نعم، يمكنك تغيير مقعدك مجانًا حتى 24 ساعة قبل الإقلاع عبر تطبيق سبانكر أو الموقع الإلكتروني.",
    },
    {
      q_en: "What if I don't choose a seat?",
      q_ar: "ماذا يحدث إذا لم أختر مقعدًا؟",
      a_en: "A seat will be automatically assigned to you at check-in at no extra charge. However, we cannot guarantee your preferred location.",
      a_ar: "سيُخصَّص لك مقعد تلقائيًا عند تسجيل الوصول دون رسوم إضافية. ومع ذلك، لا يمكننا ضمان الموقع المفضل لديك.",
    },
    {
      q_en: "Are exit row seats available to everyone?",
      q_ar: "هل مقاعد صفوف الخروج متاحة للجميع؟",
      a_en: "Exit row seats are available to passengers aged 18+ who are physically able to assist in an evacuation. They cannot be assigned to passengers with reduced mobility.",
      a_ar: "مقاعد صفوف الخروج متاحة للركاب الذين تجاوزوا 18 عامًا والقادرين جسديًا على المساعدة في الإخلاء. لا يمكن تخصيصها لذوي الاحتياجات الخاصة.",
    },
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bg-alt pt-18 pb-20 lg:pb-0" dir={isRTL ? "rtl" : "ltr"}>

        {/* Hero */}
        <section className="bg-brand-red text-white py-14 sm:py-20">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              {isAr ? "اختيار المقعد" : "Seat Selection"}
            </h1>
            <p className="text-white/80 text-base">
              {isAr
                ? "اختر المقعد المثالي لرحلتك واستمتع بأقصى درجات الراحة"
                : "Choose the perfect seat for your journey and enjoy maximum comfort"}
            </p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

          {/* How to Select */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-4">
              {isAr ? "كيف تختار مقعدك" : "How to Select Your Seat"}
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { icon: "💻", en: "Online Check-in", ar: "تسجيل الوصول الإلكتروني", detail_en: "Visit spanker.com and go to Online Check-in up to 48 h before departure.", detail_ar: "زر الموقع الإلكتروني spanker.com وانتقل إلى تسجيل الوصول الإلكتروني حتى 48 ساعة قبل الإقلاع." },
                { icon: "📱", en: "Spanker Mobile App", ar: "تطبيق سبانكر", detail_en: "Download the Spanker app, open your booking, and tap 'Select Seat'.", detail_ar: "نزّل تطبيق سبانكر وافتح حجزك ثم انقر على 'اختيار المقعد'." },
                { icon: "🏢", en: "Airport Counter", ar: "مكتب المطار", detail_en: "Visit the Spanker check-in desk at the airport. Subject to availability.", detail_ar: "زر مكتب تسجيل الوصول في المطار. الاختيار حسب التوفر." },
              ].map((step) => (
                <div key={step.en} className="bg-white rounded-2xl border border-border-light p-5 shadow-sm text-center">
                  <div className="text-4xl mb-3">{step.icon}</div>
                  <h3 className="font-bold text-text-primary mb-2">{isAr ? step.ar : step.en}</h3>
                  <p className="text-sm text-text-secondary">{isAr ? step.detail_ar : step.detail_en}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Seat Map */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-2">
              {isAr ? "خريطة المقاعد" : "Seat Map"}
            </h2>
            <p className="text-sm text-text-secondary mb-4">
              {isAr ? "انقر على مقعد للاختيار. المقاعد الرمادية محجوزة." : "Click a seat to select it. Grey seats are taken."}
            </p>
            <div className="bg-white rounded-2xl border border-border-light p-5 shadow-sm overflow-x-auto">
              {/* Legend */}
              <div className={cn("flex flex-wrap gap-3 mb-5 text-xs", isAr ? "flex-row-reverse" : "")}>
                {[
                  { color: "bg-bg-alt border-border-light", label_en: "Standard (Free)", label_ar: "عادي (مجاني)" },
                  { color: "bg-blue-50 border-blue-200", label_en: "Extra Legroom", label_ar: "مساحة إضافية" },
                  { color: "bg-amber-50 border-amber-200", label_en: "Front Row", label_ar: "الصف الأول" },
                  { color: "bg-brand-red border-brand-red", label_en: "Business", label_ar: "أعمال" },
                  { color: "bg-green-50 border-green-200", label_en: "Exit Row", label_ar: "صف الخروج" },
                  { color: "bg-gray-200 border-gray-300", label_en: "Taken", label_ar: "محجوز" },
                ].map((l) => (
                  <div key={l.label_en} className={cn("flex items-center gap-1.5", isAr ? "flex-row-reverse" : "")}>
                    <div className={cn("w-5 h-5 rounded border", l.color)} />
                    <span className="text-text-muted">{isAr ? l.label_ar : l.label_en}</span>
                  </div>
                ))}
              </div>

              {/* Plane nose indicator */}
              <div className="flex justify-center mb-3">
                <div className="flex flex-col items-center gap-1">
                  <div className="text-2xl">✈️</div>
                  <span className="text-xs text-text-muted">{isAr ? "مقدمة الطائرة" : "Front of Aircraft"}</span>
                </div>
              </div>

              {/* Column headers */}
              <div className="flex justify-center mb-1">
                <div className="grid grid-cols-[2rem_repeat(3,2rem)_1rem_repeat(3,2rem)] gap-1 text-xs text-text-muted font-medium text-center">
                  <span />
                  <span>A</span><span>B</span><span>C</span>
                  <span />
                  <span>D</span><span>E</span><span>F</span>
                </div>
              </div>

              {/* Rows */}
              <div className="flex flex-col items-center gap-1">
                {SEAT_ROWS.map((row, ri) => {
                  const rowNum = ri + 1;
                  const isExitRow = row[0].type === "exit";
                  return (
                    <div key={rowNum}>
                      {isExitRow && (
                        <div className="text-center text-xs text-green-600 font-semibold my-1">
                          {isAr ? "← مخرج الطوارئ →" : "← Emergency Exit →"}
                        </div>
                      )}
                      <div className="grid grid-cols-[2rem_repeat(3,2rem)_1rem_repeat(3,2rem)] gap-1 items-center">
                        <span className="text-xs text-text-muted text-center">{rowNum}</span>
                        {row.slice(0, 3).map((seat) => (
                          <button
                            key={seat.id}
                            onClick={() => handleSeatClick(seat)}
                            disabled={seat.type === "taken" || seat.type === "business"}
                            title={seat.id}
                            className={cn(
                              "w-8 h-8 rounded-md border text-xs font-mono transition-all duration-150",
                              SEAT_STYLES[seat.type],
                              selectedSeat === seat.id && "ring-2 ring-brand-yellow ring-offset-1 scale-110"
                            )}
                            aria-label={`${isAr ? "مقعد" : "Seat"} ${seat.id}`}
                            aria-pressed={selectedSeat === seat.id}
                          >
                            {seat.id.slice(-1)}
                          </button>
                        ))}
                        <span />
                        {row.slice(3).map((seat) => (
                          <button
                            key={seat.id}
                            onClick={() => handleSeatClick(seat)}
                            disabled={seat.type === "taken" || seat.type === "business"}
                            title={seat.id}
                            className={cn(
                              "w-8 h-8 rounded-md border text-xs font-mono transition-all duration-150",
                              SEAT_STYLES[seat.type],
                              selectedSeat === seat.id && "ring-2 ring-brand-yellow ring-offset-1 scale-110"
                            )}
                            aria-label={`${isAr ? "مقعد" : "Seat"} ${seat.id}`}
                            aria-pressed={selectedSeat === seat.id}
                          >
                            {seat.id.slice(-1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedSeat && (
                <p className="text-center text-sm font-semibold text-brand-red mt-4">
                  {isAr ? `المقعد المختار: ${selectedSeat}` : `Selected Seat: ${selectedSeat}`}
                </p>
              )}
            </div>
          </section>

          {/* Seat Types & Pricing */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-4">
              {isAr ? "أنواع المقاعد والأسعار" : "Seat Types & Pricing"}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { en: "Standard", ar: "عادي", price_en: "Free", price_ar: "مجاني", desc_en: "Any standard seat in the Economy cabin.", desc_ar: "أي مقعد عادي في مقصورة الاقتصادية.", color: "border-border-light" },
                { en: "Extra Legroom", ar: "مساحة إضافية", price_en: "150 EGP", price_ar: "150 جنيه", desc_en: "Extra legroom seats at emergency exit rows 7 & 14.", desc_ar: "مقاعد بمساحة إضافية عند صفوف مخرج الطوارئ 7 و14.", color: "border-blue-200" },
                { en: "Front Row", ar: "الصف الأمامي", price_en: "200 EGP", price_ar: "200 جنيه", desc_en: "Rows 3 & 4 — disembark first, closest to the exit.", desc_ar: "الصفوف 3 و4 — أول من ينزل وأقرب للمخرج.", color: "border-amber-200" },
                { en: "Business Class", ar: "درجة الأعمال", price_en: "Included", price_ar: "مشمول", desc_en: "Premium seats with wider seats and extra recline.", desc_ar: "مقاعد متميزة بعرض أكبر وزاوية إمالة أعلى.", color: "border-brand-red" },
              ].map((type) => (
                <div key={type.en} className={cn("bg-white rounded-2xl border p-5 shadow-sm", type.color)}>
                  <h3 className="font-bold text-text-primary mb-1">{isAr ? type.ar : type.en}</h3>
                  <p className="text-brand-red font-extrabold text-lg mb-2">{isAr ? type.price_ar : type.price_en}</p>
                  <p className="text-xs text-text-secondary">{isAr ? type.desc_ar : type.desc_en}</p>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-4">
              {isAr ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
            </h2>
            <div className="space-y-3">
              {FAQ.map((item, i) => (
                <div key={i} className="bg-white rounded-2xl border border-border-light p-5 shadow-sm">
                  <h3 className={cn("font-bold text-text-primary mb-2", isAr ? "text-right" : "")}>
                    {isAr ? item.q_ar : item.q_en}
                  </h3>
                  <p className={cn("text-sm text-text-secondary", isAr ? "text-right" : "")}>
                    {isAr ? item.a_ar : item.a_en}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="bg-brand-red rounded-2xl p-6 sm:p-8 text-center text-white">
            <h2 className="text-xl font-bold mb-2">{isAr ? "جاهز للحجز؟" : "Ready to Check In?"}</h2>
            <p className="text-white/80 text-sm mb-5">
              {isAr
                ? "سجّل وصولك الآن واختر مقعدك المفضّل قبل أن يمتلئ."
                : "Check in now and secure your preferred seat before it's gone."}
            </p>
            <Link
              href="/en-eg/check-in-online"
              className="inline-block bg-white text-brand-red font-bold text-sm px-6 py-3 rounded-xl hover:bg-brand-yellow transition-colors"
            >
              {isAr ? "تسجيل الوصول الإلكتروني" : "Online Check-in"}
            </Link>
          </section>

        </div>
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
