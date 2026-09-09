"use client";

import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";

const FAQS = [
  {
    category: "الحجز والدفع",
    items: [
      {
        q: "كيف يمكنني حجز رحلة طيران؟",
        a: "ادخل على صفحة حجز الطيران، أدخل المطار والتاريخ وعدد المسافرين، واختر الرحلة المناسبة. سيتواصل معك فريقنا لإتمام الدفع.",
      },
      {
        q: "ما هي طرق الدفع المتاحة؟",
        a: "نقبل الدفع نقداً في مكاتبنا، أو تحويل بنكي، أو كارت ائتماني عبر البوابة الإلكترونية الآمنة. يمكنك أيضاً الدفع بالتقسيط على رحلات مختارة.",
      },
      {
        q: "هل يمكنني الدفع بالتقسيط؟",
        a: "نعم، نوفر خيار التقسيط على رحلات مختارة مع الاحتفاظ بحق الحجز المسبق. تواصل مع فريقنا لمعرفة الشروط والباقات المتاحة.",
      },
      {
        q: "كم يستغرق تأكيد الحجز؟",
        a: "تأكيد الحجز يصلك خلال ٢-٤ ساعات من وقت الطلب. في حالات الحجز العاجل نوفر تأكيداً فورياً خلال ٣٠ دقيقة.",
      },
    ],
  },
  {
    category: "التأشيرات",
    items: [
      {
        q: "ما هي التأشيرات التي تساعدون في استخراجها؟",
        a: "نساعد في استخراج تأشيرات السياحة والأعمال والدراسة لأكثر من ٨٠ دولة حول العالم، مع التركيز على الدول الأكثر طلباً من المصريين كالإمارات والسعودية وأوروبا.",
      },
      {
        q: "ما هي الأوراق المطلوبة للتأشيرة؟",
        a: "تختلف المتطلبات حسب الدولة ونوع التأشيرة. بعد اختيار البرنامج ستجد قائمة تفصيلية بكل المستندات المطلوبة. فريقنا متاح للمساعدة في تجهيز الملف.",
      },
      {
        q: "كم يستغرق استخراج التأشيرة؟",
        a: "يتراوح الوقت بين ٣-١٤ يوم عمل حسب الدولة وموسم الطلب. نوفر خدمة التأشيرة العاجلة لبعض الدول بوقت أسرع مع رسوم إضافية.",
      },
    ],
  },
  {
    category: "الإلغاء والاسترداد",
    items: [
      {
        q: "ما سياسة الإلغاء؟",
        a: "سياسة الإلغاء تختلف حسب نوع الحجز والمزود. بشكل عام، الإلغاء قبل ٤٨ ساعة يُتيح استرداداً كاملاً أو جزئياً. الحجوزات المؤكدة قد تخضع لرسوم إلغاء.",
      },
      {
        q: "كم يستغرق استرداد المبلغ؟",
        a: "يتم الاسترداد خلال ٥-١٠ أيام عمل بنفس طريقة الدفع الأصلية. التحويل البنكي قد يستغرق أياماً إضافية حسب البنك.",
      },
      {
        q: "ماذا يحدث إذا ألغت شركة الطيران الرحلة؟",
        a: "في حال الإلغاء من طرف شركة الطيران، نضمن لك إما استرداداً كاملاً للمبلغ أو إعادة الجدولة لأقرب رحلة متاحة حسب رغبتك.",
      },
    ],
  },
  {
    category: "الرحلات السياحية",
    items: [
      {
        q: "ما الذي تشمله الرحلات السياحية؟",
        a: "كل رحلة تختلف في مكوناتها، لكن معظم رحلاتنا تشمل النقل والإقامة والوجبات المحددة والمرشد السياحي. ستجد قائمة تفصيلية بما يشمله ولا يشمله كل برنامج.",
      },
      {
        q: "هل يمكنني الاشتراك منفرداً في رحلة جماعية؟",
        a: "بالتأكيد! رحلاتنا الجماعية مصممة لاستيعاب المسافرين الأفراد. فرصة رائعة للتعرف على مسافرين جدد ومشاركة التجربة.",
      },
    ],
  },
];

export default function FaqsPage() {
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = FAQS.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        searchQuery === "" ||
        item.q.includes(searchQuery) ||
        item.a.includes(searchQuery)
    ),
  })).filter((cat) => cat.items.length > 0);

  return (
    <PageShell
      pageId="faqs"
      title="الأسئلة الشائعة"
      subtitle="إجابات على الأسئلة الأكثر شيوعاً من عملائنا"
      maxWidth="md"
    >
      {/* Search */}
      <div className="mb-8">
        <div className="relative">
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">🔍</span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في الأسئلة..."
            className="w-full h-12 pr-10 pl-4 rounded-2xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
          />
        </div>
      </div>

      {/* FAQs */}
      <div className="space-y-8">
        {filtered.map((cat) => (
          <div key={cat.category}>
            <h2 className="text-sm font-bold text-brand-green uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-6 h-0.5 bg-brand-green inline-block" />
              {cat.category}
            </h2>
            <div className="space-y-2">
              {cat.items.map((item) => {
                const key = item.q;
                const isOpen = openItem === key;
                return (
                  <div
                    key={key}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isOpen ? "border-brand-green bg-brand-green/5" : "border-border-light bg-white"
                    }`}
                  >
                    <button
                      onClick={() => setOpenItem(isOpen ? null : key)}
                      className="w-full flex items-center justify-between gap-3 px-5 py-4 text-right"
                    >
                      <span className="text-sm font-bold text-text-primary">{item.q}</span>
                      <span className={`text-brand-green text-lg shrink-0 transition-transform ${isOpen ? "rotate-45" : ""}`}>+</span>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4">
                        <p className="text-sm text-text-secondary leading-relaxed">{item.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">🤔</p>
          <p className="text-text-muted">لم نجد نتائج لـ "{searchQuery}"</p>
          <button onClick={() => setSearchQuery("")} className="mt-3 text-sm text-brand-green hover:underline">
            مسح البحث
          </button>
        </div>
      )}

      {/* CTA */}
      <div className="mt-10 p-6 bg-brand-green rounded-2xl text-center text-white">
        <p className="font-bold mb-2">لم تجد إجابتك؟</p>
        <p className="text-sm text-white/80 mb-4">فريق الدعم لدينا جاهز للمساعدة على مدار الساعة</p>
        <a
          href="tel:19699"
          className="inline-block px-6 py-2.5 bg-white text-brand-green font-bold rounded-xl hover:bg-white/90 transition-colors text-sm"
        >
          📞 اتصل بنا: ١٩٦٩٩
        </a>
      </div>
    </PageShell>
  );
}
