"use client";

import { PageShell } from "@/components/layout/PageShell";

const legend = [
  { color: "bg-brand-green", label: "نافذة", detail: "Window — مناظر جميلة وخصوصية أكثر" },
  { color: "bg-blue-500", label: "ممر", detail: "Aisle — سهولة الحركة والتنقل" },
  { color: "bg-white/30", label: "وسط", detail: "Middle — للمسافرين مع المجموعات" },
  { color: "bg-brand-yellow", label: "مسافة إضافية", detail: "Extra Legroom — مساحة أرجل ممتازة" },
  { color: "bg-purple-500", label: "الصف الأول", detail: "Front Row — أول من يغادر الطائرة" },
  { color: "bg-red-500/60", label: "محجوز", detail: "Occupied — غير متاح" },
];

const categories = [
  {
    name: "المقاعد العادية",
    nameEn: "Standard Seats",
    price: "مجاناً",
    features: ["تخصيص عند تسجيل الوصول", "متاح أونلاين قبل ٢٤ ساعة مجاناً"],
    color: "border-white/20",
  },
  {
    name: "مقاعد المسافة الإضافية",
    nameEn: "Extra Legroom",
    price: "من ٢٠٠ جنيه",
    features: ["مساحة أرجل إضافية ١٢+ سم", "أمام مخرج الطوارئ أو الأمام"],
    color: "border-brand-yellow/40",
    highlight: true,
  },
  {
    name: "الصف الأول",
    nameEn: "Front Row",
    price: "من ٣٥٠ جنيه",
    features: ["أول من يصعد ويغادر", "قريب من الباب والمرافق"],
    color: "border-brand-green/40",
  },
];

const howTo = [
  { when: "أثناء الحجز", desc: "اختر مقعدك مباشرة في خطوة اختيار المقاعد عند إتمام شراء التذكرة." },
  { when: "بعد الحجز", desc: "ادخل إلى قسم 'حجوزاتي' وابحث عن رحلتك لتعديل المقعد." },
  { when: "تسجيل الوصول الإلكتروني", desc: "عند تسجيل وصولك أونلاين قبل ٢٤ ساعة، يمكنك تغيير المقعد مجاناً." },
  { when: "عداد المطار", desc: "اطلب من موظف التسجيل تغيير المقعد حسب التوافر." },
];

const tips = [
  "يُنصح بالحجز المبكر للحصول على أفضل المقاعد المتاحة.",
  "المقاعد المجانية تُوزَّع تلقائياً إذا لم تختر — احجز لضمان تفضيلاتك.",
  "عائلات مع أطفال: تواصل معنا لضمان الجلوس معاً.",
  "كبار السن والحوامل: مقاعد خاصة مجانية بالقرب من المخرج.",
];

export default function SeatSelectionPage() {
  return (
    <PageShell
      pageId="seat-selection"
      heroTitle="اختيار المقعد"
      heroSubtitle="اختر مقعدك المثالي واستمتع برحلة مريحة"
      maxWidth="xl"
      heroIcon={
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M6 2v6l4 4-4 4v6h12v-6l-4-4 4-4V2z" />
        </svg>
      }
    >
      {/* Legend */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-white mb-6">دليل خريطة المقاعد</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {legend.map((l) => (
            <div key={l.label} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${l.color} shrink-0`} />
              <div>
                <p className="text-white font-semibold text-sm">{l.label}</p>
                <p className="text-white/50 text-xs">{l.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-white mb-6">فئات المقاعد والأسعار</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {categories.map((c) => (
            <div key={c.name} className={`bg-white/5 border ${c.color} rounded-2xl p-6 ${c.highlight ? "ring-1 ring-brand-yellow/30" : ""}`}>
              <h3 className="font-bold text-white mb-1">{c.name}</h3>
              <p className="text-white/50 text-xs mb-3">{c.nameEn}</p>
              <p className="text-brand-yellow font-black text-xl mb-4">{c.price}</p>
              <ul className="space-y-2">
                {c.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-white/65 text-xs">
                    <span className="text-brand-green mt-0.5 shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* How to select */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-white mb-6">كيف تختار مقعدك؟</h2>
        <div className="space-y-3">
          {howTo.map((h, i) => (
            <div key={h.when} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex gap-4">
              <div className="w-8 h-8 rounded-full bg-brand-green/20 border border-brand-green/40 flex items-center justify-center text-brand-yellow font-black text-sm shrink-0">
                {i + 1}
              </div>
              <div>
                <h3 className="font-bold text-white text-sm mb-1">{h.when}</h3>
                <p className="text-white/65 text-sm leading-relaxed">{h.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div>
        <h2 className="text-xl font-bold text-white mb-5">نصائح مفيدة</h2>
        <div className="space-y-2">
          {tips.map((tip, i) => (
            <div key={i} className="flex gap-3 items-start bg-brand-green/5 border border-brand-green/15 rounded-xl px-4 py-3">
              <span className="text-brand-green shrink-0 mt-0.5">💡</span>
              <p className="text-white/70 text-sm leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
