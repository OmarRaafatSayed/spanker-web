"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n/context";

const REVIEWS_AR = [
  { name: "أحمد خالد", city: "القاهرة", avatar: "أ", rating: 5, color: "from-[#1b4332] to-[#2d6a4f]",
    text: "خدمة ممتازة من أول ما حجزت لحد ما رجعت. الفيزا اتعملت في يومين وكل حاجة كانت منظمة جداً. هحجز معاهم تاني بكل تأكيد." },
  { name: "سارة محمود", city: "الإسكندرية", avatar: "س", rating: 5, color: "from-[#d4af37] to-[#b8941f]",
    text: "أول مرة أسافر لأوروبا وكانت تجربة رائعة بسبب سبانكر. ساعدوني في كل خطوة من الحجز للفيزا. شكراً جزيلاً!" },
  { name: "محمد عمر", city: "الجيزة", avatar: "م", rating: 5, color: "from-[#2d6a4f] to-[#52b788]",
    text: "حجزت رحلة عائلية لشرم الشيخ. السعر كان منافس جداً والفندق كان أحسن من المتوقع. الدعم كان متاح في أي وقت." },
  { name: "نورهان إبراهيم", city: "المنصورة", avatar: "ن", rating: 5, color: "from-[#1b4332] to-[#0d2818]",
    text: "تعاملت مع سبانكر ٣ مرات وفي كل مرة أحسن من اللي قبلها. الفريق محترف ومتعاون ودايما بيحل أي مشكلة بسرعة." },
  { name: "كريم سامي", city: "أسيوط", avatar: "ك", rating: 5, color: "from-[#d4af37] to-[#f4d03f]",
    text: "كنت شايف إن السفر معقد وبتاع وقت. بعد تجربتي مع سبانكر اكتشفت إنه ممكن يكون سهل وممتع. النظام أونلاين سلس جداً." },
];

const REVIEWS_EN = [
  { ...REVIEWS_AR[0], name: "Ahmed Khaled", city: "Cairo",
    text: "Excellent service from the moment I booked until I returned. The visa was done in two days and everything was perfectly organized." },
  { ...REVIEWS_AR[1], name: "Sara Mahmoud", city: "Alexandria",
    text: "My first trip to Europe was amazing thanks to Spanker. They helped me with every step from booking to visa. Thank you!" },
  { ...REVIEWS_AR[2], name: "Mohamed Omar", city: "Giza",
    text: "Booked a family trip to Sharm el-Sheikh. The price was very competitive and the hotel exceeded expectations. Support was available anytime." },
  { ...REVIEWS_AR[3], name: "Norhan Ibrahim", city: "Mansoura",
    text: "I've used Spanker 3 times and each time is better than the last. The team is professional and always resolves issues quickly." },
  { ...REVIEWS_AR[4], name: "Karim Sami", city: "Assiut",
    text: "I used to think traveling was complicated and time-consuming. After my experience with Spanker I realized it can be easy and enjoyable." },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} viewBox="0 0 12 12" className="w-3.5 h-3.5 fill-brand-yellow" aria-hidden="true">
          <path d="M6 1l1.2 2.5L10 3.9l-2 2 .5 2.8L6 7.4l-2.5 1.3.5-2.8-2-2L4.8 3.5z"/>
        </svg>
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  const { locale, isRTL } = useI18n();
  const isAr = locale === "ar";
  const reviews = isAr ? REVIEWS_AR : REVIEWS_EN;
  const [active, setActive] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    intervalRef.current = setInterval(() => setActive(p => (p + 1) % reviews.length), 4500);
  };
  const stop  = () => { if (intervalRef.current) clearInterval(intervalRef.current); };

  useEffect(() => { start(); return stop; });

  return (
    <section className="section-green-dark relative py-20 md:py-28 overflow-hidden">
      {/* Big quote mark */}
      <div className="absolute top-8 start-8 text-[180px] leading-none text-white/5 font-serif select-none pointer-events-none" aria-hidden="true">"</div>

      <div className="relative max-w-5xl mx-auto px-4 lg:px-8">
        {/* Header */}
        <motion.div className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-yellow bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-yellow animate-pulse" />
            {isAr ? "آراء عملاؤنا" : "What Clients Say"}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            {isAr ? "مسافرون سعداء يحكون تجربتهم" : "Happy Travelers Share Their Stories"}
          </h2>
        </motion.div>

        {/* Active review */}
        <div className="relative min-h-[220px] mb-10" onMouseEnter={stop} onMouseLeave={start}>
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -24, scale: 0.97 }}
              transition={{ duration: 0.45 }}
              className="bg-white/5 rounded-3xl shadow-lg border border-white/15 p-8 md:p-10"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="font-bold text-white">{reviews[active].name}</p>
                  <span className="text-white/40 text-sm">·</span>
                  <p className="text-white/60 text-sm">{reviews[active].city}</p>
                  <Stars count={reviews[active].rating} />
                </div>
                <p className="text-white/75 leading-relaxed text-base md:text-lg">
                  "{reviews[active].text}"
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-3">
          {reviews.map((_, i) => (
            <button
              key={i}
              onClick={() => { stop(); setActive(i); }}
              aria-label={`Review ${i + 1}`}
            >
              <motion.div
                className="rounded-full bg-brand-yellow"
                animate={{ width: i === active ? 28 : 8, height: 8, opacity: i === active ? 1 : 0.35 }}
                transition={{ duration: 0.3 }}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
