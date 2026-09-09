"use client";

import { useParams } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";

const RELEASES = [
  {
    date: "١٥ يناير ٢٠٢٥",
    ref: "PR-2025-001",
    title: "سبانكر تُطلق منصتها الرقمية الجديدة بإمكانيات الذكاء الاصطناعي",
    body: `أعلنت شركة سبانكر للسفر والسياحة عن إطلاق منصتها الرقمية المطورة بالكامل والمدعومة بتقنيات الذكاء الاصطناعي، والتي تتيح للمستخدمين إتمام حجوزاتهم في ثوانٍ معدودة مع توصيات مخصصة لكل مسافر.

جاء الإطلاق عقب ١٨ شهراً من التطوير المكثف وتجارب المستخدمين، لتصبح سبانكر أول منصة سفر عربية تدمج تقنيات البحث الذكي مع خدمة دعم بشري على مدار الساعة.`,
    contact: "قسم الإعلام: media@spanker.travel",
  },
  {
    date: "٢ ديسمبر ٢٠٢٤",
    ref: "PR-2024-018",
    title: "سبانكر تحقق ١٠٠ مليون جنيه إيرادات خلال موسم الشتاء ٢٠٢٤",
    body: `حققت سبانكر خلال موسم الشتاء ٢٠٢٤ إيرادات تجاوزت ١٠٠ مليون جنيه مصري، بزيادة ٤٥٪ عن نفس الفترة من العام السابق، مدفوعةً بالطلب المتزايد على رحلات البحر الأحمر والسياحة الداخلية.

أشار الرئيس التنفيذي إلى أن هذا النمو يعكس ثقة المصريين المتزايدة في خدمات السفر الرقمية، مؤكداً أن الشركة تسعى لتوسيع قاعدة عملائها في السوق الخليجي خلال ٢٠٢٥.`,
    contact: "علاقات المستثمرين: ir@spanker.travel",
  },
  {
    date: "١٥ أكتوبر ٢٠٢٤",
    ref: "PR-2024-014",
    title: "سبانكر تُوقّع شراكة استراتيجية مع ٢٥ فندقاً في البحر الأحمر",
    body: `وقّعت سبانكر اتفاقيات شراكة حصرية مع ٢٥ فندقاً خمس نجوم على ساحل البحر الأحمر، في صفقة تُتيح لعملائها الحصول على أسعار مميزة وأولوية في الحجز خلال مواسم الذروة.

تأتي هذه الشراكات في إطار استراتيجية سبانكر لبناء شبكة من المزودين المعتمدين الذين يضمنون معايير الجودة التي يتوقعها عملاء الشركة.`,
    contact: "الشراكات: partnerships@spanker.travel",
  },
];

const MEDIA_CONTACTS = [
  { role: "مدير الإعلام والعلاقات العامة", name: "أحمد عبد الرحمن", email: "media@spanker.travel", phone: "+20 2 1234 5678" },
  { role: "متحدث رسمي", name: "سارة محمود", email: "press@spanker.travel", phone: "+20 2 1234 5679" },
];

export default function PressReleasePage() {
  return (
    <PageShell
      pageId="press-release"
      title="البيانات الصحفية"
      subtitle="آخر إعلانات وبيانات شركة سبانكر للسفر والسياحة"
      maxWidth="lg"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Press releases list */}
        <div className="lg:col-span-2 space-y-6">
          {RELEASES.map((r) => (
            <div key={r.ref} className="bg-white rounded-2xl border border-border-light p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-mono font-bold text-brand-green bg-brand-green/10 px-2 py-0.5 rounded">
                  {r.ref}
                </span>
                <span className="text-xs text-text-muted">{r.date}</span>
              </div>
              <h3 className="font-bold text-text-primary text-base mb-3 leading-tight">{r.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">{r.body}</p>
              <div className="mt-4 pt-3 border-t border-border-light">
                <p className="text-xs text-text-muted">للاستفسار: <span className="text-brand-green">{r.contact}</span></p>
              </div>
            </div>
          ))}
        </div>

        {/* Media contacts sidebar */}
        <div className="space-y-4">
          <div className="bg-brand-green rounded-2xl p-5 text-white sticky top-24">
            <h3 className="font-bold text-base mb-4">جهات التواصل الإعلامي</h3>
            <div className="space-y-4">
              {MEDIA_CONTACTS.map((c) => (
                <div key={c.email} className="border-t border-white/20 pt-4 first:border-0 first:pt-0">
                  <p className="text-xs text-white/60 mb-1">{c.role}</p>
                  <p className="font-bold text-sm">{c.name}</p>
                  <p className="text-xs text-white/80 mt-1">{c.email}</p>
                  <p className="text-xs text-white/80">{c.phone}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-white/20">
              <p className="text-xs text-white/60 mb-2">للمواد الإعلامية والصور</p>
              <a
                href="mailto:media@spanker.travel"
                className="block text-center py-2 rounded-xl bg-white text-brand-green text-sm font-bold hover:bg-white/90 transition-colors"
              >
                طلب حزمة إعلامية
              </a>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
