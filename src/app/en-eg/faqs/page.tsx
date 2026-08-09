"use client";

import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { cn } from "@/lib/utils";

const FAQ_CATEGORIES = [
  {
    label: "الحجز والتذاكر",
    icon: "🎫",
    items: [
      {
        q: "كيف يمكنني حجز رحلة مع سبانكر؟",
        a: "يمكنك الحجز عبر موقعنا الإلكتروني أو تطبيق سبانكر للجوال أو الاتصال بخدمة العملاء على الرقم 19970.",
      },
      {
        q: "هل يمكنني تعديل حجزي بعد التأكيد؟",
        a: "نعم، يمكن تعديل الحجز من خلال صفحة 'حجوزاتي' على الموقع أو التطبيق، مع مراعاة سياسة التغيير المطبّقة على نوع التذكرة.",
      },
      {
        q: "ما هي طرق الدفع المتاحة؟",
        a: "نقبل بطاقات الائتمان والخصم (Visa, Mastercard)، بطاقات Meeza المصرية، المحافظ الرقمية (Fawry, Vodafone Cash)، والتحويل البنكي.",
      },
      {
        q: "هل أستطيع حجز رحلة لشخص آخر؟",
        a: "بالتأكيد. يمكنك حجز رحلة لأي شخص باستخدام بياناته الشخصية، مع العلم أن اسم المسافر على التذكرة يجب أن يطابق الهوية الرسمية.",
      },
    ],
  },
  {
    label: "الأمتعة",
    icon: "🧳",
    items: [
      {
        q: "ما هو المسموح به من الأمتعة في الدرجة الاقتصادية؟",
        a: "تشمل الدرجة الاقتصادية قطعة أمتعة مسجّلة وزنها 20 كجم + حقيبة يد (8 كجم) بشكل افتراضي. يختلف الوزن حسب الباقة المختارة.",
      },
      {
        q: "كيف أضيف أمتعة إضافية؟",
        a: "من خلال صفحة 'حجوزاتي' بعد تسجيل الدخول، أو عند إتمام الحجز. إضافة أمتعة قبل الرحلة أوفر من دفعها في المطار.",
      },
      {
        q: "هل يُسمح بحمل السوائل في حقيبة اليد؟",
        a: "وفقاً للوائح الطيران الدولية، يُسمح بحمل سوائل في حاويات لا تتجاوز 100 مل لكل منها، ضمن كيس شفاف بسعة لا تتجاوز لتراً واحداً.",
      },
    ],
  },
  {
    label: "تسجيل الوصول",
    icon: "✅",
    items: [
      {
        q: "متى يفتح تسجيل الوصول الإلكتروني؟",
        a: "يفتح التسجيل الإلكتروني قبل 48 ساعة من موعد إقلاع رحلتك ويغلق قبل ساعتين من الإقلاع.",
      },
      {
        q: "هل يمكنني اختيار مقعدي عند تسجيل الوصول؟",
        a: "نعم، يتيح لك التسجيل الإلكتروني اختيار مقعدك من الخريطة المتاحة. بعض المقاعد المميزة تتطلب رسوماً إضافية.",
      },
      {
        q: "ما الوثائق المطلوبة في المطار؟",
        a: "جواز السفر ساري المفعول (أو بطاقة الهوية الوطنية للرحلات الداخلية) + بطاقة الصعود (ورقية أو إلكترونية).",
      },
    ],
  },
  {
    label: "الاسترداد والإلغاء",
    icon: "💳",
    items: [
      {
        q: "هل يمكنني إلغاء رحلتي واسترداد المبلغ؟",
        a: "تتوقف إمكانية الاسترداد على نوع التذكرة المشتراة. التذاكر المرنة قابلة للاسترداد الكامل، بينما التذاكر الاقتصادية قد تخضع لرسوم إلغاء.",
      },
      {
        q: "كم يستغرق استرداد المبلغ؟",
        a: "يتم الاسترداد خلال 7–14 يوم عمل حسب البنك أو طريقة الدفع المستخدمة.",
      },
      {
        q: "ماذا يحدث إذا ألغت سبانكر رحلتي؟",
        a: "في حال إلغاء الرحلة من جانبنا، نقدم لك خيار التحويل لرحلة بديلة أو الاسترداد الكامل دون أي رسوم.",
      },
    ],
  },
];

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border-light last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-right text-sm font-medium text-text-primary hover:text-brand-red transition-colors"
        aria-expanded={open}
      >
        <span className="flex-1 text-right">{q}</span>
        <span
          className={cn(
            "shrink-0 mr-3 text-brand-red transition-transform duration-200 text-xl leading-none font-light",
            open ? "rotate-45" : ""
          )}
        >
          +
        </span>
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 text-sm text-text-secondary leading-relaxed",
          open ? "max-h-64 pb-4 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        {a}
      </div>
    </div>
  );
}

export default function FaqsPage() {
  const [activeCategory, setActiveCategory] = useState(0);
  const category = FAQ_CATEGORIES[activeCategory];

  return (
    <PageShell
      pageId="faqs"
      section="سبانكر"
      title="الأسئلة الشائعة"
      subtitle="إجابات سريعة لأكثر الأسئلة شيوعاً"
      maxWidth="md"
      breadcrumbs={[
        { label: "الرئيسية", href: "/" },
        { label: "الأسئلة الشائعة" },
      ]}
    >
      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {FAQ_CATEGORIES.map((cat, i) => (
          <button
            key={cat.label}
            onClick={() => setActiveCategory(i)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
              activeCategory === i
                ? "bg-brand-red text-white shadow-sm"
                : "bg-bg-alt text-text-secondary hover:bg-brand-red/10 hover:text-brand-red"
            )}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Accordion */}
      <div className="bg-white border border-border-light rounded-2xl px-5">
        {category.items.map((item) => (
          <AccordionItem key={item.q} q={item.q} a={item.a} />
        ))}
      </div>

      {/* Still need help */}
      <div className="mt-8 bg-bg-alt rounded-2xl p-6 text-center">
        <p className="text-sm font-semibold text-text-primary mb-1">لم تجد إجابتك؟</p>
        <p className="text-xs text-text-secondary mb-4">فريق خدمة العملاء متاح على مدار الساعة</p>
        <div className="flex justify-center gap-3 flex-wrap">
          <a
            href="tel:19970"
            className="px-5 py-2 rounded-full bg-brand-red text-white text-sm font-semibold hover:bg-brand-red-dark transition-colors"
          >
            📞 اتصل بنا — 19970
          </a>
          <a
            href="mailto:support@spanker.com"
            className="px-5 py-2 rounded-full border-2 border-brand-red text-brand-red text-sm font-semibold hover:bg-brand-red hover:text-white transition-colors"
          >
            📧 راسلنا
          </a>
        </div>
      </div>
    </PageShell>
  );
}
