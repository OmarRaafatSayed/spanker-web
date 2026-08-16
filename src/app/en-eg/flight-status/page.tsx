"use client";

import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";

const statusLegend = [
  { status: "في الموعد", statusEn: "On Time", color: "bg-green-500/20 text-green-400 border-green-500/30", dot: "bg-green-400" },
  { status: "تأخير", statusEn: "Delayed", color: "bg-brand-yellow/20 text-brand-yellow border-brand-yellow/30", dot: "bg-brand-yellow" },
  { status: "ملغاة", statusEn: "Cancelled", color: "bg-red-500/20 text-red-400 border-red-500/30", dot: "bg-red-400" },
  { status: "الصعود جارٍ", statusEn: "Boarding", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", dot: "bg-blue-400" },
  { status: "أقلعت", statusEn: "Departed", color: "bg-purple-500/20 text-purple-400 border-purple-500/30", dot: "bg-purple-400" },
  { status: "هبطت", statusEn: "Landed", color: "bg-brand-green/20 text-brand-green border-brand-green/30", dot: "bg-brand-green" },
];

const mockFlights = [
  { flight: "SE 101", from: "القاهرة CAI", to: "الغردقة HRG", dep: "٠٨:٣٠", arr: "٠٩:٤٥", status: "في الموعد", gate: "B٤", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { flight: "SE 205", from: "القاهرة CAI", to: "شرم الشيخ SSH", dep: "١١:١٥", arr: "١٢:٢٠", status: "تأخير ٤٥ دقيقة", gate: "A٧", color: "bg-brand-yellow/20 text-brand-yellow border-brand-yellow/30" },
  { flight: "SE 318", from: "شرم الشيخ SSH", to: "القاهرة CAI", dep: "١٤:٠٠", arr: "١٥:١٥", status: "الصعود جارٍ", gate: "C٢", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
];

export default function FlightStatusPage() {
  const [flightNum, setFlightNum] = useState("");
  const [date, setDate] = useState("");
  const [searched, setSearched] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearched(true);
  }

  return (
    <PageShell
      pageId="flight-status"
      heroTitle="حالة الرحلة"
      heroSubtitle="تتبّع رحلتك في الوقت الفعلي"
      maxWidth="xl"
      heroIcon={
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
      }
    >
      {/* Search Form */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-10">
        <h2 className="text-xl font-bold text-white mb-5">ابحث عن حالة رحلتك</h2>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="text-white/60 text-xs font-semibold mb-1.5 block">رقم الرحلة</label>
            <input
              type="text"
              placeholder="مثال: SE 101"
              value={flightNum}
              onChange={(e) => setFlightNum(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-green text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="text-white/60 text-xs font-semibold mb-1.5 block">تاريخ الرحلة</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-green text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="bg-brand-green text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-green-dark transition-colors w-full sm:w-auto"
            >
              بحث
            </button>
          </div>
        </form>
      </div>

      {/* Search Results */}
      {searched && (
        <div className="mb-10">
          <h2 className="text-xl font-bold text-white mb-5">نتائج البحث</h2>
          {mockFlights
            .filter((f) => !flightNum || f.flight.toLowerCase().includes(flightNum.toLowerCase()))
            .map((f) => (
              <div key={f.flight} className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-4">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-brand-yellow font-black text-lg">{f.flight}</span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${f.color}`}>{f.status}</span>
                  </div>
                  <span className="text-white/50 text-xs">بوابة {f.gate}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-white font-bold">{f.dep}</p>
                    <p className="text-white/50 text-xs">{f.from}</p>
                  </div>
                  <div className="flex-1 flex items-center gap-1">
                    <div className="h-px flex-1 bg-white/20" />
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-brand-green shrink-0">
                      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2c-.5.1-.9.6-.6 1.1l1.5 2.5c.2.4.7.6 1.1.5L8 9.5l-2 3.5L4 14c-.4.3-.4.8 0 1l2 2c.3.4.8.4 1 0l1.5-2 3.5-2-.5 4.2c-.1.5.2.9.7 1l2.5 1.5c.5.3 1 0 1.1-.5z" />
                    </svg>
                    <div className="h-px flex-1 bg-white/20" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-bold">{f.arr}</p>
                    <p className="text-white/50 text-xs">{f.to}</p>
                  </div>
                </div>
              </div>
            ))}
          {mockFlights.filter((f) => !flightNum || f.flight.toLowerCase().includes(flightNum.toLowerCase())).length === 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
              <p className="text-white/50 text-sm">لم يتم العثور على رحلات تطابق بحثك. تأكد من رقم الرحلة والتاريخ.</p>
            </div>
          )}
        </div>
      )}

      {/* Status Legend */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-white mb-6">دليل حالات الرحلات</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {statusLegend.map((s) => (
            <div key={s.status} className={`border rounded-xl p-3 flex items-center gap-2 ${s.color}`}>
              <div className={`w-2.5 h-2.5 rounded-full ${s.dot} shrink-0`} />
              <div>
                <p className="font-bold text-sm">{s.status}</p>
                <p className="text-xs opacity-70">{s.statusEn}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real-time note */}
      <div className="bg-brand-green/10 border border-brand-green/30 rounded-2xl p-5">
        <h3 className="font-bold text-white mb-2">📡 معلومات الوقت الفعلي</h3>
        <p className="text-white/65 text-sm leading-relaxed mb-3">
          تُحدَّث حالة الرحلات كل ٥ دقائق. للحصول على تحديثات فورية، يمكنك الاشتراك في إشعارات الرحلة عبر رسائل SMS أو البريد الإلكتروني.
        </p>
        <div className="flex flex-wrap gap-3 text-sm">
          <a href="tel:+20224186000" className="text-brand-green font-semibold hover:underline">
            📞 ٢٠٢٢٤١٨٦٠٠٠+
          </a>
          <a href="mailto:info@spanker.com" className="text-brand-green font-semibold hover:underline">
            ✉️ info@spanker.com
          </a>
        </div>
      </div>
    </PageShell>
  );
}
