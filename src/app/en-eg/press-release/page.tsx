"use client";

import { PageShell } from "@/components/layout/PageShell";

const releases = [
  {
    date: "١٠ ديسمبر ٢٠٢٤",
    title: "سبانكر تُعلن إطلاق ٣ خطوط جديدة إلى أوروبا اعتباراً من مارس ٢٠٢٥",
    summary:
      "أعلنت شركة سبانكر للطيران عن إضافة ثلاثة خطوط جوية مباشرة تربط القاهرة بكل من براغ وفيينا وبرشلونة ابتداءً من الأول من مارس ٢٠٢٥، في إطار خطتها التوسعية لتعزيز الحضور في السوق الأوروبية.",
    tag: "توسعة الأسطول",
  },
  {
    date: "١٥ نوفمبر ٢٠٢٤",
    title: "سبانكر تحصل على شهادة الأيزو ISO 9001:2015 لنظم الجودة",
    summary:
      "حصلت سبانكر على شهادة ISO 9001:2015 الدولية لأنظمة إدارة الجودة من الهيئة الدولية المعتمدة، مما يعكس التزام الشركة الراسخ بتقديم خدمات بأعلى معايير الجودة العالمية.",
    tag: "جوائز",
  },
  {
    date: "٢٠ أكتوبر ٢٠٢٤",
    title: "سبانكر تُعلن عن شراكة استراتيجية مع مجموعة فنادق صن رايز",
    summary:
      "أبرمت سبانكر اتفاقية شراكة استراتيجية مع مجموعة فنادق صن رايز الدولية لتقديم باقات سفر متكاملة تجمع بين تذاكر الطيران والإقامة الفندقية بأسعار حصرية للمسافرين.",
    tag: "شراكات",
  },
  {
    date: "٥ سبتمبر ٢٠٢٤",
    title: "سبانكر تُطلق تطبيق الهاتف الذكي الجديد بواجهة محسّنة",
    summary:
      "أطلقت سبانكر نسخة جديدة مُحدَّثة كلياً من تطبيقها للهاتف الذكي، تتضمن ميزات تسجيل الوصول الإلكتروني وتتبع الأمتعة ومتابعة حالة الرحلة في الوقت الفعلي.",
    tag: "تقنية",
  },
];

const tagColors: Record<string, string> = {
  "توسعة الأسطول": "bg-blue-500/20 text-blue-400",
  "جوائز": "bg-brand-yellow/20 text-brand-yellow",
  "شراكات": "bg-brand-green/20 text-brand-green",
  "تقنية": "bg-purple-500/20 text-purple-400",
};

export default function PressReleasePage() {
  return (
    <PageShell
      pageId="press-release"
      heroTitle="البيانات الصحفية"
      heroSubtitle="آخر أخبار وبيانات سبانكر للإعلام والصحفيين"
      maxWidth="xl"
      heroIcon={
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      }
    >
      {/* Press Releases */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-white mb-6">أحدث البيانات</h2>
        <div className="space-y-4">
          {releases.map((r) => (
            <div key={r.title} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${tagColors[r.tag] ?? "bg-white/10 text-white/60"}`}>
                  {r.tag}
                </span>
                <span className="text-white/40 text-xs">📅 {r.date}</span>
              </div>
              <h3 className="font-bold text-white mb-2 leading-snug">{r.title}</h3>
              <p className="text-white/65 text-sm leading-relaxed mb-4">{r.summary}</p>
              <button className="flex items-center gap-2 text-sm border border-white/20 text-white px-4 py-2 rounded-xl font-semibold hover:bg-white/10 transition-colors">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                تنزيل PDF
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Media Contact */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">التواصل مع قسم الإعلام</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-white/50 text-xs mb-1">المسؤول الإعلامي</p>
            <p className="text-white font-semibold">أحمد سالم — مدير العلاقات العامة</p>
          </div>
          <div>
            <p className="text-white/50 text-xs mb-1">البريد الإلكتروني</p>
            <a href="mailto:press@spanker.com" className="text-brand-green font-semibold hover:underline">
              press@spanker.com
            </a>
          </div>
          <div>
            <p className="text-white/50 text-xs mb-1">هاتف المكتب الإعلامي</p>
            <a href="tel:+20224186099" className="text-brand-green font-semibold hover:underline">
              ٢٠٢٢٤١٨٦٠٩٩+
            </a>
          </div>
          <div>
            <p className="text-white/50 text-xs mb-1">ساعات العمل</p>
            <p className="text-white/80 text-sm">السبت – الخميس · ٩ص – ٥م</p>
          </div>
        </div>
      </div>

      {/* Brand Assets */}
      <div className="bg-brand-green/10 border border-brand-green/30 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-3">الأصول الإعلامية</h2>
        <p className="text-white/65 text-sm mb-4">
          حمّل شعارات سبانكر وصور الأسطول والمواد الترويجية عالية الدقة للاستخدام الإعلامي.
        </p>
        <div className="flex flex-wrap gap-3">
          {["شعار سبانكر (PNG)", "شعار سبانكر (SVG)", "صور الأسطول", "دليل الهوية البصرية"].map((asset) => (
            <button
              key={asset}
              className="flex items-center gap-2 bg-white/10 border border-white/20 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-white/15 transition-colors"
            >
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {asset}
            </button>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
