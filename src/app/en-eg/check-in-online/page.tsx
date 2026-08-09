"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";

const STEPS = [
  { step: "01", titleEn: "Enter Booking Details", titleAr: "أدخل بيانات الحجز", descEn: "Provide your booking reference and last name.", descAr: "أدخل رقم الحجز واسم العائلة." },
  { step: "02", titleEn: "Select Passengers", titleAr: "اختر المسافرين", descEn: "Confirm all passengers travelling on your booking.", descAr: "أكّد جميع المسافرين في حجزك." },
  { step: "03", titleEn: "Choose Your Seat", titleAr: "اختر مقعدك", descEn: "Pick your preferred seat from the interactive seat map.", descAr: "اختر مقعدك المفضل من خريطة المقاعد التفاعلية." },
  { step: "04", titleEn: "Receive Boarding Pass", titleAr: "احصل على بطاقة الصعود", descEn: "Download or print your boarding pass.", descAr: "حمّل أو اطبع بطاقة الصعود الخاصة بك." },
];

export default function OnlineCheckinPage() {
  const { locale, isRTL } = useI18n();
  const isAr = locale === "ar";
  const [ref, setRef] = useState("");
  const [lastName, setLastName] = useState("");

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bg-alt pt-18 pb-20 lg:pb-0" dir={isRTL ? "rtl" : "ltr"}>
        {/* Hero */}
        <section className="bg-brand-red text-white py-14 sm:py-20">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              {isAr ? "تسجيل الوصول الإلكتروني" : "Online Check-in"}
            </h1>
            <p className="text-white/80">
              {isAr
                ? "وفّر وقتك — سجّل وصولك من هاتفك أو حاسوبك"
                : "Save time — check in from your phone or computer"}
            </p>
            <p className="text-white/60 text-sm mt-2">
              {isAr ? "متاح من 24 ساعة حتى 2 ساعة قبل الإقلاع" : "Available 24 hours to 2 hours before departure"}
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Form */}
          <div className="bg-white rounded-2xl border border-border-light p-6 mb-10">
            <h2 className={cn("font-bold text-lg text-text-primary mb-5", isAr ? "text-right" : "")}>
              {isAr ? "ابدأ تسجيل الوصول" : "Start Check-in"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={cn("block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide", isAr ? "text-right" : "")}>
                  {isAr ? "رقم الحجز" : "Booking Reference"}
                </label>
                <input
                  type="text"
                  value={ref}
                  onChange={(e) => setRef(e.target.value.toUpperCase())}
                  placeholder="SP1234"
                  className={cn("w-full h-11 px-4 border border-border-light rounded-xl text-sm font-mono focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition", isAr ? "text-right" : "")}
                />
              </div>
              <div>
                <label className={cn("block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide", isAr ? "text-right" : "")}>
                  {isAr ? "اسم العائلة" : "Last Name"}
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={isAr ? "كما في جواز السفر" : "As on passport"}
                  className={cn("w-full h-11 px-4 border border-border-light rounded-xl text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition", isAr ? "text-right" : "")}
                />
              </div>
            </div>
            <button
              disabled={!ref.trim() || !lastName.trim()}
              className={cn(
                "mt-4 h-11 px-8 rounded-xl text-white font-semibold text-sm transition-colors",
                ref.trim() && lastName.trim() ? "bg-brand-red hover:bg-brand-red-dark" : "bg-brand-red/40 cursor-not-allowed"
              )}
            >
              {isAr ? "تسجيل الوصول" : "Check in"}
            </button>
          </div>

          {/* Steps */}
          <h2 className={cn("text-xl font-bold text-text-primary mb-6", isAr ? "text-right" : "")}>
            {isAr ? "كيف تعمل العملية؟" : "How does it work?"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((s) => (
              <div key={s.step} className="bg-white rounded-2xl border border-border-light p-5 text-center">
                <div className="w-10 h-10 rounded-full bg-brand-red/10 text-brand-red font-extrabold flex items-center justify-center mx-auto mb-3 text-sm">
                  {s.step}
                </div>
                <h3 className="font-semibold text-text-primary text-sm mb-1.5">{isAr ? s.titleAr : s.titleEn}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">{isAr ? s.descAr : s.descEn}</p>
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
