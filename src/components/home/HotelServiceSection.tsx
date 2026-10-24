"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useI18n } from "@/lib/i18n/context";
import { BadgeDollarSign, Zap, Star, PackageCheck, ArrowRight, ArrowLeft } from "lucide-react";
import { BRAND_COLORS } from "@/lib/brand/colors";
import { cn } from "@/lib/utils";

interface FeaturePill {
  Icon: React.FC<{ size?: number; strokeWidth?: number; color?: string }>;
  labelAr: string; labelEn: string;
}

const PILLS: FeaturePill[] = [
  { Icon: BadgeDollarSign, labelAr: "أفضل الأسعار مضمونة",  labelEn: "Best Price Guaranteed" },
  { Icon: Zap,             labelAr: "حجز فوري ٢٤/٧",        labelEn: "Instant Booking 24/7"  },
  { Icon: Star,            labelAr: "فنادق مُختارة بعناية", labelEn: "Handpicked Hotels"     },
  { Icon: PackageCheck,    labelAr: "باقات متكاملة",         labelEn: "Full Packages"         },
];

const STACKED_HOTELS = [
  { src: "/images/hotels/cairo-international.jpg", alt: "Cairo hotel",  rotate: "-rotate-3", position: "absolute top-0 start-0 w-[85%] h-[55%]"   },
  { src: "/images/hotels/luxor-temple.jpg",         alt: "Luxor hotel",  rotate: "rotate-2",  position: "absolute top-[22%] end-0 w-[75%] h-[50%]"  },
  { src: "/images/hotels/sharm-resort.jpg",         alt: "Sharm resort", rotate: "",          position: "absolute bottom-0 start-[8%] w-[80%] h-[55%]", featured: true },
];

export function HotelServiceSection() {
  const { locale, isRTL } = useI18n();
  const isAr = locale === "ar";
  const imgRef = useRef<HTMLDivElement>(null);
  const imgInView = useInView(imgRef, { once: true });

  return (
    <section className="relative py-20 md:py-28 overflow-hidden" style={{
      background: "#FBFDFD",
      backgroundImage: "radial-gradient(circle, rgba(61,104,51,0.12) 1.5px, transparent 1.5px)",
      backgroundSize: "22px 22px",
    }}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" aria-hidden="true" />

      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">

          {/* Image cluster */}
          <motion.div
            ref={imgRef}
            className={cn("hidden lg:block relative h-[420px]", isRTL ? "order-2" : "order-1")}
            initial={{ opacity: 0, x: isRTL ? 40 : -40 }}
            animate={imgInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            {STACKED_HOTELS.map((hotel, i) => (
              <motion.div
                key={hotel.src}
                className={cn(hotel.position, hotel.rotate, "rounded-2xl overflow-hidden shadow-xl border border-gray-100")}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={imgInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.6, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
              >
                <Image src={hotel.src} alt={hotel.alt} fill className="object-cover" sizes="(max-width: 1024px) 0px, 360px" />
                {hotel.featured && (
                  <div className="absolute bottom-3 end-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl shadow-lg bg-white border border-gray-100">
                    <Star size={13} fill={BRAND_COLORS.green} color={BRAND_COLORS.green} />
                    <span className="text-xs font-black" style={{ color: "#1a2e1a" }}>4.9</span>
                  </div>
                )}
              </motion.div>
            ))}

            {/* Hotel count badge */}
            <motion.div
              className="absolute top-4 end-4 flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-lg bg-white border border-gray-100"
              initial={{ opacity: 0, y: -12 }}
              animate={imgInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.7 }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${BRAND_COLORS.green}12` }}>
                <PackageCheck size={16} color={BRAND_COLORS.green} strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-base font-black leading-none" style={{ color: "#1a2e1a" }}>500+</p>
                <p className="text-[10px] mt-0.5" style={{ color: "#9ca3af" }}>{isAr ? "فندق متاح" : "Hotels Available"}</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Copy side */}
          <div className={isRTL ? "order-1" : "order-2"}>
            <motion.span
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] rounded-full px-4 py-1.5 mb-5 border"
              style={{ color: BRAND_COLORS.green, borderColor: `${BRAND_COLORS.green}30`, background: `${BRAND_COLORS.green}08` }}
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: BRAND_COLORS.green }} />
              {isAr ? "خدمة الفنادق" : "Hotel Service"}
            </motion.span>

            <motion.h2 className="text-3xl md:text-5xl font-black leading-[1.08] mb-5"
              style={{ color: "#1a2e1a" }}
              initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.1 }}>
              {isAr
                ? <><span style={{ color: BRAND_COLORS.green }}>الفندق المثالي</span><br />ينتظرك في كل وجهة</>
                : <><span style={{ color: BRAND_COLORS.green }}>Your Perfect Hotel</span><br />Awaits at Every Destination</>
              }
            </motion.h2>

            <motion.p className="text-base leading-relaxed mb-8 max-w-md" style={{ color: "#6b7c6b" }}
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}>
              {isAr
                ? "من الغرفة الاقتصادية للجناح الفاخر — احجز فندقك مع تذكرة الطيران وتأشيرة السفر في خطوة واحدة."
                : "From budget rooms to luxury suites — book your hotel with your flight ticket and visa in one step."
              }
            </motion.p>

            {/* Feature pills */}
            <motion.div className="flex flex-wrap gap-2 mb-10"
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}>
              {PILLS.map(({ Icon, labelAr, labelEn }) => (
                <div key={labelEn}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm hover:border-brand-green/50 hover:bg-brand-green/5 transition-all duration-200 cursor-default"
                  style={{ borderColor: "#e5e7eb", background: "#fff", color: "#374151" }}>
                  <Icon size={14} strokeWidth={1.75} color={BRAND_COLORS.green} />
                  {isAr ? labelAr : labelEn}
                </div>
              ))}
            </motion.div>

            {/* CTA */}
            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.45 }}>
              <Link href={`/${locale}/hotel-booking`}
                className="group inline-flex items-center gap-3 font-bold text-base px-8 py-4 rounded-xl shadow-lg text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
                style={{ background: BRAND_COLORS.green, boxShadow: `0 8px 24px ${BRAND_COLORS.green}35` }}>
                {isAr ? "احجز فندقك الآن" : "Book Your Hotel Now"}
                {isRTL
                  ? <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                  : <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                }
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
