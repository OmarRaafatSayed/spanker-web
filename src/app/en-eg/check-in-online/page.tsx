"use client";

import { PageShell } from "@/components/layout/PageShell";

const steps = [
  {
    title: "ابحث عن حجزك",
    desc: "أدخل رقم الحجز (PNR) واسم المسافر الأخير كما يظهر في التذكرة.",
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    title: "اختر مقعدك",
    desc: "اختر المقعد المتاح على خريطة الطائرة أو احتفظ بالمقعد الحالي.",
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M6 2v6l4 4-4 4v6h12v-6l-4-4 4-4V2z" />
      </svg>
    ),
  },
  {
    title: "استلم بطاقة الصعود",
    desc: "اطبع بطاقة الصعود أو احفظها على هاتفك ليتم مسحها عند البوابة.",
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
  },
];

const requirements = [
  { item: "جواز السفر / البطاقة الشخصية", detail: "ساري المفعول وغير منتهي الصلاحية" },
  { item: "رقم الحجز (PNR)", detail: "٦ أحرف — موجود في بريد التأكيد" },
  { item: "بيانات التأشيرة", detail: "للرحلات الدولية فقط عند الطلب" },
  { item: "معلومات الأمتعة", detail: "عدد الحقائب والوزن التقريبي" },
];

const benefits = [
  { icon: "⚡", text: "تجنب طوابير الانتظار في المطار" },
  { icon: "💺", text: "احجز مقعدك المفضل مبكراً" },
  { icon: "📱", text: "بطاقة صعود على هاتفك — بدون طباعة" },
  { icon: "⏱️", text: "وفّر وقتك واصل إلى البوابة مباشرة" },
];

export default function OnlineCheckinPage() {
  return (
    <PageShell
      pageId="check-in-online"
      heroTitle="تسجيل الوصول الإلكتروني"
      heroSubtitle="سجّل وصولك من راحة بيتك قبل ٢٤ ساعة من موعد رحلتك"
      maxWidth="xl"
      heroIcon={
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      }
    >
      {/* Timing Banner */}
      <div className="bg-brand-green/10 border border-brand-green/30 rounded-2xl p-5 mb-8 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-brand-green/20 border border-brand-green/30 flex items-center justify-center text-brand-yellow shrink-0">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-white mb-1">متى يبدأ تسجيل الوصول الإلكتروني؟</h3>
          <p className="text-white/65 text-sm">
            يفتح باب التسجيل الإلكتروني قبل <span className="text-brand-yellow font-bold">٢٤ ساعة</span> من موعد الإقلاع ويُغلق قبل الرحلة بـ
            <span className="text-brand-yellow font-bold"> ساعة واحدة</span>.
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-white mb-6">خطوات تسجيل الوصول</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {steps.map((s, i) => (
            <div key={s.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 relative">
              <div className="absolute top-4 right-4 text-white/10 font-black text-5xl leading-none select-none">
                {i + 1}
              </div>
              <div className="w-12 h-12 rounded-xl bg-brand-green/20 border border-brand-green/30 flex items-center justify-center text-brand-green mb-4">
                {s.icon}
              </div>
              <h3 className="font-bold text-white mb-2">{s.title}</h3>
              <p className="text-white/65 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Requirements */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-white mb-6">ما الذي ستحتاجه؟</h2>
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {requirements.map((r, i) => (
            <div
              key={r.item}
              className={`flex items-center justify-between px-6 py-4 ${i < requirements.length - 1 ? "border-b border-white/10" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-brand-green shrink-0" />
                <span className="text-white font-medium text-sm">{r.item}</span>
              </div>
              <span className="text-white/50 text-xs">{r.detail}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div>
        <h2 className="text-xl font-bold text-white mb-6">مميزات التسجيل الإلكتروني</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {benefits.map((b) => (
            <div key={b.text} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4">
              <span className="text-2xl shrink-0">{b.icon}</span>
              <p className="text-white/80 text-sm font-medium">{b.text}</p>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
