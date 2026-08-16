"use client";

import { PageShell } from "@/components/layout/PageShell";

const stats = [
  { value: "٥٠٠+", label: "رحلة", sub: "Routes" },
  { value: "١م+", label: "مسافر سنوياً", sub: "Passengers" },
  { value: "١٥+", label: "سنة خبرة", sub: "Years" },
  { value: "٢٠+", label: "وجهة", sub: "Destinations" },
];

const values = [
  {
    icon: "🛡️",
    title: "السلامة أولاً",
    titleEn: "Safety First",
    desc: "نلتزم بأعلى معايير السلامة الجوية الدولية في كل رحلة. طاقمنا يخضع لتدريب مستمر وطائراتنا تحت رقابة فنية دقيقة.",
  },
  {
    icon: "💎",
    title: "الراحة والجودة",
    titleEn: "Comfort & Quality",
    desc: "نسعى لتوفير أفضل تجربة سفر ممكنة، من المقاعد المريحة إلى الوجبات الشهية والترفيه المتميز على متن طائراتنا.",
  },
  {
    icon: "🚀",
    title: "الابتكار المستمر",
    titleEn: "Continuous Innovation",
    desc: "نواكب التطور التكنولوجي لنقدم خدمات رقمية سهلة وسريعة، من الحجز الإلكتروني إلى تسجيل الوصول عبر الهاتف.",
  },
];

export default function AboutAirCairoPage() {
  return (
    <PageShell
      pageId="about-air-cairo"
      heroTitle="عن سبانكر"
      heroSubtitle="نحن نربط مصر بالعالم منذ أكثر من ١٥ عاماً"
      maxWidth="xl"
      heroIcon={
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      }
    >
      {/* Story */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-7 mb-10">
        <h2 className="text-xl font-bold text-white mb-4">قصتنا</h2>
        <p className="text-white/70 text-sm leading-relaxed mb-4">
          تأسست سبانكر برؤية واضحة: جعل السفر الجوي متاحاً وميسوراً لكل مصري وزائر لمصر.
          منذ انطلاقتنا، نقلنا أكثر من مليون مسافر إلى وجهاتهم المختلفة داخل مصر وحول العالم.
        </p>
        <p className="text-white/70 text-sm leading-relaxed mb-4">
          بدأنا برحلات داخلية تربط القاهرة بالمدن السياحية الرئيسية، ثم توسعنا تدريجياً لنغطي وجهات دولية في أوروبا والخليج وتركيا.
          اليوم، نفخر بشبكة رحلات تمتد لأكثر من ٢٠ وجهة.
        </p>
        <p className="text-white/70 text-sm leading-relaxed">
          نؤمن أن كل رحلة هي تجربة فريدة، وأن رضا مسافرينا هو ما يدفعنا للأمام كل يوم.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
            <p className="text-brand-yellow font-black text-4xl mb-1">{s.value}</p>
            <p className="text-white text-sm font-semibold">{s.label}</p>
            <p className="text-white/40 text-xs mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Mission */}
      <div className="bg-brand-green/10 border border-brand-green/30 rounded-2xl p-6 mb-10">
        <h2 className="text-xl font-bold text-white mb-3">مهمتنا</h2>
        <p className="text-white/70 text-sm leading-relaxed">
          نهدف إلى تقديم خدمات الطيران المتميزة بأسعار تنافسية، مع الحفاظ على أعلى معايير السلامة وجودة الخدمة.
          نسعى لأن نكون الخيار الأول للمسافرين المصريين والزوار القادمين إلى مصر.
        </p>
      </div>

      {/* Values */}
      <div>
        <h2 className="text-xl font-bold text-white mb-6">قيمنا</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {values.map((v) => (
            <div key={v.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
              <span className="text-4xl block mb-3">{v.icon}</span>
              <h3 className="font-bold text-white mb-1">{v.title}</h3>
              <p className="text-white/40 text-xs mb-3">{v.titleEn}</p>
              <p className="text-white/65 text-sm leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Certifications */}
      <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="font-bold text-white mb-4">الاعتمادات والشهادات</h3>
        <div className="flex flex-wrap gap-3">
          {["IATA معتمد", "ISO 9001:2015", "ICAO Standards", "Egyptian CAA Licensed"].map((cert) => (
            <span key={cert} className="text-xs font-bold px-3 py-1.5 rounded-full bg-brand-green/20 text-brand-green border border-brand-green/20">
              ✓ {cert}
            </span>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
