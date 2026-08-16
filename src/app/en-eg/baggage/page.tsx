"use client";

import { PageShell } from "@/components/layout/PageShell";

const allowances = [
  { cabin: "الدرجة الاقتصادية", economy: true, checked: "٢٠ كجم", carryon: "٧ كجم", personal: "نعم" },
  { cabin: "رجال الأعمال", economy: false, checked: "٣٠ كجم", carryon: "١٠ كجم", personal: "نعم" },
];

const carryonRules = [
  { rule: "الوزن الأقصى", value: "٧ كجم (اقتصادي) / ١٠ كجم (أعمال)" },
  { rule: "الأبعاد القصوى", value: "٥٥ × ٤٠ × ٢٠ سم" },
  { rule: "عدد القطع", value: "قطعة واحدة + حقيبة شخصية صغيرة" },
  { rule: "السوائل", value: "٢٠٠ مل كحد أقصى في حاوية واحدة" },
];

const excessFees = [
  { range: "١–٥ كجم زيادة", fee: "٢٠٠ جنيه / كجم" },
  { range: "٦–١٠ كجم زيادة", fee: "١٨٠ جنيه / كجم" },
  { range: "١١–٢٠ كجم زيادة", fee: "١٥٠ جنيه / كجم" },
  { range: "أكثر من ٢٠ كجم", fee: "بالتفاوض مع خدمة العملاء" },
];

const prohibited = [
  "المتفجرات والذخائر",
  "الغازات القابلة للاشتعال",
  "المواد الكيميائية الخطرة",
  "الأسلحة النارية (إلا بتصريح رسمي)",
  "البطاريات الليثيوم الكبيرة (>160Wh)",
  "السوائل أكثر من ١٠٠ مل في المقصورة",
  "الإبر والمشارط (في المقصورة)",
  "الولاعات والكبريت (في الحقائب المسجّلة)",
];

const special = [
  { type: "المعدات الرياضية", detail: "يجب الإبلاغ عنها مسبقاً عند الحجز. رسوم ٢٥٠–٥٠٠ جنيه حسب الحجم." },
  { type: "الآلات الموسيقية", detail: "يمكن حملها في المقصورة إذا كانت صغيرة. الكبيرة تُسجَّل كأمتعة إضافية." },
  { type: "كراسي الإعاقة", detail: "مسموح بها مجاناً ولا تُحسب من وزن الأمتعة المسجّلة." },
  { type: "الأمتعة الزائدة عن الحجم", detail: "قطع أكبر من ٩٠×٧٥×٤٣ سم تُعامل كشحن خاص." },
];

export default function BaggagePage() {
  return (
    <PageShell
      pageId="baggage"
      heroTitle="سياسة الأمتعة"
      heroSubtitle="تعرّف على قواعد الأمتعة والأوزان المسموح بها لرحلتك"
      maxWidth="xl"
      heroIcon={
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /><line x1="12" y1="12" x2="12" y2="16" /><line x1="10" y1="14" x2="14" y2="14" />
        </svg>
      }
    >
      {/* Allowances Table */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-white mb-6">مخصصات الأمتعة</h2>
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-4 bg-white/10 px-5 py-3 text-xs font-bold text-white/60 uppercase tracking-wide">
            <span>الدرجة</span>
            <span className="text-center">الأمتعة المسجّلة</span>
            <span className="text-center">حقيبة اليد</span>
            <span className="text-center">حقيبة شخصية</span>
          </div>
          {allowances.map((a) => (
            <div key={a.cabin} className="grid grid-cols-4 px-5 py-4 border-t border-white/10 items-center">
              <span className="text-white font-semibold text-sm">{a.cabin}</span>
              <span className="text-brand-yellow font-bold text-center">{a.checked}</span>
              <span className="text-white/80 text-center text-sm">{a.carryon}</span>
              <span className="text-brand-green text-center">✓</span>
            </div>
          ))}
        </div>
      </div>

      {/* Carry-on Rules */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-white mb-6">قواعد حقيبة اليد</h2>
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {carryonRules.map((r, i) => (
            <div key={r.rule} className={`flex items-center justify-between px-5 py-3.5 ${i < carryonRules.length - 1 ? "border-b border-white/10" : ""}`}>
              <span className="text-white/70 text-sm">{r.rule}</span>
              <span className="text-white font-semibold text-sm">{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Excess Fees */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-white mb-6">رسوم الأمتعة الزائدة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {excessFees.map((e) => (
            <div key={e.range} className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center">
              <span className="text-white/70 text-sm">{e.range}</span>
              <span className="text-brand-yellow font-bold text-sm">{e.fee}</span>
            </div>
          ))}
        </div>
        <p className="text-white/50 text-xs mt-3">
          * الأسعار تقريبية وقد تختلف حسب الوجهة. من الأفضل شراء وزن إضافي أونلاين قبل يوم من السفر.
        </p>
      </div>

      {/* Prohibited Items */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-white mb-6">المواد المحظورة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {prohibited.map((p) => (
            <div key={p} className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              <span className="text-red-400 shrink-0">✕</span>
              <span className="text-white/75 text-sm">{p}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Special Items */}
      <div>
        <h2 className="text-xl font-bold text-white mb-6">الأمتعة الخاصة</h2>
        <div className="space-y-3">
          {special.map((s) => (
            <div key={s.type} className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h3 className="font-bold text-white mb-1">{s.type}</h3>
              <p className="text-white/65 text-sm leading-relaxed">{s.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
