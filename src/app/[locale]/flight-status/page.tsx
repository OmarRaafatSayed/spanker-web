"use client";
import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";

const MOCK: Record<string, any> = {
  "SK101": { flight:"SK101", route:"القاهرة → دبي",        status:"في الموعد",      statusColor:"bg-green-100 text-green-700",  departure:"١٤:٣٠", arrival:"١٩:٠٠", gate:"B12", terminal:"٢", aircraft:"Airbus A320" },
  "SK205": { flight:"SK205", route:"الغردقة → القاهرة",    status:"تأخير ٣٠ دقيقة", statusColor:"bg-amber-100 text-amber-700",  departure:"١٦:٠٠", arrival:"١٧:٤٥", gate:"A4",  terminal:"١", aircraft:"Boeing 737" },
  "SK310": { flight:"SK310", route:"القاهرة → الرياض",     status:"أقلع",           statusColor:"bg-blue-100 text-blue-700",    departure:"١١:٠٠", arrival:"١٣:٣٠", gate:"—",   terminal:"٢", aircraft:"Airbus A321" },
};

export default function FlightStatusPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<any>(null);
  const [searched, setSearched] = useState(false);

  function handleSearch() {
    setSearched(true);
    setResult(MOCK[query.toUpperCase()] ?? null);
  }

  return (
    <PageShell pageId="flight-status" title="حالة الرحلة" subtitle="تتبع رحلتك في الوقت الفعلي" maxWidth="md">
      <div className="bg-white rounded-2xl border border-border-light p-6 mb-6">
        <div className="flex gap-3">
          <input value={query} onChange={(e)=>setQuery(e.target.value)} onKeyDown={(e)=>e.key==="Enter"&&handleSearch()}
            placeholder="أدخل رقم الرحلة — مثال: SK101"
            className="flex-1 h-12 px-4 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green font-mono" />
          <button onClick={handleSearch} className="px-6 h-12 bg-brand-green text-white font-bold rounded-xl hover:bg-brand-green-dark transition-colors text-sm">
            🔍 بحث
          </button>
        </div>
        <p className="text-xs text-text-muted mt-2">جرّب: SK101 · SK205 · SK310</p>
      </div>

      {searched && !result && (
        <div className="text-center py-12 bg-white rounded-2xl border border-border-light">
          <p className="text-4xl mb-3">✈️</p>
          <p className="text-text-muted">لم نجد رحلة بهذا الرقم</p>
          <p className="text-xs text-text-muted mt-1">تأكد من رقم الرحلة وحاول مجدداً</p>
        </div>
      )}

      {result && (
        <div className="bg-white rounded-2xl border border-border-light overflow-hidden mb-6">
          <div className="bg-brand-green p-5 text-white flex items-center justify-between">
            <div>
              <p className="font-mono font-black text-2xl">{result.flight}</p>
              <p className="text-white/80 text-sm mt-0.5">{result.route}</p>
            </div>
            <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${result.statusColor}`}>{result.status}</span>
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            {[{label:"الإقلاع",value:result.departure},{label:"الوصول",value:result.arrival},{label:"البوابة",value:result.gate},{label:"الصالة",value:result.terminal},{label:"الطائرة",value:result.aircraft}].map(({label,value})=>(
              <div key={label} className="bg-muted rounded-xl p-3">
                <p className="text-xs text-text-muted mb-1">{label}</p>
                <p className="font-bold text-text-primary">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-brand-yellow/10 border border-brand-yellow/30 rounded-2xl p-5">
        <h3 className="font-bold text-text-primary mb-2">للاستفسار عن رحلتك</h3>
        <p className="text-sm text-text-secondary mb-3">فريقنا جاهز لمساعدتك على مدار الساعة.</p>
        <a href="tel:19699" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-green text-white rounded-xl text-sm font-bold hover:bg-brand-green-dark transition-colors">
          📞 ١٩٦٩٩
        </a>
      </div>
    </PageShell>
  );
}
