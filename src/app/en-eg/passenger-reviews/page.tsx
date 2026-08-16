"use client";

import { PageShell } from "@/components/layout/PageShell";

const reviews = [
  {
    initials: "أم",
    name: "أحمد محمود",
    stars: 5,
    date: "ديسمبر ٢٠٢٤",
    destination: "رحلة القاهرة → دبي",
    text: "تجربة ممتازة من البداية للنهاية. طاقم الطائرة محترف جداً وودود، والرحلة كانت في الموعد تماماً. سأسافر مع سبانكر دائماً.",
  },
  {
    initials: "سر",
    name: "سارة رضا",
    stars: 5,
    date: "نوفمبر ٢٠٢٤",
    destination: "رحلة القاهرة → إسطنبول",
    text: "حجزت بسهولة تامة عبر الموقع، وتلقيت تأكيد الحجز فوراً. الرحلة مريحة والطعام لذيذ. أنصح بها بشدة.",
  },
  {
    initials: "مع",
    name: "محمد العمري",
    stars: 4,
    date: "أكتوبر ٢٠٢٤",
    destination: "رحلة الغردقة → القاهرة",
    text: "خدمة ممتازة وأسعار منافسة. تأخرت الرحلة ١٥ دقيقة لكن تعامل الطاقم كان رائعاً وشرحوا السبب.",
  },
  {
    initials: "نح",
    name: "نور حسين",
    stars: 5,
    date: "سبتمبر ٢٠٢٤",
    destination: "رحلة القاهرة → بودابست",
    text: "أول مرة أسافر لأوروبا مع سبانكر وكانت تجربة رائعة. الطائرة نظيفة وحديثة، والخدمة احترافية للغاية.",
  },
  {
    initials: "عك",
    name: "علاء الكناوي",
    stars: 5,
    date: "أغسطس ٢٠٢٤",
    destination: "رحلة شرم الشيخ → القاهرة",
    text: "خدمة عملاء سبانكر تستحق التقدير. حين واجهت مشكلة في بيانات تذكرتي، حلوا المشكلة في دقائق. شكراً جزيلاً.",
  },
  {
    initials: "ري",
    name: "رانيا إبراهيم",
    stars: 4,
    date: "يوليو ٢٠٢٤",
    destination: "رحلة القاهرة → الأقصر",
    text: "رحلة سريعة ومريحة إلى الأقصر. الحجز كان سهلاً والسعر مناسب جداً. سأعود للسفر معهم قريباً.",
  },
];

const stats = [
  { value: "٩٨٪", label: "رحلات في الموعد", sub: "On-Time Rate" },
  { value: "٤٫٩", label: "جودة الخدمة", sub: "Service Quality" },
  { value: "٤٫٧", label: "الراحة والمقاعد", sub: "Comfort Rating" },
  { value: "٤٫٨", label: "التقييم العام", sub: "Overall Rating" },
];

function StarRating({ stars }: { stars: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          width="14" height="14"
          viewBox="0 0 24 24"
          fill={s <= stars ? "#FDD12A" : "none"}
          stroke="#FDD12A"
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export default function PassengerReviewsPage() {
  return (
    <PageShell
      pageId="passenger-reviews"
      heroTitle="آراء المسافرين"
      heroSubtitle="تجارب حقيقية من مسافرينا حول العالم"
      maxWidth="xl"
      heroIcon={
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      }
    >
      {/* Overall Rating */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-10 text-center">
        <p className="text-white/60 text-sm mb-2">التقييم العام لسبانكر</p>
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="text-brand-yellow font-black text-6xl">٤٫٨</span>
          <div className="text-right">
            <StarRating stars={5} />
            <p className="text-white/50 text-xs mt-1">بناءً على +٨٠٠٠ تقييم</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-brand-yellow font-black text-3xl mb-1">{s.value}</p>
            <p className="text-white text-xs font-semibold mb-0.5">{s.label}</p>
            <p className="text-white/40 text-xs">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Reviews Grid */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-6">تقييمات المسافرين</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {reviews.map((r) => (
            <div key={r.name} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-green/20 border border-brand-green/30 flex items-center justify-center font-bold text-brand-green text-sm">
                    {r.initials}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{r.name}</p>
                    <p className="text-white/45 text-xs">{r.date}</p>
                  </div>
                </div>
                <StarRating stars={r.stars} />
              </div>
              <p className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-green/15 text-brand-green inline-block mb-3">
                ✈ {r.destination}
              </p>
              <p className="text-white/70 text-sm leading-relaxed">{r.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Write review CTA */}
      <div className="bg-brand-green/10 border border-brand-green/30 rounded-2xl p-6 text-center">
        <h3 className="font-bold text-white mb-2">شاركنا تجربتك</h3>
        <p className="text-white/60 text-sm mb-4">سافرت مع سبانكر؟ أخبرنا برأيك وساعد المسافرين الآخرين في اتخاذ قرارهم.</p>
        <button className="bg-brand-green text-white px-6 py-2.5 rounded-xl font-bold hover:bg-brand-green-dark transition-colors text-sm">
          اكتب تقييمك
        </button>
      </div>
    </PageShell>
  );
}
