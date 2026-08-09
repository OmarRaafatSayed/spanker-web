import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = {
  title: "رسالتنا ورؤيتنا | Mission & Vision — Spanker",
  description: "تعرّف على رسالة سبانكر ورؤيتها المستقبلية نحو الطيران المستدام والخدمة المتميزة.",
};

const PILLARS = [
  {
    icon: "✈️",
    title: "رحلات موثوقة",
    body: "نلتزم بدقة المواعيد وسلامة الرحلات في كل رحلة نشغّلها.",
  },
  {
    icon: "🌍",
    title: "ربط مصر بالعالم",
    body: "توسيع شبكة الرحلات لتغطية أكثر الوجهات طلباً في أوروبا وأفريقيا والشرق الأوسط.",
  },
  {
    icon: "💚",
    title: "الاستدامة البيئية",
    body: "خفض البصمة الكربونية عبر أسطول حديث وبرامج تعويض طوعية.",
  },
  {
    icon: "🤝",
    title: "المسؤولية الاجتماعية",
    body: "دعم المجتمعات المحلية وتوفير فرص عمل في قطاع الطيران.",
  },
];

export default function MissionVisionPage() {
  return (
    <PageShell
      pageId="mission-vision"
      section="سبانكر"
      title="رسالتنا ورؤيتنا"
      subtitle="نحو مستقبل أفضل في سماء مصر"
      breadcrumbs={[
        { label: "الرئيسية", href: "/" },
        { label: "عن الشركة" },
        { label: "رسالتنا ورؤيتنا" },
      ]}
    >
      <div className="space-y-12">
        {/* Mission */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-7 bg-brand-red rounded-full" />
            <h2 className="text-xl font-bold text-text-primary">رسالتنا</h2>
          </div>
          <p className="text-text-secondary leading-relaxed pr-4 border-r-2 border-brand-red/20">
            تقديم خدمة طيران آمنة ومريحة وبأسعار في متناول الجميع، مع الحفاظ على
            أعلى معايير الجودة في كل مرحلة من مراحل رحلة المسافر — من الحجز حتى
            الوصول إلى الوجهة.
          </p>
        </section>

        {/* Vision */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-7 bg-brand-yellow rounded-full" />
            <h2 className="text-xl font-bold text-text-primary">رؤيتنا</h2>
          </div>
          <p className="text-text-secondary leading-relaxed pr-4 border-r-2 border-brand-yellow/30">
            أن تكون سبانكر الخيار الأول للمسافرين المصريين والعرب، وأن نرسّخ مكانتنا
            ضمن أفضل شركات الطيران الإقليمية بحلول عام 2030 من خلال التوسع المستمر
            والتميز في الخدمة.
          </p>
        </section>

        {/* Pillars */}
        <section>
          <h2 className="text-lg font-bold text-text-primary mb-5">ركائز استراتيجيتنا</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {PILLARS.map((p) => (
              <div key={p.title} className="bg-bg-alt rounded-2xl p-5 flex gap-4 items-start">
                <span className="text-2xl">{p.icon}</span>
                <div>
                  <h3 className="font-semibold text-text-primary mb-1 text-sm">{p.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
