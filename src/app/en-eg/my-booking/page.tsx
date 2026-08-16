"use client";

import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";

const steps = [
  {
    num: "١",
    title: "سجّل الدخول",
    desc: "ادخل إلى حسابك باستخدام البريد الإلكتروني وكلمة المرور المسجّلة.",
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <polyline points="10 17 15 12 10 7" />
        <line x1="15" y1="12" x2="3" y2="12" />
      </svg>
    ),
  },
  {
    num: "٢",
    title: "ابحث بالرقم المرجعي",
    desc: "أدخل رقم الحجز (PNR) الموجود في تذكرتك الإلكترونية مع اسم المسافر.",
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    num: "٣",
    title: "أدر حجزك",
    desc: "استعرض تفاصيل الرحلة وأجرِ التعديلات المطلوبة أو استرد قيمة التذكرة.",
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
];

const actions = [
  { icon: "💺", title: "تغيير المقعد", desc: "اختر مقعدك المفضل أو غيّره قبل ٢٤ ساعة من الإقلاع." },
  { icon: "🧳", title: "إضافة أمتعة", desc: "أضف أمتعة إضافية بسعر مخفّض مقارنة بسعر المطار." },
  { icon: "✏️", title: "تعديل البيانات", desc: "صحّح خطأ في الاسم أو معلومات جواز السفر." },
  { icon: "🔄", title: "إعادة الجدولة", desc: "غيّر موعد رحلتك مع رسوم تعديل تبدأ من ٢٠٠ جنيه." },
  { icon: "❌", title: "إلغاء الحجز", desc: "ألغِ حجزك واستلم الاسترداد وفق سياسة الإلغاء." },
  { icon: "📄", title: "طباعة التذكرة", desc: "اطبع تذكرتك الإلكترونية أو احفظها بصيغة PDF." },
];

export default function MyBookingPage() {
  return (
    <PageShell
      pageId="my-booking"
      heroTitle="حجوزاتي"
      heroSubtitle="أدر حجوزاتك وتتبّع رحلاتك بكل سهولة"
      maxWidth="xl"
      heroIcon={
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      }
    >
      {/* Steps */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-white mb-6">كيف تصل إلى حجزك؟</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {steps.map((s) => (
            <div key={s.num} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-brand-green/20 border border-brand-green/40 flex items-center justify-center text-brand-green shrink-0">
                  {s.icon}
                </div>
                <span className="text-brand-yellow font-black text-2xl">{s.num}</span>
              </div>
              <h3 className="font-bold text-white mb-2">{s.title}</h3>
              <p className="text-white/65 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* What you can do */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-white mb-6">ماذا يمكنك فعله؟</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((a) => (
            <div key={a.title} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex gap-3">
              <span className="text-2xl shrink-0">{a.icon}</span>
              <div>
                <h3 className="font-bold text-white text-sm mb-1">{a.title}</h3>
                <p className="text-white/65 text-xs leading-relaxed">{a.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tracking info */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        <h3 className="font-bold text-white mb-3 flex items-center gap-2">
          <span className="text-brand-yellow">ℹ</span>
          رقم التتبع (PNR)
        </h3>
        <p className="text-white/65 text-sm leading-relaxed">
          رقم الحجز المرجعي (PNR) هو رمز مكوّن من ٦ أحرف يظهر في تذكرتك الإلكترونية وعلى البريد الإلكتروني لتأكيد الحجز.
          احتفظ به دائماً للرجوع إليه في أي وقت.
        </p>
        <div className="mt-4 bg-brand-green/10 border border-brand-green/20 rounded-xl p-3 inline-block">
          <p className="text-brand-green font-mono font-bold text-lg tracking-widest">ABC123</p>
          <p className="text-white/50 text-xs mt-1">مثال على رقم الحجز</p>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <p className="text-white/65 text-sm mb-4">هل لديك حساب؟ سجّل الدخول الآن للوصول لجميع حجوزاتك</p>
        <Link
          href="/login"
          className="inline-block bg-brand-green text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-green-dark transition-colors"
        >
          تسجيل الدخول
        </Link>
      </div>
    </PageShell>
  );
}
