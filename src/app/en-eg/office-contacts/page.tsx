"use client";

import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";

const offices = [
  {
    name: "المقر الرئيسي — القاهرة",
    nameEn: "Cairo HQ",
    address: "١٢٣ شارع النيل، المهندسين، الجيزة",
    phone: "+20 2 2418 6000",
    email: "cairo@spanker.com",
    hours: "السبت – الخميس · ٨ص – ٨م",
    isHQ: true,
  },
  {
    name: "مكتب الإسكندرية",
    nameEn: "Alexandria Office",
    address: "٤٥ شارع الإسكندر الأكبر، رشدي، الإسكندرية",
    phone: "+20 3 592 7000",
    email: "alex@spanker.com",
    hours: "السبت – الخميس · ٩ص – ٦م",
    isHQ: false,
  },
  {
    name: "مكتب الغردقة",
    nameEn: "Hurghada Office",
    address: "مطار الغردقة الدولي، مبنى المغادرة، الغردقة",
    phone: "+20 65 344 5000",
    email: "hurghada@spanker.com",
    hours: "يومياً · ٦ص – ١٢م",
    isHQ: false,
  },
  {
    name: "مكتب أسوان",
    nameEn: "Aswan Office",
    address: "مطار أسوان الدولي، طريق المطار، أسوان",
    phone: "+20 97 234 5000",
    email: "aswan@spanker.com",
    hours: "يومياً · ٧ص – ١٠م",
    isHQ: false,
  },
];

const socialLinks = [
  { name: "Facebook", icon: "📘", url: "https://facebook.com/spanker" },
  { name: "Instagram", icon: "📸", url: "https://instagram.com/spanker" },
  { name: "Twitter / X", icon: "🐦", url: "https://twitter.com/spanker" },
  { name: "YouTube", icon: "▶️", url: "https://youtube.com/spanker" },
  { name: "LinkedIn", icon: "💼", url: "https://linkedin.com/company/spanker" },
];

export default function OfficeContactsPage() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <PageShell
      pageId="office-contacts"
      heroTitle="مكاتب التواصل"
      heroSubtitle="تواصل معنا في أي وقت — فريقنا جاهز لمساعدتك"
      maxWidth="xl"
      heroIcon={
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.24h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.78a16 16 0 0 0 6 6l.95-.95a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      }
    >
      {/* Offices Grid */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-white mb-6">مكاتبنا</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {offices.map((office) => (
            <div
              key={office.name}
              className={`bg-white/5 border rounded-2xl p-6 ${office.isHQ ? "border-brand-green/40 ring-1 ring-brand-green/20" : "border-white/10"}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-white">{office.name}</h3>
                  <p className="text-white/45 text-xs">{office.nameEn}</p>
                </div>
                {office.isHQ && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-green/20 text-brand-green">
                    المقر الرئيسي
                  </span>
                )}
              </div>
              <div className="space-y-2.5">
                <div className="flex items-start gap-2">
                  <span className="text-white/40 mt-0.5 shrink-0">📍</span>
                  <p className="text-white/70 text-sm">{office.address}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/40 shrink-0">📞</span>
                  <a href={`tel:${office.phone.replace(/\s/g, "")}`} className="text-brand-green text-sm font-semibold hover:underline">
                    {office.phone}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/40 shrink-0">✉️</span>
                  <a href={`mailto:${office.email}`} className="text-brand-green text-sm font-semibold hover:underline">
                    {office.email}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/40 shrink-0">🕐</span>
                  <p className="text-white/60 text-sm">{office.hours}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WhatsApp CTA */}
      <div className="bg-green-600/10 border border-green-600/30 rounded-2xl p-5 mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="font-bold text-white mb-1">تواصل معنا عبر واتساب</h3>
          <p className="text-white/60 text-sm">ردود فورية على استفساراتك على مدار ساعات العمل</p>
        </div>
        <a
          href="https://wa.me/20224186000"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-green-700 transition-colors text-sm"
        >
          <span>💬</span> واتساب الآن
        </a>
      </div>

      {/* Social Media */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-white mb-5">تابعنا على وسائل التواصل</h2>
        <div className="flex flex-wrap gap-3">
          {socialLinks.map((s) => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white/80 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium"
            >
              <span>{s.icon}</span>
              {s.name}
            </a>
          ))}
        </div>
      </div>

      {/* Contact Form */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-5">نموذج الاستفسار</h2>

        {submitted ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full bg-brand-green/20 border border-brand-green/30 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" fill="none" stroke="#3D6833" strokeWidth="2.5" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="font-bold text-white mb-2">تم إرسال رسالتك!</h3>
            <p className="text-white/60 text-sm">سيتواصل معك فريقنا خلال ٢٤ ساعة على البريد الإلكتروني.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-white/60 text-xs font-semibold mb-1.5 block">الاسم الكامل</label>
                <input
                  type="text"
                  required
                  placeholder="محمد أحمد"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-green text-sm"
                />
              </div>
              <div>
                <label className="text-white/60 text-xs font-semibold mb-1.5 block">البريد الإلكتروني</label>
                <input
                  type="email"
                  required
                  placeholder="example@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-green text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-white/60 text-xs font-semibold mb-1.5 block">رسالتك</label>
              <textarea
                required
                rows={4}
                placeholder="اكتب رسالتك أو استفسارك هنا..."
                value={formData.message}
                onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-green text-sm resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto bg-brand-green text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-green-dark transition-colors"
            >
              إرسال الرسالة
            </button>
          </form>
        )}
      </div>
    </PageShell>
  );
}
