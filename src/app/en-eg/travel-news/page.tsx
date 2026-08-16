"use client";

import { PageShell } from "@/components/layout/PageShell";

const articles = [
  {
    category: "وجهات",
    categoryColor: "bg-blue-500/20 text-blue-400",
    date: "١٥ ديسمبر ٢٠٢٤",
    title: "البحر الأحمر: أفضل وجهة سياحية عالمية لعام ٢٠٢٥",
    excerpt: "حصدت شواطئ البحر الأحمر المصرية على المرتبة الأولى في تقرير أفضل وجهات الغوص والسنوركل عالمياً. تعرّف على أجمل الأماكن في الغردقة وشرم الشيخ ومرسى علم.",
    readTime: "٥ دقائق",
  },
  {
    category: "رحلات",
    categoryColor: "bg-brand-green/20 text-brand-green",
    date: "١٠ ديسمبر ٢٠٢٤",
    title: "بودابست الساحرة: دليلك الشامل لاستكشاف جوهرة نهر الدانوب",
    excerpt: "تعرّف على أبرز معالم بودابست السياحية من الحمامات الحرارية التاريخية إلى أحياء المدينة العتيقة، مع نصائح للتنقل والإقامة في أفضل أحياء المدينة.",
    readTime: "٧ دقائق",
  },
  {
    category: "نصائح",
    categoryColor: "bg-brand-yellow/20 text-brand-yellow",
    date: "٥ ديسمبر ٢٠٢٤",
    title: "١٠ نصائح ذهبية لزيارة القاهرة لأول مرة",
    excerpt: "من الأهرامات إلى خان الخليلي، دليل شامل للزوار القادمين إلى القاهرة لأول مرة. اكتشف أفضل الأوقات للزيارة والمواصلات والمطاعم المميزة.",
    readTime: "٦ دقائق",
  },
  {
    category: "سفر",
    categoryColor: "bg-purple-500/20 text-purple-400",
    date: "١ ديسمبر ٢٠٢٤",
    title: "دليل حقيبة الصيف: ما تحمله وما تتركه في البيت",
    excerpt: "مع اقتراب موسم الصيف، إليك القائمة الأمثل لحزم حقيبتك بذكاء. كيف تسافر خفيفاً مع الاستمتاع بكل ما تحتاجه في رحلتك.",
    readTime: "٤ دقائق",
  },
  {
    category: "تاريخ",
    categoryColor: "bg-orange-500/20 text-orange-400",
    date: "٢٥ نوفمبر ٢٠٢٤",
    title: "الأقصر: مدينة المليون عمود وأسرار الفراعنة",
    excerpt: "رحلة عبر الزمن إلى أعظم مدينة أثرية في العالم. تعرّف على معبد الكرنك وأبو الهول الأقصر ووادي الملوك في دليل شامل.",
    readTime: "٨ دقائق",
  },
  {
    category: "ثقافة",
    categoryColor: "bg-teal-500/20 text-teal-400",
    date: "٢٠ نوفمبر ٢٠٢٤",
    title: "أسوان: حيث تلتقي النوبة والصحراء ونهر النيل",
    excerpt: "اكتشف سحر أسوان بمعابد فيلة الرائعة وسد أسوان العالي وقرى النوبة الملوّنة. وجهة لمحبي الطبيعة والتاريخ معاً.",
    readTime: "٦ دقائق",
  },
];

export default function TravelNewsPage() {
  return (
    <PageShell
      pageId="travel-news"
      heroTitle="أخبار السفر"
      heroSubtitle="أحدث المقالات والأدلة السياحية لوجهاتك المفضلة"
      maxWidth="xl"
      heroIcon={
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
          <path d="M18 14h-8" /><path d="M15 18h-5" /><path d="M10 6h8v4h-8V6z" />
        </svg>
      }
    >
      {/* Featured Article */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-8">
        <div className="h-48 bg-gradient-to-br from-[#1a4a2e] to-[#0a2a1a] flex items-end p-6">
          <div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full mb-2 inline-block ${articles[0].categoryColor} bg-opacity-30`}>
              {articles[0].category}
            </span>
            <h2 className="text-xl font-bold text-white">{articles[0].title}</h2>
          </div>
        </div>
        <div className="p-6">
          <p className="text-white/65 text-sm leading-relaxed mb-4">{articles[0].excerpt}</p>
          <div className="flex items-center justify-between">
            <span className="text-white/40 text-xs">📅 {articles[0].date} · ⏱ {articles[0].readTime}</span>
            <button className="text-brand-green font-semibold text-sm hover:text-brand-green-light transition-colors">
              اقرأ المزيد ←
            </button>
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {articles.slice(1).map((article) => (
          <div key={article.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${article.categoryColor}`}>
                {article.category}
              </span>
              <span className="text-white/40 text-xs">⏱ {article.readTime}</span>
            </div>
            <h3 className="font-bold text-white mb-2 leading-snug flex-1">{article.title}</h3>
            <p className="text-white/60 text-sm leading-relaxed mb-4 line-clamp-3">{article.excerpt}</p>
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/10">
              <span className="text-white/40 text-xs">📅 {article.date}</span>
              <button className="text-brand-green font-semibold text-sm hover:text-brand-green-light transition-colors">
                اقرأ المزيد ←
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Newsletter */}
      <div className="mt-8 bg-brand-green/10 border border-brand-green/30 rounded-2xl p-6 text-center">
        <h3 className="font-bold text-white mb-2">اشترك في نشرتنا الإخبارية</h3>
        <p className="text-white/60 text-sm mb-4">احصل على أحدث أخبار السفر والعروض الحصرية مباشرة في بريدك الإلكتروني.</p>
        <div className="flex max-w-sm mx-auto gap-2">
          <input
            type="email"
            placeholder="بريدك الإلكتروني"
            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-brand-green"
          />
          <button className="bg-brand-green text-white px-5 py-2.5 rounded-xl font-bold hover:bg-brand-green-dark transition-colors text-sm whitespace-nowrap">
            اشترك
          </button>
        </div>
      </div>
    </PageShell>
  );
}
