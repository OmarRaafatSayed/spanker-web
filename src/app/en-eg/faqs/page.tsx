"use client";

import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";

type FAQ = { q: string; a: string };
type Category = { name: string; color: string; faqs: FAQ[] };

const categories: Category[] = [
  {
    name: "الحجز",
    color: "bg-brand-green/20 text-brand-green",
    faqs: [
      {
        q: "كيف يمكنني حجز تذكرة طيران مع سبانكر؟",
        a: "يمكنك الحجز مباشرة من الصفحة الرئيسية لموقعنا باستخدام محرك البحث. أدخل نقطة المغادرة والوجهة والتاريخ وعدد المسافرين، ثم اختر الرحلة المناسبة وأتمم الدفع. ستستلم تأكيداً فورياً على بريدك الإلكتروني.",
      },
      {
        q: "هل يمكنني تعديل حجزي بعد الشراء؟",
        a: "نعم، يمكنك تعديل حجزك من خلال قسم 'حجوزاتي' على الموقع. التعديلات الممكنة تشمل تغيير تاريخ الرحلة، تحديث بيانات المسافرين، وإضافة خدمات إضافية. قد تنطبق رسوم تعديل حسب نوع التذكرة.",
      },
      {
        q: "ما هي الوثائق المطلوبة للحجز؟",
        a: "تحتاج إلى رقم جواز سفر أو بطاقة هوية سارية المفعول لكل مسافر عند الحجز. للرحلات الدولية، تأكد من أن جواز سفرك ساري لمدة ٦ أشهر على الأقل بعد تاريخ العودة.",
      },
    ],
  },
  {
    name: "الأمتعة",
    color: "bg-blue-500/20 text-blue-400",
    faqs: [
      {
        q: "ما هو الوزن المسموح به للأمتعة؟",
        a: "في الدرجة الاقتصادية: ٢٠ كجم أمتعة مسجّلة + ٧ كجم حقيبة يد. في درجة رجال الأعمال: ٣٠ كجم أمتعة مسجّلة + ١٠ كجم حقيبة يد. يمكن شراء وزن إضافي قبل الرحلة بسعر مخفّض.",
      },
      {
        q: "ماذا يحدث إذا تجاوزت الوزن المسموح به؟",
        a: "إذا تجاوزت الوزن المسموح به، ستدفع رسوم أمتعة زائدة في المطار تبدأ من ٢٠٠ جنيه/كجم. يُنصح بشراء وزن إضافي مسبقاً عبر الموقع بأسعار أفضل.",
      },
    ],
  },
  {
    name: "تسجيل الوصول",
    color: "bg-brand-yellow/20 text-brand-yellow",
    faqs: [
      {
        q: "متى يفتح باب تسجيل الوصول الإلكتروني؟",
        a: "يفتح تسجيل الوصول الإلكتروني قبل ٢٤ ساعة من موعد الإقلاع ويُغلق قبل ساعة واحدة من الرحلة. يتيح لك التسجيل الإلكتروني اختيار مقعدك وطباعة بطاقة الصعود.",
      },
      {
        q: "هل يمكنني تسجيل الوصول في المطار إذا لم أفعله إلكترونياً؟",
        a: "نعم، تُفتح عدادات تسجيل الوصول في المطار لجميع مسافرينا. ننصح بالحضور قبل ٣ ساعات من إقلاع الرحلات الدولية وساعتين للرحلات الداخلية.",
      },
    ],
  },
  {
    name: "المدفوعات",
    color: "bg-purple-500/20 text-purple-400",
    faqs: [
      {
        q: "ما هي وسائل الدفع المقبولة؟",
        a: "نقبل جميع البطاقات الائتمانية والمدينة (Visa, Mastercard)، وفودافون كاش، وإنستاباي، والدفع عبر الحساب المصرفي. جميع المعاملات مشفّرة وآمنة بتقنية SSL.",
      },
      {
        q: "متى يُستقطع مبلغ التذكرة من حسابي؟",
        a: "يُستقطع المبلغ فور إتمام عملية الحجز والدفع. ستستلم إيصال دفع وتأكيد الحجز فوراً على بريدك الإلكتروني.",
      },
    ],
  },
  {
    name: "التأشيرة",
    color: "bg-orange-500/20 text-orange-400",
    faqs: [
      {
        q: "هل تساعدني سبانكر في استخراج التأشيرة؟",
        a: "نقدم معلومات شاملة عن متطلبات التأشيرة لجميع وجهاتنا. لاستخراج تأشيرة مصر الإلكترونية للزوار القادمين، يمكنك التقديم عبر قسم 'التأشيرة والصحة' في موقعنا.",
      },
    ],
  },
];

function FAQItem({ faq, isOpen, onToggle }: { faq: FAQ; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-white/10 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 text-right gap-4 hover:text-white transition-colors"
      >
        <span className={`text-sm font-semibold leading-snug ${isOpen ? "text-white" : "text-white/80"}`}>
          {faq.q}
        </span>
        <svg
          width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
          className={`shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-brand-green" : "text-white/40"}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {isOpen && (
        <div className="pb-4 pr-2">
          <p className="text-white/65 text-sm leading-relaxed">{faq.a}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQsPage() {
  const [openKey, setOpenKey] = useState<string | null>(null);

  function toggle(key: string) {
    setOpenKey((prev) => (prev === key ? null : key));
  }

  return (
    <PageShell
      pageId="faqs"
      heroTitle="الأسئلة الشائعة"
      heroSubtitle="إجابات على أكثر الأسئلة شيوعاً من مسافرينا"
      maxWidth="xl"
      heroIcon={
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      }
    >
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-10">
        {categories.map((c) => (
          <div key={c.name} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.color} block mb-1`}>
              {c.name}
            </span>
            <p className="text-white/50 text-xs">{c.faqs.length} سؤال</p>
          </div>
        ))}
      </div>

      {/* FAQ Categories */}
      <div className="space-y-6">
        {categories.map((cat) => (
          <div key={cat.name} className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${cat.color}`}>
                {cat.name}
              </span>
              <p className="text-white/40 text-xs">{cat.faqs.length} أسئلة</p>
            </div>
            {cat.faqs.map((faq, i) => {
              const key = `${cat.name}-${i}`;
              return (
                <FAQItem
                  key={key}
                  faq={faq}
                  isOpen={openKey === key}
                  onToggle={() => toggle(key)}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Still have questions */}
      <div className="mt-8 bg-brand-green/10 border border-brand-green/30 rounded-2xl p-6 text-center">
        <h3 className="font-bold text-white mb-2">لم تجد إجابتك؟</h3>
        <p className="text-white/60 text-sm mb-4">
          فريق خدمة العملاء متاح على مدار الساعة للإجابة على استفساراتك
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a
            href="/en-eg/office-contacts"
            className="bg-brand-green text-white px-6 py-2.5 rounded-xl font-bold hover:bg-brand-green-dark transition-colors text-sm"
          >
            تواصل معنا
          </a>
          <a
            href="https://wa.me/20224186000"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-white/20 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-white/10 transition-colors text-sm"
          >
            واتساب 💬
          </a>
        </div>
      </div>
    </PageShell>
  );
}
