"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n/context";
import { HelpCircle, Plus, Minus, MessageCircle } from "lucide-react";
import { BRAND_COLORS } from "@/lib/brand/colors";
import Link from "next/link";

const FAQS_AR = [
  { q: "كيف أحجز رحلة مع سبانكر؟",           a: "ادخل وجهتك وتاريخ السفر في مربع البحث، اختار الرحلة المناسبة، وأكمل الدفع. هتستلم تأكيد الحجز على إيميلك فوراً." },
  { q: "كم يستغرق استخراج تأشيرة مصر؟",      a: "تأشيرة مصر الإلكترونية تُعتمد خلال ٢٤–٤٨ ساعة من رفع المستندات المطلوبة. نتابع طلبك خطوة بخطوة ونبلغك بأي تحديث." },
  { q: "هل يمكنني تغيير أو إلغاء حجزي؟",     a: "نعم، يمكنك تعديل أو إلغاء حجزك من خلال صفحة 'حجوزاتي' في حسابك. سياسة الاسترداد تعتمد على شركة الطيران وتاريخ الإلغاء." },
  { q: "ما المستندات المطلوبة للتأشيرة؟",      a: "جواز سفر ساري، صورة شخصية، كشف حساب بنكي (٣ أشهر)، حجز فندق، وتذكرة الطيران. قد تختلف المتطلبات حسب جنسيتك والوجهة." },
  { q: "هل خدمة الفنادق متاحة لكل الوجهات؟",  a: "نعم، نوفر فنادق في أكثر من ٥٠٠ وجهة حول العالم. يمكنك حجز الفندق منفرداً أو ضمن باقة متكاملة تشمل الطيران والتأشيرة." },
];

const FAQS_EN = [
  { q: "How do I book a flight with Spanker?",       a: "Enter your destination and travel date in the search box, choose your flight, and complete payment. You'll receive a booking confirmation instantly." },
  { q: "How long does the Egypt e-Visa take?",       a: "The Egypt e-Visa is approved within 24–48 hours of submitting the required documents. We track your application and notify you of any update." },
  { q: "Can I change or cancel my booking?",         a: "Yes, you can modify or cancel your booking from the 'My Bookings' page in your account. The refund policy depends on the airline and cancellation date." },
  { q: "What documents are needed for the visa?",    a: "A valid passport, personal photo, bank statement (3 months), hotel booking, and flight ticket. Requirements may vary by nationality and destination." },
  { q: "Is the hotel service available everywhere?", a: "Yes, we provide hotels at over 500 destinations worldwide. You can book the hotel separately or as part of a full package including flights and visa." },
];

export function FAQSection() {
  const { locale, isRTL } = useI18n();
  const isAr = locale === "ar";
  const faqs = isAr ? FAQS_AR : FAQS_EN;
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-20 md:py-28" style={{
      background: "#FBFDFD",
      backgroundImage: "radial-gradient(circle, rgba(61,104,51,0.12) 1.5px, transparent 1.5px)",
      backgroundSize: "22px 22px",
    }}>
      <div className="max-w-3xl mx-auto px-4 lg:px-8">

        {/* Header */}
        <motion.div className="text-center mb-14"
          initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
            style={{ background: `${BRAND_COLORS.green}12`, border: `1px solid ${BRAND_COLORS.green}25` }}>
            <HelpCircle size={26} strokeWidth={1.5} color={BRAND_COLORS.green} />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.25em] mb-3" style={{ color: BRAND_COLORS.green }}>
            {isAr ? "أسئلة شائعة" : "FAQ"}
          </p>
          <h2 className="text-3xl md:text-5xl font-black leading-tight" style={{ color: "#1a2e1a" }}>
            {isAr ? "كل اللي عايز تعرفه" : "Everything You Need to Know"}
          </h2>
        </motion.div>

        {/* Accordion */}
        <div className="space-y-2">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <motion.div key={i}
                className="rounded-xl overflow-hidden border transition-all duration-200"
                style={{ borderColor: isOpen ? `${BRAND_COLORS.green}40` : "#e5e7eb", background: "#fff" }}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>

                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-start transition-colors duration-150"
                  style={{ background: isOpen ? `${BRAND_COLORS.green}05` : "transparent" }}
                  aria-expanded={isOpen}>
                  <span className="font-semibold text-sm md:text-base leading-snug" style={{ color: "#1a2e1a" }}>{faq.q}</span>
                  <span className="shrink-0" style={{ color: BRAND_COLORS.green }}>
                    {isOpen ? <Minus size={16} strokeWidth={2.5} /> : <Plus size={16} strokeWidth={2.5} />}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden">
                      <div className="flex gap-4 px-5 pb-5 pt-1" style={{ borderTop: `1px solid ${BRAND_COLORS.green}15`, background: `${BRAND_COLORS.green}03` }}>
                        <div className="w-0.5 rounded-full shrink-0 self-stretch"
                          style={{ background: `linear-gradient(to bottom, ${BRAND_COLORS.green}, transparent)` }} aria-hidden="true" />
                        <p className="text-sm md:text-base leading-relaxed" style={{ color: "#6b7c6b" }}>{faq.a}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* CTA card */}
        <motion.div className="mt-10 rounded-2xl border border-gray-100 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white shadow-sm"
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${BRAND_COLORS.green}12` }}>
              <MessageCircle size={20} strokeWidth={1.5} color={BRAND_COLORS.green} />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: "#1a2e1a" }}>
                {isAr ? "لديك سؤال آخر؟" : "Still have questions?"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>
                {isAr ? "فريقنا جاهز للمساعدة في أي وقت" : "Our team is ready to help you anytime."}
              </p>
            </div>
          </div>
          <Link href="/en-eg/faqs"
            className="shrink-0 text-sm font-bold px-5 py-2.5 rounded-xl text-white transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-95"
            style={{ background: BRAND_COLORS.green }}>
            {isAr ? "تواصل معنا" : "Contact us"}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
