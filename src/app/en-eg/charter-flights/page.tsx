"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";

const USES = [
  { icon: "🏢", titleEn: "Corporate Travel", titleAr: "السفر للأعمال", descEn: "Move your team anywhere, on your schedule.", descAr: "انقل فريقك إلى أي مكان وفق جدولك." },
  { icon: "🎉", titleEn: "Events & Groups", titleAr: "الفعاليات والمجموعات", descEn: "Sports teams, weddings, conferences — we handle the logistics.", descAr: "فرق رياضية، حفلات زفاف، مؤتمرات — نحن نتولى اللوجستيات." },
  { icon: "🏖️", titleEn: "Leisure Packages", titleAr: "باقات الترفيه", descEn: "Exclusive resort packages with a private aircraft.", descAr: "باقات منتجع حصرية مع طائرة خاصة." },
  { icon: "🚑", titleEn: "Medical Evacuation", titleAr: "الإخلاء الطبي", descEn: "24/7 medical flight support with equipped aircraft.", descAr: "دعم طيران طبي على مدار الساعة مع طائرات مجهّزة." },
];

const FLEET_OPTIONS = [
  { model: "Airbus A320", seats: 180, rangeEn: "Up to 6,300 km", rangeAr: "حتى 6,300 كم" },
  { model: "Airbus A321", seats: 220, rangeEn: "Up to 5,950 km", rangeAr: "حتى 5,950 كم" },
  { model: "Airbus A220-300", seats: 130, rangeEn: "Up to 6,300 km", rangeAr: "حتى 6,300 كم" },
];

export default function CharterFlightsPage() {
  const { locale, isRTL } = useI18n();
  const isAr = locale === "ar";

  const [form, setForm] = useState({ name: "", email: "", phone: "", pax: "", from: "", to: "", date: "", notes: "" });
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bg-alt pt-18 pb-20 lg:pb-0" dir={isRTL ? "rtl" : "ltr"}>
        {/* Hero */}
        <section className="bg-brand-red text-white py-14 sm:py-20">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              {isAr ? "رحلات الطائرة المستأجرة" : "Charter Flights"}
            </h1>
            <p className="text-white/80">
              {isAr
                ? "طائرتك الخاصة، جدولك الخاص — لأي وجهة تريد"
                : "Your aircraft, your schedule — to any destination you choose"}
            </p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 py-12 flex flex-col gap-14">
          {/* Use cases */}
          <div>
            <h2 className={cn("text-2xl font-bold text-text-primary mb-6", isAr ? "text-right" : "")}>
              {isAr ? "لماذا تختار الطائرة المستأجرة؟" : "Why charter with us?"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {USES.map((u) => (
                <div key={u.titleEn} className="bg-white rounded-2xl border border-border-light p-5 flex gap-4">
                  <span className="text-3xl shrink-0">{u.icon}</span>
                  <div>
                    <h3 className="font-bold text-text-primary mb-1">{isAr ? u.titleAr : u.titleEn}</h3>
                    <p className={cn("text-sm text-text-secondary", isAr ? "text-right" : "")}>{isAr ? u.descAr : u.descEn}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Available aircraft */}
          <div>
            <h2 className={cn("text-2xl font-bold text-text-primary mb-6", isAr ? "text-right" : "")}>
              {isAr ? "الطائرات المتاحة" : "Available Aircraft"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {FLEET_OPTIONS.map((f) => (
                <div key={f.model} className="bg-white rounded-2xl border border-border-light p-5 text-center">
                  <p className="text-4xl mb-3">✈️</p>
                  <h3 className="font-bold text-text-primary">{f.model}</h3>
                  <p className="text-sm text-text-secondary mt-1">{f.seats} {isAr ? "مقعد" : "seats"}</p>
                  <p className="text-xs text-text-muted mt-0.5">{isAr ? f.rangeAr : f.rangeEn}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Request form */}
          <div>
            <h2 className={cn("text-2xl font-bold text-text-primary mb-6", isAr ? "text-right" : "")}>
              {isAr ? "طلب عرض سعر" : "Request a Quote"}
            </h2>
            {submitted ? (
              <div className="bg-white rounded-2xl border border-emerald-200 p-8 text-center">
                <p className="text-4xl mb-3">✅</p>
                <h3 className="font-bold text-text-primary mb-2">
                  {isAr ? "تم استلام طلبك!" : "Request received!"}
                </h3>
                <p className="text-sm text-text-secondary">
                  {isAr
                    ? "سيتواصل معك فريقنا خلال 24 ساعة."
                    : "Our team will contact you within 24 hours."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border-light p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {[
                    { key: "name", labelEn: "Full Name", labelAr: "الاسم الكامل", placeholder: isAr ? "اسمك" : "Your name" },
                    { key: "email", labelEn: "Email", labelAr: "البريد الإلكتروني", placeholder: "email@example.com" },
                    { key: "phone", labelEn: "Phone", labelAr: "الهاتف", placeholder: "+20 xxx xxx xxxx" },
                    { key: "pax", labelEn: "No. of Passengers", labelAr: "عدد المسافرين", placeholder: "e.g. 50" },
                    { key: "from", labelEn: "From", labelAr: "من", placeholder: isAr ? "مطار الانطلاق" : "Departure airport" },
                    { key: "to", labelEn: "To", labelAr: "إلى", placeholder: isAr ? "مطار الوصول" : "Arrival airport" },
                    { key: "date", labelEn: "Travel Date", labelAr: "تاريخ السفر", placeholder: "" },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className={cn("block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide", isAr ? "text-right" : "")}>
                        {isAr ? field.labelAr : field.labelEn}
                      </label>
                      <input
                        type={field.key === "date" ? "date" : field.key === "email" ? "email" : "text"}
                        placeholder={field.placeholder}
                        value={form[field.key as keyof typeof form]}
                        onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                        className={cn("w-full h-11 px-4 border border-border-light rounded-xl text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition", isAr ? "text-right" : "")}
                      />
                    </div>
                  ))}
                </div>
                <div className="mb-4">
                  <label className={cn("block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide", isAr ? "text-right" : "")}>
                    {isAr ? "ملاحظات إضافية" : "Additional Notes"}
                  </label>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    placeholder={isAr ? "أي متطلبات خاصة..." : "Any special requirements..."}
                    className={cn("w-full px-4 py-3 border border-border-light rounded-xl text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition resize-none", isAr ? "text-right" : "")}
                  />
                </div>
                <button
                  type="submit"
                  className="px-8 h-11 bg-brand-red text-white font-semibold text-sm rounded-xl hover:bg-brand-red-dark transition-colors"
                >
                  {isAr ? "إرسال الطلب" : "Send Request"}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
