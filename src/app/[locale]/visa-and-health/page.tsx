"use client";
import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";

const DESTINATIONS = [
  { country:"الإمارات",         flag:"🇦🇪", visaRequired:"لا — بدون تأشيرة",             stayDays:"٣٠ يوم",       vaccines:"لا يوجد اشتراط",                          notes:"يُنصح بتأمين سفر" },
  { country:"السعودية",         flag:"🇸🇦", visaRequired:"نعم — سياحية إلكترونية",        stayDays:"٩٠ يوم",       vaccines:"لا يوجد اشتراط",                          notes:"التأشيرة تُستخرج إلكترونياً خلال ٢٤ ساعة" },
  { country:"تركيا",            flag:"🇹🇷", visaRequired:"نعم — إلكترونية (e-Visa)",      stayDays:"٣٠ يوم",       vaccines:"لا يوجد اشتراط",                          notes:"من الموقع الرسمي للحكومة التركية" },
  { country:"ألمانيا",          flag:"🇩🇪", visaRequired:"نعم — شينغن",                   stayDays:"٩٠ / ١٨٠ يوم", vaccines:"لا يوجد اشتراط",                          notes:"تتطلب حجز مسبق وكشف حساب بنكي" },
  { country:"المملكة المتحدة",  flag:"🇬🇧", visaRequired:"نعم — Standard Visitor",       stayDays:"٦ أشهر",       vaccines:"لا يوجد اشتراط",                          notes:"ضرورة إثبات الإقامة والوظيفة" },
  { country:"تنزانيا / زنجبار", flag:"🇹🇿", visaRequired:"نعم — عند الوصول أو إلكترونية", stayDays:"٩٠ يوم",       vaccines:"الحمى الصفراء إذا قادماً من دولة موبوءة", notes:"يُنصح بتطعيم الملاريا" },
];

const HEALTH_TIPS = [
  { icon:"💉", title:"التطعيمات الموصى بها", items:["كوفيد-١٩ — موصى به لجميع الوجهات","التيفويد — للسفر للمناطق الريفية","التهاب الكبد A — خاصة آسيا وأفريقيا","الحمى الصفراء — إلزامية لبعض الدول الأفريقية"] },
  { icon:"🧴", title:"الأدوية الأساسية",      items:["مسكن ألم وخافض حرارة","أدوية للإسهال والتقلبات الهضمية","مضاد حيوي بوصفة طبية","كريم واقٍ من الشمس SPF50+","طارد الحشرات"] },
  { icon:"💧", title:"نصائح عامة للصحة",     items:["اشرب الماء المعبأ فقط في الدول النامية","تجنب الأطعمة غير المطهية جيداً","احرص على التأمين الصحي للسفر","راجع طبيبك قبل ٤-٦ أسابيع من الرحلة"] },
];

export default function VisaAndHealthPage() {
  const [search, setSearch] = useState("");
  const filtered = DESTINATIONS.filter((d) => d.country.includes(search) || search === "");

  return (
    <PageShell pageId="visa-and-health" title="التأشيرة والصحة" subtitle="معلومات شاملة عن متطلبات التأشيرة والاشتراطات الصحية لكل وجهة" maxWidth="lg">
      <div className="mb-6">
        <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="ابحث عن دولة..."
          className="w-full h-11 px-4 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green" />
      </div>

      <div className="overflow-x-auto mb-10 rounded-2xl border border-border-light">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-brand-green text-white">
              {["الدولة","التأشيرة","مدة الإقامة","التطعيمات","ملاحظات"].map((h)=>(
                <th key={h} className="text-right px-4 py-3 font-bold text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((d,i)=>(
              <tr key={d.country} className={i%2===0?"bg-white":"bg-muted"}>
                <td className="px-4 py-3 font-bold whitespace-nowrap"><span className="mr-1">{d.flag}</span>{d.country}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.visaRequired.startsWith("لا")?"bg-green-100 text-green-700":"bg-amber-100 text-amber-700"}`}>
                    {d.visaRequired}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{d.stayDays}</td>
                <td className="px-4 py-3 text-text-secondary">{d.vaccines}</td>
                <td className="px-4 py-3 text-text-muted text-xs">{d.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {HEALTH_TIPS.map(({icon,title,items})=>(
          <div key={title} className="bg-white rounded-2xl border border-border-light p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{icon}</span>
              <h3 className="font-bold text-text-primary text-sm">{title}</h3>
            </div>
            <ul className="space-y-1.5">
              {items.map((item)=>(
                <li key={item} className="text-xs text-text-secondary flex gap-1.5">
                  <span className="text-brand-green shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="p-5 bg-brand-yellow/10 border border-brand-yellow/30 rounded-2xl">
        <p className="text-sm text-text-secondary">
          <strong>⚠️ تنبيه:</strong> المعلومات الواردة هنا للإرشاد العام فقط. تحقق دائماً من السفارة الرسمية للدولة المقصودة قبل السفر لأن متطلبات التأشيرة تتغير باستمرار. فريق سبانكر جاهز للمساعدة في استخراج التأشيرات.
        </p>
      </div>
    </PageShell>
  );
}
