"use client";
import { PageShell } from "@/components/layout/PageShell";

const SEAT_TYPES = [
  { id:"window",   label:"نافذة",            icon:"🪟", desc:"منظر رائع وخصوصية أكثر، مثالية لرحلات النوم",                                   fee:"٥٠ج.م",   color:"bg-blue-50 border-blue-200" },
  { id:"aisle",    label:"ممر",              icon:"🚶", desc:"سهولة الحركة والوصول للمرافق، مريحة للرحلات الطويلة",                            fee:"٣٠ج.م",   color:"bg-green-50 border-green-200" },
  { id:"middle",   label:"وسط",              icon:"😐", desc:"الاختيار الأقل تفضيلاً لكنه متاح مجاناً",                                        fee:"مجاني",   color:"bg-gray-50 border-gray-200" },
  { id:"exit",     label:"مخرج طوارئ",       icon:"🚪", desc:"مساحة رجلين أوسع، تتطلب قدرة على المساعدة عند الطوارئ",                         fee:"١٠٠ج.م",  color:"bg-amber-50 border-amber-200" },
  { id:"front",    label:"صف أمامي",         icon:"⭐", desc:"أول من يغادر الطائرة وأقل ضوضاء من المحركات",                                   fee:"٨٠ج.م",   color:"bg-purple-50 border-purple-200" },
  { id:"bassinet", label:"مهد أطفال",        icon:"👶", desc:"مخصص للمسافرين مع رضع، يوفر مهداً قابلاً للتركيب",                              fee:"مجاني",   color:"bg-pink-50 border-pink-200" },
];

const HOW_TO = [
  { step:"١", title:"أكمل الحجز",          desc:"بعد تأكيد حجزك ستتلقى رمز الحجز على بريدك الإلكتروني" },
  { step:"٢", title:"سجل الدخول لحجوزاتي", desc:"اذهب لقسم حجوزاتي وافتح تفاصيل رحلتك" },
  { step:"٣", title:"اختر مقعدك",          desc:"ستجد خريطة تفاعلية للطائرة — اختر المقعد الأنسب لك" },
  { step:"٤", title:"أكد ودفع",            desc:"أكد اختيارك وادفع رسوم المقعد إن وجدت" },
];

export default function SeatSelectionPage() {
  return (
    <PageShell pageId="seat-selection" title="اختيار المقعد" subtitle="اعرف كل شيء عن أنواع المقاعد وكيف تختار المقعد المثالي لرحلتك" maxWidth="lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {SEAT_TYPES.map(({id,label,icon,desc,fee,color})=>(
          <div key={id} className={`rounded-2xl border p-5 ${color}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{icon}</span>
              <span className="font-bold text-text-primary">{label}</span>
              <span className="mr-auto text-xs font-bold text-brand-green bg-white px-2 py-0.5 rounded-full">{fee}</span>
            </div>
            <p className="text-sm text-text-secondary">{desc}</p>
          </div>
        ))}
      </div>
      <div className="mb-10 p-6 bg-brand-green/5 rounded-2xl border border-brand-green/20">
        <h2 className="text-lg font-bold text-text-primary mb-5">كيف تختار مقعدك؟</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {HOW_TO.map(({step,title,desc})=>(
            <div key={step} className="text-center">
              <div className="w-10 h-10 rounded-full bg-brand-green text-white font-black text-lg flex items-center justify-center mx-auto mb-3">{step}</div>
              <p className="font-bold text-text-primary text-sm mb-1">{title}</p>
              <p className="text-xs text-text-muted">{desc}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-border-light p-6">
        <h2 className="text-lg font-bold text-text-primary mb-4">نصائح لاختيار أفضل مقعد</h2>
        <div className="space-y-3 text-sm text-text-secondary">
          <p>🌙 <strong>لرحلات الليل:</strong> اختر مقعد النافذة — يمكنك الاتكاء والنوم بدون إزعاج</p>
          <p>🦵 <strong>لطول الساقين:</strong> مقاعد الصف الأمامي أو مخرج الطوارئ توفر مساحة أوسع</p>
          <p>👨‍👩‍👧 <strong>للعائلات:</strong> احجز مقاعد متجاورة مبكراً وأبلغنا عن الأطفال الرضع</p>
          <p>✈️ <strong>لتجنب الاهتزاز:</strong> المقاعد فوق الأجنحة أكثر ثباتاً أثناء الاضطراب الجوي</p>
          <p>🎧 <strong>لتجنب الضوضاء:</strong> ابتعد عن مقاعد المحركات في الجزء الخلفي من الطائرة</p>
        </div>
      </div>
    </PageShell>
  );
}
