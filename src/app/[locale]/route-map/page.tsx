"use client";
import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";

const ROUTES = [
  { from:"القاهرة", fromCode:"CAI", to:"دبي",        toCode:"DXB", duration:"٣س ٣٠د", freq:"يومي",       type:"دولي" },
  { from:"القاهرة", fromCode:"CAI", to:"الرياض",     toCode:"RUH", duration:"٢س ٤٥د", freq:"يومي",       type:"دولي" },
  { from:"القاهرة", fromCode:"CAI", to:"إسطنبول",    toCode:"IST", duration:"٣س ١٥د", freq:"يومي",       type:"دولي" },
  { from:"القاهرة", fromCode:"CAI", to:"لندن",       toCode:"LHR", duration:"٥س ٣٠د", freq:"٣ × أسبوع",  type:"دولي" },
  { from:"القاهرة", fromCode:"CAI", to:"باريس",      toCode:"CDG", duration:"٥س ٠٠د", freq:"٤ × أسبوع",  type:"دولي" },
  { from:"القاهرة", fromCode:"CAI", to:"الغردقة",    toCode:"HRG", duration:"١س ٠٠د", freq:"يومي",       type:"داخلي" },
  { from:"القاهرة", fromCode:"CAI", to:"شرم الشيخ",  toCode:"SSH", duration:"١س ١٠د", freq:"يومي",       type:"داخلي" },
  { from:"القاهرة", fromCode:"CAI", to:"الأقصر",     toCode:"LXR", duration:"١س ٢٠د", freq:"٥ × أسبوع",  type:"داخلي" },
  { from:"القاهرة", fromCode:"CAI", to:"أسوان",      toCode:"ASW", duration:"١س ٣٠د", freq:"٤ × أسبوع",  type:"داخلي" },
  { from:"القاهرة", fromCode:"CAI", to:"مرسى علم",   toCode:"RMF", duration:"١س ٤٠د", freq:"٣ × أسبوع",  type:"داخلي" },
];

export default function RouteMapPage() {
  const [filter, setFilter] = useState("الكل");
  const filtered = filter === "الكل" ? ROUTES : ROUTES.filter((r) => r.type === filter);

  return (
    <PageShell pageId="route-map" title="خريطة الرحلات" subtitle="استكشف كل الوجهات المتاحة من مصر" maxWidth="lg">
      <div className="flex gap-2 mb-6">
        {["الكل","دولي","داخلي"].map((f)=>(
          <button key={f} onClick={()=>setFilter(f)}
            className={`px-5 py-1.5 rounded-full text-sm font-medium border transition-all ${filter===f?"bg-brand-green text-white border-brand-green":"border-border-default text-text-secondary hover:border-brand-green/40"}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {filtered.map((r)=>(
          <div key={`${r.fromCode}-${r.toCode}`} className="bg-white rounded-2xl border border-border-light p-4 hover:border-brand-green/30 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.type==="دولي"?"bg-blue-100 text-blue-700":"bg-green-100 text-green-700"}`}>{r.type}</span>
              <span className="text-xs text-text-muted mr-auto">{r.freq}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="font-black text-lg font-mono text-brand-green">{r.fromCode}</p>
                <p className="text-xs text-text-muted">{r.from}</p>
              </div>
              <div className="flex-1 flex flex-col items-center text-text-muted">
                <span className="text-xs">{r.duration}</span>
                <div className="w-full flex items-center gap-1 my-0.5">
                  <div className="flex-1 h-px bg-border-default"/>
                  <span className="text-brand-green text-sm">✈</span>
                  <div className="flex-1 h-px bg-border-default"/>
                </div>
                <span className="text-xs">مباشر</span>
              </div>
              <div className="text-center">
                <p className="font-black text-lg font-mono text-brand-green">{r.toCode}</p>
                <p className="text-xs text-text-muted">{r.to}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-brand-green/5 rounded-2xl border border-brand-green/20 p-5 text-center">
        <p className="font-bold text-text-primary mb-2">لا تجد وجهتك؟</p>
        <p className="text-sm text-text-secondary mb-4">تواصل معنا وسنجد لك أفضل مسار متاح</p>
        <a href="tel:19699" className="inline-block px-6 py-2.5 bg-brand-green text-white font-bold rounded-xl hover:bg-brand-green-dark transition-colors text-sm">
          📞 اتصل بنا: ١٩٦٩٩
        </a>
      </div>
    </PageShell>
  );
}
