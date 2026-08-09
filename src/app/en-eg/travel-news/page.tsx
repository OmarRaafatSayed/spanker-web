"use client";

import { useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { cn } from "@/lib/utils";

const CATEGORIES = ["الكل", "وجهات", "نصائح سفر", "توجهات", "إعلانات"];

const ARTICLES = [
  {
    id: 1,
    category: "وجهات",
    date: "15 مارس 2024",
    title: "البحر الأحمر، لن تريد مغادرته أبداً!",
    excerpt:
      "اكتشف عالم البحر الأحمر الساحر تحت الماء. مياه بلورية صافية وشعاب مرجانية نابضة بالحياة وغوص عالمي المستوى ينتظرك.",
    readTime: "4 دقائق",
  },
  {
    id: 2,
    category: "نصائح سفر",
    date: "5 يونيو 2024",
    title: "6 ضروريات يجب حملها في رحلتك الصيفية!",
    excerpt:
      "السفر الصيفي يتطلب تعبئة ذكية. من واقي الشمس إلى محولات السفر، إليك الأشياء الستة التي لا غنى عنها.",
    readTime: "3 دقائق",
  },
  {
    id: 3,
    category: "توجهات",
    date: "10 يناير 2024",
    title: "أبرز وجهات السفر لبدء مغامرتك في 2024!",
    excerpt:
      "من معابد الأقصر العريقة إلى الحمامات الحرارية في بودابست، هذا العام مليء بالوجهات الرائعة.",
    readTime: "5 دقائق",
  },
  {
    id: 4,
    category: "إعلانات",
    date: "20 فبراير 2024",
    title: "سبانكر تضيف رحلات جديدة إلى إسطنبول وروما",
    excerpt:
      "يسعدنا الإعلان عن إضافة رحلات مباشرة جديدة من القاهرة إلى إسطنبول وروما بأسعار تنافسية.",
    readTime: "2 دقائق",
  },
  {
    id: 5,
    category: "وجهات",
    date: "1 أبريل 2024",
    title: "الأقصر وأسوان — دليلك الكامل للرحلة الفرعونية",
    excerpt:
      "تعرّف على أفضل المواقع الأثرية في صعيد مصر، أوقات الزيارة المثالية، والفنادق الموصى بها.",
    readTime: "7 دقائق",
  },
  {
    id: 6,
    category: "نصائح سفر",
    date: "12 مايو 2024",
    title: "كيف تختار مقعدك المثالي على متن الطائرة؟",
    excerpt:
      "نافذة أم ممر؟ أمام أم خلف؟ دليل شامل لاختيار المقعد الأنسب حسب احتياجاتك وطول الرحلة.",
    readTime: "3 دقائق",
  },
];

export default function TravelNewsPage() {
  const [activeCategory, setActiveCategory] = useState("الكل");

  const filtered =
    activeCategory === "الكل"
      ? ARTICLES
      : ARTICLES.filter((a) => a.category === activeCategory);

  return (
    <PageShell
      pageId="travel-news"
      section="سبانكر"
      title="أخبار السفر"
      subtitle="آخر الأخبار والمقالات من عالم السفر والطيران"
      maxWidth="xl"
      breadcrumbs={[
        { label: "الرئيسية", href: "/" },
        { label: "أخبار السفر" },
      ]}
    >
      {/* Category filters */}
      <div className="flex gap-2 flex-wrap mb-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-150",
              activeCategory === cat
                ? "bg-brand-red text-white"
                : "bg-bg-alt text-text-secondary hover:bg-brand-red/10 hover:text-brand-red"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Articles grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((article) => (
          <article
            key={article.id}
            className="bg-white border border-border-light rounded-2xl overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col"
          >
            <div className="h-36 bg-linear-to-br from-bg-alt to-brand-red/10 flex items-center justify-center">
              <span className="text-4xl">✈️</span>
            </div>
            <div className="p-5 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-brand-red bg-brand-red/10 px-2 py-0.5 rounded-full">
                  {article.category}
                </span>
                <span className="text-xs text-text-muted">{article.readTime} قراءة</span>
              </div>
              <h2 className="font-bold text-text-primary mb-2 text-sm leading-snug">
                {article.title}
              </h2>
              <p className="text-xs text-text-secondary leading-relaxed flex-1 mb-4">
                {article.excerpt}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">{article.date}</span>
                <Link href="#" className="text-xs font-semibold text-brand-red hover:underline">
                  اقرأ المزيد ←
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Load more */}
      <div className="text-center mt-10">
        <button className="px-8 py-2.5 rounded-full border-2 border-brand-red text-brand-red text-sm font-semibold hover:bg-brand-red hover:text-white transition-colors duration-200">
          عرض المزيد من المقالات
        </button>
      </div>
    </PageShell>
  );
}
