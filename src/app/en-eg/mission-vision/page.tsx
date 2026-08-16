"use client";

import { PageShell } from "@/components/layout/PageShell";

const coreValues = [
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "السلامة",
    titleEn: "Safety",
    desc: "لا تهاون أبداً في معايير السلامة. كل قرار نتخذه يضع سلامة مسافرينا وطاقمنا في المقام الأول.",
    color: "border-green-500/30 bg-green-500/5",
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
    title: "النزاهة",
    titleEn: "Integrity",
    desc: "نلتزم بالشفافية التامة في تسعيرنا وخدماتنا. لا رسوم خفية ولا وعود مبالَغ فيها.",
    color: "border-blue-500/30 bg-blue-500/5",
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    title: "الابتكار",
    titleEn: "Innovation",
    desc: "نستثمر في التكنولوجيا الحديثة لجعل تجربة السفر أسهل وأكثر متعة في كل مرحلة.",
    color: "border-brand-yellow/30 bg-brand-yellow/5",
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
    title: "المسافر أولاً",
    titleEn: "Customer First",
    desc: "كل قرار تشغيلي وكل تحسين في خدماتنا ينطلق من سؤال واحد: هل هذا في صالح مسافرينا؟",
    color: "border-purple-500/30 bg-purple-500/5",
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="M12 8v4l3 3" />
      </svg>
    ),
    title: "الاستدامة",
    titleEn: "Sustainability",
    desc: "نعمل على تقليل البصمة الكربونية لعملياتنا من خلال تحديث أسطولنا باستخدام طائرات أكثر كفاءة في استهلاك الوقود.",
    color: "border-brand-green/30 bg-brand-green/5",
  },
];

const goals = [
  { year: "٢٠٢٥", goal: "توسيع الشبكة لتشمل ٣٠ وجهة دولية جديدة" },
  { year: "٢٠٢٦", goal: "إضافة ١٠ طائرات جديدة لتحديث الأسطول" },
  { year: "٢٠٢٧", goal: "الوصول إلى ٢ مليون مسافر سنوياً" },
  { year: "٢٠٢٨", goal: "إطلاق برنامج الولاء وبطاقات المسافر الدائم" },
];

export default function MissionVisionPage() {
  return (
    <PageShell
      pageId="mission-vision"
      heroTitle="رسالتنا ورؤيتنا"
      heroSubtitle="القيم التي تقودنا نحو مستقبل أفضل للطيران المصري"
      maxWidth="xl"
      heroIcon={
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      }
    >
      {/* Mission & Vision Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
        <div className="bg-brand-green/10 border border-brand-green/30 rounded-2xl p-7">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-green/20 border border-brand-green/40 flex items-center justify-center text-brand-green text-xl">
              🎯
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">رسالتنا</h2>
              <p className="text-white/50 text-xs">Our Mission</p>
            </div>
          </div>
          <p className="text-white/75 text-sm leading-relaxed">
            تقديم خدمات الطيران الآمنة والموثوقة والميسورة لجميع المصريين والزوار القادمين إلى مصر،
            مع الحفاظ على أعلى معايير الجودة والكفاءة التشغيلية، وتعزيز مكانة مصر كمركز ربط جوي
            إقليمي ودولي.
          </p>
        </div>

        <div className="bg-brand-yellow/10 border border-brand-yellow/30 rounded-2xl p-7">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-yellow/20 border border-brand-yellow/40 flex items-center justify-center text-brand-yellow text-xl">
              🔭
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">رؤيتنا</h2>
              <p className="text-white/50 text-xs">Our Vision</p>
            </div>
          </div>
          <p className="text-white/75 text-sm leading-relaxed">
            أن نكون شركة الطيران الأولى في منطقة الشرق الأوسط وأفريقيا من حيث رضا العملاء وكفاءة العمليات،
            مع المساهمة في نمو قطاع السياحة المصرية وتنشيط حركة التجارة والسفر بين مصر وسائر دول العالم.
          </p>
        </div>
      </div>

      {/* Core Values */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-white mb-6">قيمنا الجوهرية</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coreValues.map((v) => (
            <div key={v.title} className={`border rounded-2xl p-5 ${v.color}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
                  {v.icon}
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{v.title}</h3>
                  <p className="text-white/45 text-xs">{v.titleEn}</p>
                </div>
              </div>
              <p className="text-white/65 text-sm leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Strategic Goals */}
      <div>
        <h2 className="text-xl font-bold text-white mb-6">الأهداف الاستراتيجية</h2>
        <div className="space-y-3">
          {goals.map((g) => (
            <div key={g.year} className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 flex items-center gap-4">
              <div className="shrink-0">
                <span className="text-brand-yellow font-black text-lg">{g.year}</span>
              </div>
              <div className="w-px h-8 bg-white/15 shrink-0" />
              <p className="text-white/75 text-sm">{g.goal}</p>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
