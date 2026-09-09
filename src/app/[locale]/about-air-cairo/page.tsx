"use client";

import { useParams } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";

const MILESTONES = [
  { year: "1997", event: "تأسيس سبانكر كأول وكالة سفر متخصصة في وجهات مصر السياحية" },
  { year: "2003", event: "افتتاح أول مكتب في الغردقة وإطلاق خدمات حجز الفنادق" },
  { year: "2008", event: "إطلاق منصة الحجز الإلكتروني وتوسع في التأشيرات الدولية" },
  { year: "2013", event: "الوصول لـ 50,000 عميل وافتتاح فرع القاهرة الجديدة" },
  { year: "2018", event: "إطلاق برنامج الرحلات السياحية المتكاملة وشراكات دولية" },
  { year: "2024", event: "إطلاق المنصة الرقمية الجديدة وخدمة الحجز الفوري 24/7" },
];

const VALUES = [
  { icon: "🌟", title: "الموثوقية", desc: "نلتزم بكل وعد نقطعه لعملائنا ونضمن تجربة سفر خالية من المفاجآت" },
  { icon: "🤝", title: "الشراكة", desc: "نبني علاقات طويلة الأمد مع عملائنا وشركائنا المحليين والدوليين" },
  { icon: "💡", title: "الابتكار", desc: "نستمر في تطوير خدماتنا الرقمية لتوفير أسهل تجربة حجز ممكنة" },
  { icon: "🌍", title: "الاستدامة", desc: "ندعم السياحة المسؤولة وحماية المقاصد السياحية للأجيال القادمة" },
];

const STATS = [
  { value: "١٢٠,٠٠٠+", label: "عميل سعيد" },
  { value: "٢٧", label: "سنة خبرة" },
  { value: "٨٥+", label: "وجهة سياحية" },
  { value: "٩٨٪", label: "معدل الرضا" },
];

export default function AboutAirCairoPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "ar";

  return (
    <PageShell
      pageId="about-air-cairo"
      title="عن سبانكر"
      subtitle="نحن نؤمن أن السفر تجربة تغير الحياة — ومهمتنا جعلها في متناول الجميع"
      maxWidth="lg"
    >
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {STATS.map(({ value, label }) => (
          <div key={label} className="text-center bg-brand-green/5 rounded-2xl p-5 border border-brand-green/15">
            <p className="text-3xl font-bold text-brand-green mb-1">{value}</p>
            <p className="text-sm text-text-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Story */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-text-primary mb-4">قصتنا</h2>
        <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
          <p>
            بدأت سبانكر عام ١٩٩٧ بحلم بسيط: جعل السفر إلى أجمل وجهات مصر تجربة سلسة وممتعة لكل المسافرين.
            في تلك السنوات الأولى، كنا نؤمن بأن مصر تمتلك كنوزاً سياحية لم يكتشفها العالم بعد —
            من أعماق البحر الأحمر في مرسى علم إلى معابد الأقصر الفرعونية، ومن سحر واحة سيوة إلى
            شواطئ شرم الشيخ الفيروزية.
          </p>
          <p>
            على مدار ٢٧ عاماً، نمونا من وكالة صغيرة إلى منصة سفر متكاملة تخدم أكثر من ١٢٠ ألف
            عميل سنوياً. نقدم حجوزات الطيران، الفنادق، التأشيرات، والرحلات السياحية — كل ذلك
            تحت سقف واحد وبضغطة زر واحدة.
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-text-primary mb-6">رحلتنا عبر الزمن</h2>
        <div className="relative">
          <div className="absolute right-[88px] top-0 bottom-0 w-0.5 bg-brand-green/20" />
          <div className="space-y-6">
            {MILESTONES.map(({ year, event }) => (
              <div key={year} className="flex gap-4 items-start">
                <div className="w-20 shrink-0 text-left">
                  <span className="text-sm font-bold text-brand-green bg-brand-green/10 px-2 py-1 rounded-lg">{year}</span>
                </div>
                <div className="w-5 h-5 rounded-full bg-brand-green shrink-0 mt-0.5 relative z-10 border-2 border-white shadow-sm" />
                <p className="text-sm text-text-secondary pt-0.5">{event}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Values */}
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-6">قيمنا</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {VALUES.map(({ icon, title, desc }) => (
            <div key={title} className="flex gap-4 p-5 bg-white rounded-2xl border border-border-light hover:border-brand-green/30 transition-colors">
              <span className="text-3xl shrink-0">{icon}</span>
              <div>
                <h3 className="font-bold text-text-primary mb-1">{title}</h3>
                <p className="text-sm text-text-secondary">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
