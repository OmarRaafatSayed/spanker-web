"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n/context";
import { Quote, Star } from "lucide-react";
import { BRAND_COLORS } from "@/lib/brand/colors";

const REVIEWS_AR = [
  { name: "أحمد خالد",      city: "القاهرة",    initial: "أ", rating: 5, color: BRAND_COLORS.green,
    text: "خدمة ممتازة من أول ما حجزت لحد ما رجعت. الفيزا اتعملت في يومين وكل حاجة كانت منظمة جداً. هحجز معاهم تاني بكل تأكيد." },
  { name: "سارة محمود",     city: "الإسكندرية", initial: "س", rating: 5, color: "#2d6a4f",
    text: "أول مرة أسافر لأوروبا وكانت تجربة رائعة بسبب سبانكر. ساعدوني في كل خطوة من الحجز للفيزا. شكراً جزيلاً!" },
  { name: "محمد عمر",       city: "الجيزة",     initial: "م", rating: 5, color: BRAND_COLORS.blue,
    text: "حجزت رحلة عائلية لشرم الشيخ. السعر كان منافس جداً والفندق كان أحسن من المتوقع. الدعم كان متاح في أي وقت." },
  { name: "نورهان إبراهيم", city: "المنصورة",   initial: "ن", rating: 5, color: BRAND_COLORS.green,
    text: "تعاملت مع سبانكر ٣ مرات وفي كل مرة أحسن من اللي قبلها. الفريق محترف ومتعاون ودايما بيحل أي مشكلة بسرعة." },
  { name: "كريم سامي",      city: "أسيوط",      initial: "ك", rating: 5, color: "#2d6a4f",
    text: "كنت شايف إن السفر معقد وبتاع وقت. بعد تجربتي مع سبانكر اكتشفت إنه ممكن يكون سهل وممتع. النظام أونلاين سلس جداً." },
];

const REVIEWS_EN = [
  { ...REVIEWS_AR[0], name: "Ahmed Khaled",   city: "Cairo",
    text: "Excellent service from the moment I booked until I returned. The visa was done in two days and everything was perfectly organized." },
  { ...REVIEWS_AR[1], name: "Sara Mahmoud",   city: "Alexandria",
    text: "My first trip to Europe was amazing thanks to Spanker. They helped me with every step from booking to visa. Thank you!" },
  { ...REVIEWS_AR[2], name: "Mohamed Omar",   city: "Giza",
    text: "Booked a family trip to Sharm el-Sheikh. The price was very competitive and the hotel exceeded expectations. Support was available anytime." },
  { ...REVIEWS_AR[3], name: "Norhan Ibrahim", city: "Mansoura",
    text: "I've used Spanker 3 times and each time is better than the last. The team is professional and always resolves issues quickly." },
  { ...REVIEWS_AR[4], name: "Karim Sami",     city: "Assiut",
    text: "I used to think traveling was complicated. After my experience with Spanker I realized it can be easy and enjoyable." },
];

const reviewVariants = {
  enter:  { opacity: 0, y: 20, filter: "blur(4px)" },
  center: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
  exit:   { opacity: 0, y: -16, filter: "blur(4px)", transition: { duration: 0.28, ease: "easeIn" as const } },
};

function StarRow({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${count} stars`}>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={14} fill={BRAND_COLORS.green} color={BRAND_COLORS.green} />
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  const { locale } = useI18n();
  const isAr = locale === "ar";
  const reviews = isAr ? REVIEWS_AR : REVIEWS_EN;
  const [selected, setSelected] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => { timerRef.current = setInterval(() => setSelected((p) => (p + 1) % reviews.length), 5000); };
  const stopTimer  = () => { if (timerRef.current) clearInterval(timerRef.current); };
  useEffect(() => { startTimer(); return stopTimer; });

  const review = reviews[selected];

  return (
    <section className="relative py-10 md:py-14 overflow-hidden" style={{
      background: "#f4f7f4",
      backgroundImage: "radial-gradient(circle, rgba(61,104,51,0.12) 1.5px, transparent 1.5px)",
      backgroundSize: "22px 22px",
    }}>
      {/* Giant faint quote */}
      <Quote size={360} className="absolute top-0 start-0 pointer-events-none select-none"
        style={{ color: `${BRAND_COLORS.green}06` }} aria-hidden="true" />

      <div className="relative max-w-4xl mx-auto px-4 lg:px-8">
        {/* Header */}
        <motion.div className="text-center mb-8"
          initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] rounded-full px-4 py-1.5 mb-4 border"
            style={{ color: BRAND_COLORS.green, borderColor: `${BRAND_COLORS.green}30`, background: `${BRAND_COLORS.green}08` }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: BRAND_COLORS.green }} />
            {isAr ? "آراء عملاؤنا" : "What Clients Say"}
          </span>
          <h2 className="text-3xl md:text-5xl font-black" style={{ color: "#1a2e1a" }}>
            {isAr ? "مسافرون سعداء" : "Happy Travelers"}
          </h2>
        </motion.div>

        {/* Review area */}
        <div className="relative min-h-[180px] mb-8" onMouseEnter={stopTimer} onMouseLeave={startTimer}>
          <AnimatePresence mode="wait">
            <motion.div key={selected} variants={reviewVariants} initial="enter" animate="center" exit="exit" className="text-center">
              <Quote size={28} className="mx-auto mb-4" style={{ color: `${BRAND_COLORS.green}40` }} aria-hidden="true" />

              <p className="text-lg sm:text-xl md:text-2xl leading-relaxed font-light italic mb-7 max-w-3xl mx-auto" style={{ color: "#2d3a2d" }}>
                "{review.text}"
              </p>

              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-black shadow-md"
                  style={{ background: `linear-gradient(135deg, ${review.color}, ${review.color}cc)` }}
                  aria-hidden="true">
                  {review.initial}
                </div>
                <p className="font-bold text-base" style={{ color: "#1a2e1a" }}>{review.name}</p>
                <p className="text-sm" style={{ color: "#9ca3af" }}>{review.city}</p>
                <StarRow count={review.rating} />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Avatar navigation */}
        <div className="flex items-center justify-center gap-3">
          {reviews.map((r, i) => (
            <button key={r.name} onClick={() => { stopTimer(); setSelected(i); }} aria-label={r.name}
              className="rounded-full transition-all duration-300 cursor-pointer hover:opacity-80"
              style={{
                width: selected === i ? "2.75rem" : "2.25rem",
                height: selected === i ? "2.75rem" : "2.25rem",
                opacity: selected === i ? 1 : 0.35,
                background: `linear-gradient(135deg, ${r.color}, ${r.color}cc)`,
                outline: selected === i ? `2px solid ${BRAND_COLORS.green}` : "none",
                outlineOffset: "2px",
              }}>
              <span className="flex items-center justify-center h-full text-white font-bold text-xs">{r.initial}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
