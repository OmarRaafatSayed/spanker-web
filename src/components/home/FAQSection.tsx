"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n/context";

const FAQS_AR = [
  {
    q: "كيف أحجز رحلة مع سبانكر؟",
    a: "ادخل وجهتك وتاريخ السفر في مربع البحث، اختار الرحلة المناسبة، وأكمل الدفع. هتستلم تأكيد الحجز على إيميلك فوراً.",
  },
  {
    q: "كم يستغرق استخراج تأشيرة مصر الإلكترونية؟",
    a: "تأشيرة مصر الإلكترونية تُعتمد خلال ٢٤–٤٨ ساعة من رفع المستندات المطلوبة. نتابع طلبك خطوة بخطوة ونبلغك بأي تحديث.",
  },
  {
    q: "هل يمكنني تغيير أو إلغاء حجزي؟",
    a: "نعم، يمكنك تعديل أو إلغاء حجزك من خلال صفحة 'حجوزاتي' في حسابك. سياسة الاسترداد تعتمد على شركة الطيران وتاريخ الإلغاء.",
  },
  {
    q: "ما المستندات المطلوبة لتقديم طلب التأشيرة؟",
    a: "جواز سفر ساري، صورة شخصية، كشف حساب بنكي (٣ أشهر)، حجز فندق، وتذكرة الطيران. قد تختلف المتطلبات حسب جنسيتك والوجهة.",
  },
  {
    q: "هل خدمة الفنادق متاحة لكل الوجهات؟",
    a: "نعم، نوفر فنادق في أكثر من ٥٠٠ وجهة حول العالم. يمكنك حجز الفندق منفرداً أو ضمن باقة متكاملة تشمل الطيران والتأشيرة.",
  },
];

const FAQS_EN = [
  {
    q: "How do I book a flight with Spanker?",
    a: "Enter your destination and travel date in the search box, choose your flight, and complete payment. You'll receive a booking confirmation to your email instantly.",
  },
  {
    q: "How long does the Egypt e-Visa take?",
    a: "The Egypt e-Visa is approved within 24–48 hours of submitting the required documents. We track your application step by step and notify you of any update.",
  },
  {
    q: "Can I change or cancel my booking?",
    a: "Yes, you can modify or cancel your booking from the 'My Bookings' page in your account. The refund policy depends on the airline and cancellation date.",
  },
  {
    q: "What documents are needed for the visa application?",
    a: "A valid passport, personal photo, bank statement (3 months), hotel booking, and flight ticket. Requirements may vary by nationality and destination.",
  },
  {
    q: "Is the hotel service available for all destinations?",
    a: "Yes, we provide hotels at over 500 destinations worldwide. You can book the hotel separately or as part of a full package including flights and visa.",
  },
];

export function FAQSection() {
  const { locale } = useI18n();
  const isAr = locale === "ar";
  const faqs = isAr ? FAQS_AR : FAQS_EN;
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="section-brand py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-4 lg:px-8">

        {/* Header */}
        <motion.div className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-green bg-brand-green/8 border border-brand-green/20 rounded-full px-4 py-1.5 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-yellow animate-pulse" />
            {isAr ? "أسئلة شائعة" : "FAQ"}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-text-luxury">
            {isAr ? "كل اللي عايز تعرفه" : "Everything You Need to Know"}
          </h2>
        </motion.div>

        {/* Accordion */}
        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={i}
                className={`rounded-2xl border overflow-hidden transition-colors duration-200 ${isOpen ? "border-brand-green/40 shadow-md" : "border-[#ddd5c8]"}`}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-start bg-[#fffdf9] hover:bg-[#f8f4ef] transition-colors duration-200"
                  aria-expanded={isOpen}
                >
                  <span className="font-bold text-text-luxury text-sm md:text-base">{faq.q}</span>
                  <motion.div
                    className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-200 ${isOpen ? "bg-brand-green text-white" : "bg-brand-green/10 text-brand-green"}`}
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M8 3v10M3 8h10"/>
                    </svg>
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 pt-1 border-t border-brand-green/10 bg-[#fffdf9]">
                        <p className="text-text-secondary text-sm md:text-base leading-relaxed">{faq.a}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
