"use client";

import { PageShell } from "@/components/layout/PageShell";

const counters = [
  { airport: "مطار القاهرة الدولي", terminal: "المبنى ٢ و٣", hours: "٢٤ ساعة يومياً", code: "CAI" },
  { airport: "مطار شرم الشيخ", terminal: "المبنى الرئيسي", hours: "يفتح قبل الرحلة بـ٣ ساعات", code: "SSH" },
  { airport: "مطار الغردقة", terminal: "المبنى الدولي", hours: "يفتح قبل الرحلة بـ٣ ساعات", code: "HRG" },
  { airport: "مطار أسوان", terminal: "المبنى الوحيد", hours: "يفتح قبل الرحلة بـ٢ ساعات", code: "ASW" },
];

const bringItems = [
  { icon: "🛂", title: "جواز السفر أو البطاقة", detail: "ساري المفعول — لا تنسَ التأكد من صلاحيته قبل السفر" },
  { icon: "📋", title: "رقم الحجز (PNR)", detail: "يظهر على بريد التأكيد الإلكتروني" },
  { icon: "💳", title: "التأشيرة", detail: "للوجهات الدولية التي تستلزم تأشيرة مسبقة" },
  { icon: "🧳", title: "الأمتعة", detail: "تأكد من عدم تجاوز الوزن المسموح به" },
];

const tips = [
  "احضر إلى المطار قبل موعد إقلاع رحلتك الدولية بـ ٣ ساعات على الأقل.",
  "للرحلات الداخلية، احضر قبل ساعتين من الإقلاع.",
  "قم بإغلاق حقائبك جيداً وعلّق عليها بطاقة اسمك ورقم هاتفك.",
  "لا تترك أمتعتك دون مراقبة في أي وقت داخل المطار.",
  "أبلغ موظفي التسجيل إذا كانت لديك أمتعة خاصة (رياضية، طبية).",
  "احمل مواد السوائل في حقيبة شفافة لا تتجاوز ١ لتر للمرور الآمن من نقطة الأمن.",
];

export default function AirportCheckinPage() {
  return (
    <PageShell
      pageId="airport-check-in"
      heroTitle="تسجيل الوصول بالمطار"
      heroSubtitle="كل ما تحتاج معرفته عن عداد تسجيل الوصول في مطاراتنا"
      maxWidth="xl"
      heroIcon={
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      }
    >
      {/* Counter Hours */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-white mb-6">مواعيد عمل عدادات التسجيل</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {counters.map((c) => (
            <div key={c.code} className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-white">{c.airport}</h3>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-brand-green/20 text-brand-green">
                  {c.code}
                </span>
              </div>
              <p className="text-white/50 text-xs mb-1">📍 {c.terminal}</p>
              <p className="text-brand-yellow text-sm font-semibold">🕐 {c.hours}</p>
            </div>
          ))}
        </div>
      </div>

      {/* What to bring */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-white mb-6">ماذا تحضر معك؟</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {bringItems.map((b) => (
            <div key={b.title} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex gap-3">
              <span className="text-2xl shrink-0">{b.icon}</span>
              <div>
                <h3 className="font-bold text-white text-sm mb-1">{b.title}</h3>
                <p className="text-white/65 text-xs leading-relaxed">{b.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Baggage Drop */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
        <h2 className="text-xl font-bold text-white mb-4">إيداع الأمتعة</h2>
        <p className="text-white/65 text-sm leading-relaxed mb-4">
          بعد تسجيل الوصول، توجّه إلى عداد إيداع الأمتعة وسلّم حقائبك للموظف المختص.
          ستستلم ملصقات الأمتعة (Baggage Tags) وستصل حقائبك إلى وجهتك تلقائياً.
        </p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-brand-yellow font-black text-2xl">٢٠ كجم</p>
            <p className="text-white/60 text-xs mt-1">اقتصادي</p>
          </div>
          <div>
            <p className="text-brand-yellow font-black text-2xl">٣٠ كجم</p>
            <p className="text-white/60 text-xs mt-1">رجال الأعمال</p>
          </div>
          <div>
            <p className="text-brand-yellow font-black text-2xl">٧ كجم</p>
            <p className="text-white/60 text-xs mt-1">حقيبة اليد</p>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div>
        <h2 className="text-xl font-bold text-white mb-6">نصائح للتسجيل السريع</h2>
        <div className="space-y-3">
          {tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl px-5 py-3">
              <span className="text-brand-green font-bold mt-0.5 shrink-0">✓</span>
              <p className="text-white/70 text-sm leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
