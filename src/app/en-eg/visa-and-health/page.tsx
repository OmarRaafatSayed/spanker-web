"use client";

import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";

const voaCountries = [
  { country: "إيطاليا", flag: "🇮🇹", duration: "٣٠ يوماً", fee: "مجاناً" },
  { country: "اليونان", flag: "🇬🇷", duration: "٣٠ يوماً", fee: "مجاناً" },
  { country: "الأردن", flag: "🇯🇴", duration: "٣٠ يوماً", fee: "$٣٠" },
  { country: "تركيا", flag: "🇹🇷", duration: "٩٠ يوماً", fee: "مجاناً (إلكترونية)" },
  { country: "جورجيا", flag: "🇬🇪", duration: "٣٦٠ يوماً", fee: "مجاناً" },
  { country: "أرمينيا", flag: "🇦🇲", duration: "٩٠ يوماً", fee: "مجاناً" },
];

const healthRequirements = [
  { title: "تأمين السفر", detail: "يُنصح بشدة بالحصول على تأمين سفر يغطي النفقات الطبية والإلغاء.", required: false },
  { title: "التطعيمات الأساسية", detail: "احرص على اكتمال تطعيماتك الدورية (التيتانوس، الالتهاب الكبدي أ) قبل السفر.", required: false },
  { title: "تطعيم الحمى الصفراء", detail: "مطلوب للقادمين من الدول الموبوءة بالحمى الصفراء.", required: true },
  { title: "شهادة صحية للأطفال", detail: "قد تطلب بعض الدول شهادة صحية للأطفال دون ١٢ عاماً.", required: false },
];

export default function VisaAndHealthPage() {
  return (
    <PageShell
      pageId="visa-and-health"
      heroTitle="التأشيرة والصحة"
      heroSubtitle="معلومات شاملة عن متطلبات الدخول والصحة لوجهاتك"
      maxWidth="xl"
      heroIcon={
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      }
    >
      {/* Egypt e-Visa */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
        <div className="flex items-start gap-4 mb-5">
          <span className="text-4xl">🇪🇬</span>
          <div>
            <h2 className="text-xl font-bold text-white mb-1">التأشيرة الإلكترونية المصرية</h2>
            <p className="text-white/60 text-sm">Egypt e-Visa — للمسافرين القادمين إلى مصر</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          {[
            { label: "نوع التأشيرة", value: "إلكترونية" },
            { label: "المدة", value: "٣٠ يوماً" },
            { label: "الرسوم", value: "$٢٥" },
            { label: "وقت المعالجة", value: "٣–٧ أيام" },
          ].map((item) => (
            <div key={item.label} className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-brand-yellow font-bold">{item.value}</p>
              <p className="text-white/50 text-xs mt-1">{item.label}</p>
            </div>
          ))}
        </div>
        <p className="text-white/65 text-sm leading-relaxed mb-4">
          يمكن للمسافرين من أكثر من ١٠٠ دولة تقديم طلب تأشيرة مصر الإلكترونية أونلاين قبل السفر. يتيح لك ذلك تجنب طوابير الانتظار في المطار.
        </p>
        <Link
          href="/visa-application"
          className="inline-block bg-brand-green text-white px-6 py-2.5 rounded-xl font-bold hover:bg-brand-green-dark transition-colors text-sm"
        >
          تقدم بطلب التأشيرة الآن
        </Link>
      </div>

      {/* Visa on Arrival */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-5">دول التأشيرة عند الوصول</h2>
        <p className="text-white/60 text-sm mb-4">يمكن للمواطنين المصريين دخول هذه الدول بدون تأشيرة مسبقة أو بتأشيرة عند الوصول:</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {voaCountries.map((c) => (
            <div key={c.country} className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{c.flag}</span>
                <h3 className="font-bold text-white">{c.country}</h3>
              </div>
              <p className="text-white/60 text-xs">مدة الإقامة: <span className="text-brand-yellow font-semibold">{c.duration}</span></p>
              <p className="text-white/60 text-xs mt-0.5">الرسوم: <span className="text-white/80 font-semibold">{c.fee}</span></p>
            </div>
          ))}
        </div>
        <p className="text-white/40 text-xs mt-3">* المعلومات قابلة للتغيير. راجع سفارة الوجهة للتأكيد.</p>
      </div>

      {/* Health Requirements */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-5">المتطلبات الصحية</h2>
        <div className="space-y-3">
          {healthRequirements.map((h) => (
            <div key={h.title} className={`bg-white/5 border rounded-2xl p-5 flex gap-3 ${h.required ? "border-red-500/30" : "border-white/10"}`}>
              <span className={`text-lg shrink-0 mt-0.5 ${h.required ? "text-red-400" : "text-brand-green"}`}>
                {h.required ? "!" : "✓"}
              </span>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-white text-sm">{h.title}</h3>
                  {h.required && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">مطلوب</span>
                  )}
                </div>
                <p className="text-white/65 text-sm leading-relaxed">{h.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Travel Tips */}
      <div className="bg-brand-green/10 border border-brand-green/30 rounded-2xl p-6">
        <h3 className="font-bold text-white mb-3">💡 نصيحة قبل السفر</h3>
        <p className="text-white/65 text-sm leading-relaxed">
          تحقق دائماً من متطلبات الدخول على الموقع الرسمي لسفارة بلد الوجهة قبل ٣٠ يوماً من تاريخ سفرك.
          قد تختلف الاشتراطات حسب جنسيتك ونوع تذكرتك وجواز سفرك.
        </p>
      </div>
    </PageShell>
  );
}
