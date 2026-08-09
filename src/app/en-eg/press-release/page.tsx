import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = {
  title: "البيانات الصحفية | Press Release — Spanker",
  description: "أحدث البيانات الصحفية والإعلانات الرسمية من سبانكر.",
};

const PRESS_ITEMS = [
  {
    id: 1,
    date: "20 مارس 2024",
    tag: "توسعة",
    title: "سبانكر تعلن إضافة 5 وجهات أوروبية جديدة لصيف 2024",
    body: "أعلنت شركة سبانكر للطيران اليوم عن خطتها لإضافة خمس وجهات أوروبية جديدة ضمن جدول رحلاتها الصيفي لعام 2024، في إطار استراتيجيتها للتوسع وتلبية الطلب المتزايد.",
  },
  {
    id: 2,
    date: "5 فبراير 2024",
    tag: "أسطول",
    title: "استلام طائرة Airbus A320neo الجديدة لتعزيز الأسطول",
    body: "أتمّت سبانكر اليوم استلام أحدث طائراتها من طراز Airbus A320neo ضمن برنامج التحديث الشامل للأسطول، مما يرفع إجمالي الطائرات إلى 18 طائرة.",
  },
  {
    id: 3,
    date: "12 يناير 2024",
    tag: "شراكات",
    title: "سبانكر توقّع اتفاقية رمز مشترك مع شركة طيران دولية",
    body: "وقّعت سبانكر اتفاقية تشارك في رموز الرحلات مع إحدى كبرى شركات الطيران الأوروبية، مما سيتيح للمسافرين حجز رحلات متصلة بسهولة أكبر.",
  },
  {
    id: 4,
    date: "3 ديسمبر 2023",
    tag: "جوائز",
    title: "سبانكر تحصل على جائزة أفضل شركة طيران اقتصادي في الشرق الأوسط",
    body: "تُكرّم جوائز السفر لعام 2023 سبانكر بجائزة أفضل شركة طيران اقتصادي في منطقة الشرق الأوسط وشمال أفريقيا.",
  },
  {
    id: 5,
    date: "15 أكتوبر 2023",
    tag: "مالي",
    title: "نتائج الربع الثالث: نمو بنسبة 28% في إجمالي المسافرين",
    body: "كشفت سبانكر عن نتائجها المالية للربع الثالث من 2023، مسجّلةً نمواً بنسبة 28% في أعداد المسافرين مقارنةً بالفترة ذاتها من العام الماضي.",
  },
];

export default function PressReleasePage() {
  return (
    <PageShell
      pageId="press-release"
      section="سبانكر"
      title="البيانات الصحفية"
      subtitle="أحدث الإعلانات والأخبار الرسمية"
      breadcrumbs={[
        { label: "الرئيسية", href: "/" },
        { label: "عن الشركة" },
        { label: "البيانات الصحفية" },
      ]}
    >
      {/* Media contact banner */}
      <div className="bg-brand-red/5 border border-brand-red/20 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-text-primary mb-0.5 text-sm">للاستفسارات الإعلامية</p>
          <p className="text-xs text-text-secondary">media@spanker.com · +20 2 1234 5678</p>
        </div>
        <a
          href="mailto:media@spanker.com"
          className="shrink-0 px-5 py-2 rounded-full bg-brand-red text-white text-sm font-semibold hover:bg-brand-red-dark transition-colors"
        >
          تواصل مع فريق الإعلام
        </a>
      </div>

      {/* Press list */}
      <div className="space-y-4">
        {PRESS_ITEMS.map((item) => (
          <article
            key={item.id}
            className="border border-border-light rounded-2xl p-5 hover:shadow-sm transition-shadow duration-200"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-semibold text-brand-red bg-brand-red/10 px-2.5 py-1 rounded-full">
                {item.tag}
              </span>
              <span className="text-xs text-text-muted">{item.date}</span>
            </div>
            <h2 className="text-base font-bold text-text-primary mb-2">{item.title}</h2>
            <p className="text-sm text-text-secondary leading-relaxed">{item.body}</p>
            <button className="mt-3 text-sm font-semibold text-brand-red hover:underline">
              اقرأ البيان كاملاً ←
            </button>
          </article>
        ))}
      </div>

      <p className="text-center text-xs text-text-muted mt-8">
        للاطلاع على أرشيف البيانات الصحفية السابقة، تواصل مع فريق الإعلام
      </p>
    </PageShell>
  );
}
