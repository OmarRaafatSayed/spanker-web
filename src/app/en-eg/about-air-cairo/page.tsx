import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = {
  title: "عن سبانكر | About Spanker",
  description: "تعرّف على قصة سبانكر، شركة الطيران المصرية التي تربط مصر بالعالم.",
};

const STATS = [
  { number: "2M+", label: "مسافر سنوياً" },
  { number: "40+", label: "وجهة حول العالم" },
  { number: "15+", label: "سنة من الخبرة" },
];

const VALUES = [
  "السلامة أولاً — معايير الطيران الدولية أساس كل قرار",
  "الشفافية — أسعار واضحة بدون رسوم مخفية",
  "الاحترافية — فريق مدرب على أعلى مستوى",
  "الاستدامة — مسؤوليتنا تجاه البيئة والمجتمع",
];

export default function AboutPage() {
  return (
    <PageShell
      pageId="about-air-cairo"
      section="سبانكر"
      title="عن سبانكر"
      subtitle="نحن نطير بك إلى حيث يبدأ الحلم"
      breadcrumbs={[
        { label: "الرئيسية", href: "/" },
        { label: "عن الشركة" },
        { label: "عن سبانكر" },
      ]}
    >
      <div className="space-y-8 text-text-secondary">
        <p className="text-base leading-relaxed">
          سبانكر هي شركة طيران مصرية متخصصة في الرحلات الجوية الداخلية والدولية، تأسست بهدف
          تقديم تجربة سفر استثنائية تجمع بين الأمان والراحة بأسعار تنافسية.
        </p>
        <p className="text-base leading-relaxed">
          منذ انطلاقتها الأولى، عملت سبانكر على بناء شبكة واسعة من الرحلات تغطي أهم الوجهات
          السياحية والتجارية داخل مصر وخارجها، مع الحفاظ على أعلى معايير السلامة والجودة.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 my-2">
          {STATS.map((stat) => (
            <div key={stat.label} className="bg-bg-alt rounded-2xl p-5 text-center">
              <p className="text-3xl font-bold text-brand-red mb-1">{stat.number}</p>
              <p className="text-xs text-text-secondary">{stat.label}</p>
            </div>
          ))}
        </div>

        <p className="text-base leading-relaxed">
          يعمل في سبانكر فريق من المحترفين المتميزين الذين يؤمنون بأن كل رحلة هي قصة جديدة،
          وأن كل مسافر يستحق أفضل تجربة ممكنة منذ لحظة الحجز حتى الوصول.
        </p>
        <p className="text-base leading-relaxed">
          تستمر سبانكر في توسيع أسطولها وشبكة رحلاتها، مع الاستثمار المستمر في التكنولوجيا
          وتطوير خدماتها لتلبية احتياجات المسافرين في عالم متغير.
        </p>

        {/* Values */}
        <div className="bg-brand-red/5 border border-brand-red/20 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-text-primary mb-4">قيمنا الأساسية</h2>
          <ul className="space-y-2.5">
            {VALUES.map((v) => (
              <li key={v} className="flex items-start gap-2 text-sm">
                <span className="text-brand-red mt-0.5 font-bold">✓</span>
                <span>{v}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PageShell>
  );
}
