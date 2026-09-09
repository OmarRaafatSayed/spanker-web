"use client";

import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";

const OFFICES = [
  {
    city: "القاهرة — المقر الرئيسي",
    address: "٢٣ شارع التحرير، وسط البلد، القاهرة",
    phone: "+20 2 2391 0000",
    mobile: "+20 100 100 5678",
    email: "cairo@spanker.travel",
    hours: "السبت – الخميس: ٩ص – ٧م",
    flag: "🏢",
    mapUrl: "https://maps.google.com",
  },
  {
    city: "الغردقة",
    address: "شارع الشيراتون، بجوار المارينا، الغردقة",
    phone: "+20 65 344 0000",
    mobile: "+20 100 200 5678",
    email: "hurghada@spanker.travel",
    hours: "يومياً: ٨ص – ١٠م",
    flag: "🏖️",
    mapUrl: "https://maps.google.com",
  },
  {
    city: "شرم الشيخ",
    address: "شارع النصر، حي النور، شرم الشيخ",
    phone: "+20 69 360 0000",
    mobile: "+20 100 300 5678",
    email: "sharm@spanker.travel",
    hours: "يومياً: ٨ص – ١٠م",
    flag: "🤿",
    mapUrl: "https://maps.google.com",
  },
  {
    city: "الأقصر",
    address: "كورنيش النيل، أمام معبد الكرنك، الأقصر",
    phone: "+20 95 238 0000",
    mobile: "+20 100 400 5678",
    email: "luxor@spanker.travel",
    hours: "السبت – الخميس: ٩ص – ٦م",
    flag: "🏛️",
    mapUrl: "https://maps.google.com",
  },
];

const CHANNELS = [
  { icon: "📞", title: "اتصل بنا", value: "١٩٦٩٩", sub: "خط ساخن مجاني — ٢٤/٧", color: "bg-green-50 border-green-200" },
  { icon: "💬", title: "واتساب", value: "+20 100 100 5678", sub: "رد خلال ٥ دقائق", color: "bg-emerald-50 border-emerald-200" },
  { icon: "📧", title: "البريد الإلكتروني", value: "hello@spanker.travel", sub: "رد خلال ٢٤ ساعة", color: "bg-blue-50 border-blue-200" },
  { icon: "🤖", title: "الدعم الفوري", value: "الدردشة المباشرة", sub: "متاح الآن", color: "bg-purple-50 border-purple-200" },
];

export default function OfficeContactsPage() {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <PageShell
      pageId="office-contacts"
      title="مكاتب التواصل"
      subtitle="فريقنا جاهز لمساعدتك — تواصل معنا بالطريقة الأنسب لك"
      maxWidth="lg"
    >
      {/* Quick contact channels */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        {CHANNELS.map(({ icon, title, value, sub, color }) => (
          <div key={title} className={`rounded-2xl border p-4 text-center ${color}`}>
            <span className="text-3xl block mb-2">{icon}</span>
            <p className="text-xs font-bold text-text-primary mb-1">{title}</p>
            <p className="text-sm font-bold text-brand-green">{value}</p>
            <p className="text-xs text-text-muted mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Offices grid */}
      <h2 className="text-xl font-bold text-text-primary mb-5">مكاتبنا</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {OFFICES.map((office) => (
          <div key={office.city} className="bg-white rounded-2xl border border-border-light p-5 hover:border-brand-green/30 transition-colors">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl">{office.flag}</span>
              <div>
                <h3 className="font-bold text-text-primary text-sm">{office.city}</h3>
                <p className="text-xs text-text-muted mt-0.5">{office.address}</p>
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-text-secondary">
              <button
                onClick={() => copy(office.phone)}
                className="flex items-center gap-2 hover:text-brand-green transition-colors w-full text-right"
              >
                <span>📞</span>
                <span>{office.phone}</span>
                {copied === office.phone && <span className="text-brand-green text-xs mr-auto">✓ تم النسخ</span>}
              </button>
              <button
                onClick={() => copy(office.mobile)}
                className="flex items-center gap-2 hover:text-brand-green transition-colors w-full text-right"
              >
                <span>📱</span>
                <span>{office.mobile}</span>
                {copied === office.mobile && <span className="text-brand-green text-xs mr-auto">✓ تم النسخ</span>}
              </button>
              <div className="flex items-center gap-2">
                <span>✉️</span>
                <a href={`mailto:${office.email}`} className="hover:text-brand-green transition-colors">{office.email}</a>
              </div>
              <div className="flex items-center gap-2">
                <span>🕐</span>
                <span>{office.hours}</span>
              </div>
            </div>
            <a
              href={office.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs text-brand-green font-medium hover:underline"
            >
              📍 عرض على الخريطة
            </a>
          </div>
        ))}
      </div>

      {/* Contact form */}
      <div className="bg-white rounded-2xl border border-border-light p-6">
        <h2 className="text-lg font-bold text-text-primary mb-4">أرسل لنا رسالة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">الاسم الكامل</label>
            <input
              className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
              placeholder="محمد أحمد"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">رقم الهاتف</label>
            <input
              type="tel"
              className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
              placeholder="+20 1xx xxx xxxx"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-text-muted mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
              placeholder="your@email.com"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-text-muted mb-1">رسالتك</label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green resize-none"
              placeholder="كيف يمكننا مساعدتك؟"
            />
          </div>
          <div className="sm:col-span-2">
            <button className="w-full h-11 bg-brand-green text-white font-bold rounded-xl hover:bg-brand-green-dark transition-colors">
              إرسال الرسالة ✉️
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
