"use client";

import { useParams } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";

const GOALS = [
  { num: "01", title: "الريادة الرقمية", desc: "بناء أفضل منصة حجز سفر رقمية في منطقة الشرق الأوسط وشمال أفريقيا بحلول عام 2027" },
  { num: "02", title: "الشمول السياحي", desc: "جعل تجربة السفر متاحة لكل المصريين بأسعار تنافسية وخدمة استثنائية" },
  { num: "03", title: "السياحة المستدامة", desc: "تعزيز السياحة المسؤولة بيئياً التي تحافظ على ثروات مصر الطبيعية والتراثية" },
  { num: "04", title: "التوسع العالمي", desc: "فتح أسواق جديدة في الخليج العربي وأوروبا لاستقطاب السياح الأجانب لمصر" },
];

const PRINCIPLES = [
  { icon: "🎯", title: "العميل أولاً", desc: "كل قرار نتخذه يبدأ بسؤال: كيف يخدم هذا عميلنا؟" },
  { icon: "📊", title: "الشفافية الكاملة", desc: "لا رسوم مخفية، لا مفاجآت — السعر الذي تراه هو ما تدفعه" },
  { icon: "⚡", title: "السرعة والكفاءة", desc: "نحترم وقتك — حجزك جاهز في دقائق لا ساعات" },
  { icon: "🛡️", title: "الأمان والثقة", desc: "بياناتك وأموالك محمية بأعلى معايير الأمان الرقمي" },
  { icon: "🌱", title: "النمو المستمر", desc: "نتعلم من كل تجربة ونطور خدماتنا باستمرار" },
  { icon: "❤️", title: "الشغف بمصر", desc: "نحن مصريون نفخر ببلدنا ونريد العالم أن يعرف جماله" },
];

export default function MissionVisionPage() {
  const params = useParams();

  return (
    <PageShell
      pageId="mission-vision"
      title="رسالتنا ورؤيتنا"
      subtitle="نحو مستقبل حيث كل مصري يستطيع استكشاف العالم بسهولة وثقة"
      maxWidth="lg"
    >
      {/* Mission */}
      <div className="mb-10 p-8 bg-brand-green rounded-2xl text-white">
        <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-3">رسالتنا</p>
        <h2 className="text-2xl font-bold mb-3">تمكين كل مسافر من تحقيق حلم السفر</h2>
        <p className="text-white/80 leading-relaxed">
          نقدم خدمات سفر متكاملة وموثوقة تجمع بين التكنولوجيا الحديثة والخبرة البشرية العميقة،
          لنضمن أن كل رحلة تبدأ بابتسامة وتنتهي بذكريات لا تُنسى.
        </p>
      </div>

      {/* Vision */}
      <div className="mb-10 p-8 bg-brand-yellow/15 rounded-2xl border border-brand-yellow/30">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-green mb-3">رؤيتنا 2030</p>
        <h2 className="text-2xl font-bold text-text-primary mb-3">أن نكون البوابة الأولى للسفر في العالم العربي</h2>
        <p className="text-text-secondary leading-relaxed">
          نتطلع إلى يوم يختار فيه كل مسافر عربي سبانكر شريكاً أول لرحلاته — سواء كانت عطلة عائلية
          لشواطئ الغردقة، أو رحلة عمل لدبي، أو مغامرة ثقافية في باريس. رؤيتنا أن يكون السفر حقاً
          لا امتيازاً.
        </p>
      </div>

      {/* Strategic Goals */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-text-primary mb-6">أهدافنا الاستراتيجية</h2>
        <div className="space-y-4">
          {GOALS.map(({ num, title, desc }) => (
            <div key={num} className="flex gap-5 p-5 bg-white rounded-2xl border border-border-light">
              <span className="text-3xl font-black text-brand-green/20 shrink-0 leading-none">{num}</span>
              <div>
                <h3 className="font-bold text-text-primary mb-1">{title}</h3>
                <p className="text-sm text-text-secondary">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Principles */}
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-6">مبادئنا</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PRINCIPLES.map(({ icon, title, desc }) => (
            <div key={title} className="flex gap-3 p-4 rounded-xl bg-muted border border-border-light">
              <span className="text-2xl shrink-0">{icon}</span>
              <div>
                <p className="font-bold text-sm text-text-primary">{title}</p>
                <p className="text-xs text-text-muted mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
