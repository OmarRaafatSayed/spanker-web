"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";

const CATEGORIES = ["الكل", "أخبار الطيران", "وجهات جديدة", "عروض وتخفيضات", "سياحة مصر", "سفر دولي"];

const NEWS = [
  {
    id: 1,
    category: "وجهات جديدة",
    date: "١٥ يناير ٢٠٢٥",
    title: "سبانكر تضيف رحلات جديدة إلى جورجيا وأرمينيا",
    excerpt: "في خطوة لتوسيع باقة الوجهات السياحية، أعلنت سبانكر عن إضافة رحلات منتظمة إلى تبليسي وييريفان ابتداءً من مارس القادم.",
    readTime: "٣ دقائق",
    featured: true,
  },
  {
    id: 2,
    category: "عروض وتخفيضات",
    date: "١٢ يناير ٢٠٢٥",
    title: "عروض الصيف المبكر: خصم ٣٠٪ على رحلات البحر الأحمر",
    excerpt: "احجز مسبقاً واحصل على أفضل الأسعار لموسم الصيف. العرض ساري على جميع رحلات الغردقة وشرم الشيخ ومرسى علم.",
    readTime: "٢ دقيقتان",
    featured: true,
  },
  {
    id: 3,
    category: "سياحة مصر",
    date: "١٠ يناير ٢٠٢٥",
    title: "المتحف المصري الكبير يستقطب ٥ ملايين زائر في عامه الأول",
    excerpt: "استقطب المتحف المصري الكبير في الجيزة أكثر من ٥ ملايين زائر منذ افتتاحه الرسمي، مما يجعله من أبرز وجهات السياحة الثقافية عالمياً.",
    readTime: "٤ دقائق",
    featured: false,
  },
  {
    id: 4,
    category: "أخبار الطيران",
    date: "٨ يناير ٢٠٢٥",
    title: "مطار القاهرة الدولي يفتتح صالة المغادرة الجديدة",
    excerpt: "أُفتتحت رسمياً صالة المغادرة رقم ٣ المطورة في مطار القاهرة الدولي، بطاقة استيعابية تصل إلى ١٥ مليون مسافر سنوياً.",
    readTime: "٣ دقائق",
    featured: false,
  },
  {
    id: 5,
    category: "سفر دولي",
    date: "٥ يناير ٢٠٢٥",
    title: "أفضل ١٠ وجهات سياحية لعام ٢٠٢٥ وفق تقرير السفر العالمي",
    excerpt: "كشف التقرير السنوي لأفضل وجهات السياحة عن قائمة تضم العديد من الدول العربية والأفريقية، مع صعود لافت لوجهات البحر الأحمر.",
    readTime: "٥ دقائق",
    featured: false,
  },
  {
    id: 6,
    category: "سياحة مصر",
    date: "٢ يناير ٢٠٢٥",
    title: "واحة سيوة تحصل على جائزة أفضل وجهة سياحية صديقة للبيئة",
    excerpt: "فازت واحة سيوة بجائزة المجلس العالمي للسياحة المستدامة كأفضل وجهة سياحية بيئية في منطقة الشرق الأوسط وشمال أفريقيا.",
    readTime: "٣ دقائق",
    featured: false,
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  "أخبار الطيران": "bg-blue-100 text-blue-700",
  "وجهات جديدة": "bg-purple-100 text-purple-700",
  "عروض وتخفيضات": "bg-amber-100 text-amber-700",
  "سياحة مصر": "bg-green-100 text-green-700",
  "سفر دولي": "bg-indigo-100 text-indigo-700",
};

export default function TravelNewsPage() {
  const [activeCategory, setActiveCategory] = useState("الكل");

  const filtered = activeCategory === "الكل"
    ? NEWS
    : NEWS.filter((n) => n.category === activeCategory);

  const featured = filtered.filter((n) => n.featured);
  const rest = filtered.filter((n) => !n.featured);

  return (
    <PageShell
      pageId="travel-news"
      title="أخبار السفر"
      subtitle="آخر أخبار السفر والسياحة والعروض المميزة"
      maxWidth="lg"
    >
      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`text-sm px-4 py-1.5 rounded-full border font-medium transition-all ${
              activeCategory === cat
                ? "bg-brand-green text-white border-brand-green"
                : "border-border-default text-text-secondary hover:border-brand-green/40"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Featured */}
      {featured.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {featured.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-border-light overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-36 bg-gradient-to-br from-brand-green to-brand-green-dark flex items-center justify-center">
                <span className="text-5xl">
                  {item.category === "وجهات جديدة" ? "🌍" : "🏷️"}
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[item.category] ?? "bg-muted text-text-muted"}`}>
                    {item.category}
                  </span>
                  <span className="text-xs text-text-muted">{item.date}</span>
                </div>
                <h3 className="font-bold text-text-primary mb-2 leading-tight">{item.title}</h3>
                <p className="text-sm text-text-secondary line-clamp-2">{item.excerpt}</p>
                <p className="text-xs text-text-muted mt-3">⏱ {item.readTime} للقراءة</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rest */}
      <div className="space-y-3">
        {rest.map((item) => (
          <div key={item.id} className="flex gap-4 p-4 bg-white rounded-2xl border border-border-light hover:shadow-sm transition-shadow">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-green/10 to-brand-yellow/10 flex items-center justify-center text-2xl shrink-0">
              {item.category === "سياحة مصر" ? "🏛️" : item.category === "سفر دولي" ? "✈️" : "📰"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[item.category] ?? "bg-muted text-text-muted"}`}>
                  {item.category}
                </span>
                <span className="text-xs text-text-muted">{item.date}</span>
              </div>
              <h3 className="font-bold text-text-primary text-sm leading-tight mb-1">{item.title}</h3>
              <p className="text-xs text-text-secondary line-clamp-2">{item.excerpt}</p>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📰</p>
          <p className="text-text-muted">لا توجد أخبار في هذا التصنيف</p>
        </div>
      )}
    </PageShell>
  );
}
