"use client";

import { useState } from "react";
import { CalendarIcon } from "@/components/icons";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";

export default function MyBookingPage() {
  const { locale, isRTL } = useI18n();
  const isAr = locale === "ar";
  const [ref, setRef] = useState("");
  const [lastName, setLastName] = useState("");
  const [searched, setSearched] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearched(true);
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bg-alt pt-18 pb-20 lg:pb-0" dir={isRTL ? "rtl" : "ltr"}>
        {/* Hero */}
        <section className="bg-brand-red text-white py-14 sm:py-20">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              {isAr ? "حجوزاتي" : "My Booking"}
            </h1>
            <p className="text-white/80">
              {isAr
                ? "أدخل رقم الحجز واسم العائلة للبحث عن حجزك"
                : "Enter your booking reference and last name to retrieve your booking"}
            </p>
          </div>
        </section>

        <div className="max-w-lg mx-auto px-4 py-12">
          <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-border-light p-6 flex flex-col gap-4">
            <div>
              <label className={cn("block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide", isAr ? "text-right" : "")}>
                {isAr ? "رقم الحجز" : "Booking Reference"}
              </label>
              <input
                type="text"
                value={ref}
                onChange={(e) => setRef(e.target.value.toUpperCase())}
                placeholder="e.g. SP1234"
                maxLength={8}
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
                placeholder={isAr ? "كما هو في جواز السفر" : "As shown on passport"}
                className={cn("w-full h-11 px-4 border border-border-light rounded-xl text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition", isAr ? "text-right" : "")}
              />
            </div>
            <button
              type="submit"
              disabled={!ref.trim() || !lastName.trim()}
              className={cn(
                "h-11 rounded-xl text-white font-semibold text-sm transition-colors",
                ref.trim() && lastName.trim() ? "bg-brand-red hover:bg-brand-red-dark" : "bg-brand-red/40 cursor-not-allowed"
              )}
            >
              {isAr ? "بحث عن الحجز" : "Retrieve Booking"}
            </button>
          </form>

          {searched && (
            <div className="mt-6 bg-white rounded-2xl border border-border-light p-6 text-center">
              <div className="w-14 h-14 bg-bg-alt rounded-full flex items-center justify-center mx-auto mb-3">
                <CalendarIcon size={26} className="text-text-muted opacity-60" />
              </div>
              <p className="font-semibold text-text-primary mb-1">
                {isAr ? "لم يتم العثور على حجز" : "No booking found"}
              </p>
              <p className="text-sm text-text-secondary">
                {isAr
                  ? "تحقق من رقم الحجز واسم العائلة وحاول مجدداً"
                  : "Please check your booking reference and last name and try again"}
              </p>
            </div>
          )}

          {/* Help */}
          <div className="mt-8 bg-brand-red/5 border border-brand-red/20 rounded-2xl p-5">
            <h3 className={cn("font-semibold text-text-primary mb-3", isAr ? "text-right" : "")}>
              {isAr ? "أين أجد رقم الحجز؟" : "Where to find your booking reference?"}
            </h3>
            <ul className={cn("text-sm text-text-secondary space-y-1.5", isAr ? "text-right" : "")}>
              {[
                { ar: "في رسالة التأكيد المرسلة إلى بريدك الإلكتروني", en: "In the confirmation email sent to your inbox" },
                { ar: "على تذكرة السفر الإلكترونية (رمز مكوّن من 6–8 أحرف)", en: "On your e-ticket (6–8 character code)" },
                { ar: "في تطبيق سبانكر تحت «رحلاتي»", en: "In the Spanker app under 'My Trips'" },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-brand-red mt-0.5 shrink-0">•</span>
                  {isAr ? item.ar : item.en}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
