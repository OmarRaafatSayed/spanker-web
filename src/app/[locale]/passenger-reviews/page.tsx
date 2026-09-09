"use client";

import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";

const REVIEWS = [
  {
    id: 1,
    name: "محمد السيد",
    city: "القاهرة",
    rating: 5,
    type: "رحلة طيران",
    date: "يناير ٢٠٢٥",
    avatar: "م",
    color: "bg-brand-green",
    title: "تجربة ممتازة من البداية للنهاية",
    body: "حجزت تذكرة لدبي وكان كل شيء سلساً تماماً. الفريق تواصل معي بسرعة وأكد الحجز في نفس اليوم. سعر ممتاز مقارنة بالمواقع الأخرى. بالتأكيد سأحجز مجدداً.",
    verified: true,
  },
  {
    id: 2,
    name: "نور عبد الله",
    city: "الإسكندرية",
    rating: 5,
    type: "فندق",
    date: "ديسمبر ٢٠٢٤",
    avatar: "ن",
    color: "bg-purple-500",
    title: "خدمة استثنائية وسعر لا يُصدق",
    body: "أخذت باقة الغردقة لأسرتي وكانت مفاجأة جميلة. الفندق ٥ نجوم بسعر ٤ نجوم. كل التفاصيل كانت مرتبة مسبقاً والنقل من المطار كان في الموعد. شكراً سبانكر!",
    verified: true,
  },
  {
    id: 3,
    name: "أحمد حسام",
    city: "المنصورة",
    rating: 4,
    type: "تأشيرة",
    date: "نوفمبر ٢٠٢٤",
    avatar: "أ",
    color: "bg-blue-500",
    title: "تأشيرة تركيا في ٣ أيام فقط",
    body: "كنت متخوفاً من موضوع التأشيرة لكن الفريق شرح لي كل الأوراق المطلوبة بدقة. قدمت الأوراق يوم الأحد وجاءت التأشيرة الأربعاء. خدمة احترافية جداً.",
    verified: true,
  },
  {
    id: 4,
    name: "سارة محمود",
    city: "القاهرة",
    rating: 5,
    type: "رحلة سياحية",
    date: "أكتوبر ٢٠٢٤",
    avatar: "س",
    color: "bg-amber-500",
    title: "رحلة الأقصر كانت تجربة العمر",
    body: "اشتركت في رحلة الأقصر وأسوان ٧ أيام. المرشد السياحي كان محترفاً والفندق فوق التوقعات. أكثر ما أعجبني أن كل شيء كان منظماً — لا إرهاق ولا مفاجآت.",
    verified: true,
  },
  {
    id: 5,
    name: "خالد ياسر",
    city: "الجيزة",
    rating: 5,
    type: "رحلة طيران",
    date: "أكتوبر ٢٠٢٤",
    avatar: "خ",
    color: "bg-red-500",
    title: "أرخص سعر وجدته على الإنترنت",
    body: "بحثت في كل المواقع وسبانكر كانت الأرخص على رحلة لندن. الحجز جاهز في دقائق والتذكرة وصلت على إيميلي فوراً. هفضل أحجز معهم دايماً.",
    verified: true,
  },
  {
    id: 6,
    name: "إيمان رمضان",
    city: "السويس",
    rating: 4,
    type: "فندق",
    date: "سبتمبر ٢٠٢٤",
    avatar: "إ",
    color: "bg-teal-500",
    title: "شرم الشيخ مع العيلة بأمان",
    body: "حجزت فندقاً في شرم لأسبوعين. الموقع الممتاز وقرب الشاطئ كما وصف بالضبط. الخدمة في التواصل قبل الرحلة كانت ممتازة وطمنت عيلتي على كل التفاصيل.",
    verified: false,
  },
];

const STATS = [
  { value: "٤.٩", label: "متوسط التقييم", icon: "⭐" },
  { value: "١٢٠٠+", label: "تقييم مؤكد", icon: "✅" },
  { value: "٩٨٪", label: "ينصحون بنا", icon: "👍" },
];

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400">
      {"★".repeat(rating)}{"☆".repeat(5 - rating)}
    </span>
  );
}

export default function PassengerReviewsPage() {
  const [filter, setFilter] = useState("الكل");
  const types = ["الكل", "رحلة طيران", "فندق", "تأشيرة", "رحلة سياحية"];

  const filtered = filter === "الكل" ? REVIEWS : REVIEWS.filter((r) => r.type === filter);

  return (
    <PageShell
      pageId="passenger-reviews"
      title="آراء المسافرين"
      subtitle="ما يقوله عملاؤنا عن تجربتهم مع سبانكر"
      maxWidth="lg"
    >
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {STATS.map(({ value, label, icon }) => (
          <div key={label} className="text-center bg-white rounded-2xl border border-border-light p-4">
            <p className="text-2xl mb-1">{icon}</p>
            <p className="text-2xl font-bold text-brand-green">{value}</p>
            <p className="text-xs text-text-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Type filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {types.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`text-sm px-4 py-1.5 rounded-full border font-medium transition-all ${
              filter === type
                ? "bg-brand-green text-white border-brand-green"
                : "border-border-default text-text-secondary hover:border-brand-green/40"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Reviews grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((review) => (
          <div key={review.id} className="bg-white rounded-2xl border border-border-light p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-10 h-10 rounded-full ${review.color} text-white font-bold flex items-center justify-center text-base shrink-0`}>
                {review.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-text-primary text-sm">{review.name}</p>
                  {review.verified && (
                    <span className="text-xs text-brand-green font-medium">✓ محقق</span>
                  )}
                </div>
                <p className="text-xs text-text-muted">{review.city} • {review.date}</p>
              </div>
              <span className="text-xs bg-muted text-text-muted px-2 py-0.5 rounded-full shrink-0">{review.type}</span>
            </div>
            <Stars rating={review.rating} />
            <h3 className="font-bold text-text-primary text-sm mt-2 mb-1">{review.title}</h3>
            <p className="text-sm text-text-secondary leading-relaxed">{review.body}</p>
          </div>
        ))}
      </div>

      {/* Write review CTA */}
      <div className="mt-10 p-6 bg-brand-yellow/15 border border-brand-yellow/30 rounded-2xl text-center">
        <p className="text-xl mb-1">✍️</p>
        <h3 className="font-bold text-text-primary mb-2">شاركنا تجربتك</h3>
        <p className="text-sm text-text-secondary mb-4">تقييمك يساعد مسافرين آخرين على اتخاذ قراراتهم</p>
        <button className="px-6 py-2.5 bg-brand-green text-white font-bold rounded-xl hover:bg-brand-green-dark transition-colors text-sm">
          اكتب تقييمك
        </button>
      </div>
    </PageShell>
  );
}
