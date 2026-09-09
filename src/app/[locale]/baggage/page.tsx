"use client";
import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";

const CLASSES = [
  { id: "economy",  label: "اقتصادية", carry: "١ × ٧ كجم",  checked: "١ × ٢٣ كجم", extra: "١٥٠ج.م / كجم" },
  { id: "business", label: "أعمال",    carry: "٢ × ٧ كجم",  checked: "٢ × ٣٢ كجم", extra: "١٠٠ج.م / كجم" },
  { id: "first",    label: "أولى",     carry: "٢ × ١٠ كجم", checked: "٣ × ٣٢ كجم", extra: "مجاني" },
];

const RESTRICTED = [
  { category: "ممنوع كلياً",               color: "bg-red-50 border-red-200 text-red-700",       items: ["المتفجرات والألعاب النارية","الأسلحة النارية بدون تصريح","الغازات القابلة للاشتعال","المواد الكيميائية الخطرة"] },
  { category: "مسموح في الأمتعة فقط",      color: "bg-amber-50 border-amber-200 text-amber-700", items: ["السكاكين وأدوات القطع","الأدوات الحادة","المقص أكبر من ٦ سم","عصي الهوكي والغولف"] },
  { category: "قيود السوائل (حقيبة يد)",   color: "bg-blue-50 border-blue-200 text-blue-700",   items: ["١٠٠مل كحد أقصى للحاوية","كيس بلاستيك شفاف ١ لتر","مستحضرات التجميل والعطور","مياه الشرب تُشترى بعد الأمن"] },
];

const TIPS = [
  { icon: "⚖️", tip: "زن حقائبك في البيت قبل المطار لتفادي الرسوم الإضافية" },
  { icon: "🔒", tip: "استخدم قفل TSA على حقائبك المسجلة لضمان أمانها" },
  { icon: "💊", tip: "ضع الأدوية والمستندات دائماً في حقيبة اليد" },
  { icon: "📸", tip: "صوّر محتويات حقيبتك قبل السفر كمرجع في حالة الفقدان" },
  { icon: "🏷️", tip: "اكتب اسمك ورقم هاتفك على بطاقة الحقيبة من الداخل والخارج" },
  { icon: "🔋", tip: "أخرج البطاريات والأجهزة الإلكترونية من الحقائب المسجلة" },
];

export default function BaggagePage() {
  const [activeClass, setActiveClass] = useState("economy");
  const current = CLASSES.find((c) => c.id === activeClass)!;
  return (
    <PageShell pageId="baggage" title="معلومات الأمتعة" subtitle="كل ما تحتاج معرفته عن قواعد الأمتعة وسياسة الحمل" maxWidth="lg">
      <div className="flex gap-2 mb-6">
        {CLASSES.map((c) => (
          <button key={c.id} onClick={() => setActiveClass(c.id)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${activeClass === c.id ? "bg-brand-green text-white border-brand-green" : "border-border-default text-text-secondary hover:border-brand-green/40"}`}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[{label:"حقيبة اليد",value:current.carry,icon:"🎒"},{label:"الأمتعة المسجلة",value:current.checked,icon:"🧳"},{label:"رسوم الزيادة",value:current.extra,icon:"💰"}].map(({label,value,icon})=>(
          <div key={label} className="text-center bg-white rounded-2xl border border-border-light p-5">
            <span className="text-3xl block mb-2">{icon}</span>
            <p className="text-base font-bold text-brand-green mb-1">{value}</p>
            <p className="text-xs text-text-muted">{label}</p>
          </div>
        ))}
      </div>
      <div className="mb-8">
        <h2 className="text-lg font-bold text-text-primary mb-4">القواعد والممنوعات</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {RESTRICTED.map(({category,color,items})=>(
            <div key={category} className={`rounded-2xl border p-4 ${color}`}>
              <p className="font-bold text-sm mb-3">{category}</p>
              <ul className="space-y-1">{items.map((item)=><li key={item} className="text-xs">• {item}</li>)}</ul>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold text-text-primary mb-4">نصائح للمسافر</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TIPS.map(({icon,tip})=>(
            <div key={tip} className="flex gap-3 p-4 bg-white rounded-2xl border border-border-light">
              <span className="text-xl shrink-0">{icon}</span>
              <p className="text-sm text-text-secondary">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
