"use client";

import { Plane, Star, Shield, Clock } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { BRAND_COLORS } from "@/lib/brand/colors";

interface Item {
  iconEn: React.ReactNode;
  textEn: string;
  textAr: string;
}

const ITEMS: Item[] = [
  {
    iconEn: <Plane size={12} strokeWidth={2.5} aria-hidden="true" />,
    textEn: "Lowest fares guaranteed",
    textAr: "أقل الأسعار مضمونة",
  },
  {
    iconEn: <Shield size={12} strokeWidth={2.5} aria-hidden="true" />,
    textEn: "No hidden fees",
    textAr: "بدون رسوم خفية",
  },
  {
    iconEn: <Star size={12} strokeWidth={2.5} aria-hidden="true" />,
    textEn: "200+ destinations",
    textAr: "أكثر من 200 وجهة",
  },
  {
    iconEn: <Clock size={12} strokeWidth={2.5} aria-hidden="true" />,
    textEn: "24/7 customer support",
    textAr: "دعم على مدار الساعة",
  },
  {
    iconEn: <Plane size={12} strokeWidth={2.5} aria-hidden="true" />,
    textEn: "Instant booking confirmation",
    textAr: "تأكيد فوري للحجز",
  },
  {
    iconEn: <Shield size={12} strokeWidth={2.5} aria-hidden="true" />,
    textEn: "Secure payment",
    textAr: "دفع آمن ومضمون",
  },
];

// Duplicate for seamless loop
const TRACK = [...ITEMS, ...ITEMS];

export function SprayBar() {
  const { locale } = useI18n();
  const isAr = locale === "ar";

  return (
    <div
      className="w-full overflow-hidden py-2.5 spray-bar-root"
      style={{
        background: "rgba(0,0,0,0.38)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        borderTop: "1px solid rgba(255,255,255,0.10)",
        borderBottom: "1px solid rgba(255,255,255,0.10)",
      }}
      aria-label={isAr ? "شريط إعلانات" : "Announcement bar"}
      role="marquee"
    >
      {/* Fade masks — left and right edges */}
      <div
        className="absolute inset-y-0 start-0 w-16 z-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,0.40) 0%, transparent 100%)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-y-0 end-0 w-16 z-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(to left, rgba(0,0,0,0.40) 0%, transparent 100%)",
        }}
        aria-hidden="true"
      />

      {/* Scrolling track */}
      <div
        className={
          isAr ? "spray-track-rtl flex items-center gap-0" : "spray-track flex items-center gap-0"
        }
        aria-hidden="true"
      >
        {TRACK.map((item, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-2 px-6 whitespace-nowrap text-xs font-semibold text-white/90 shrink-0"
          >
            <span
              className="shrink-0"
              style={{ color: BRAND_COLORS.yellow, opacity: 0.9 }}
            >
              {item.iconEn}
            </span>
            <span>{isAr ? item.textAr : item.textEn}</span>
            {/* Separator dot */}
            <span
              className="w-1 h-1 rounded-full ms-4 shrink-0"
              style={{ background: `${BRAND_COLORS.yellow}80` }}
            />
          </span>
        ))}
      </div>

      <style>{`
        .spray-bar-root { position: relative; }

        @keyframes spray-scroll-ltr {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes spray-scroll-rtl {
          from { transform: translateX(0); }
          to   { transform: translateX(50%); }
        }

        .spray-track {
          display: inline-flex;
          animation: spray-scroll-ltr 18s linear infinite;
          will-change: transform;
        }
        .spray-track-rtl {
          display: inline-flex;
          animation: spray-scroll-rtl 18s linear infinite;
          will-change: transform;
        }

        .spray-bar-root:hover .spray-track,
        .spray-bar-root:hover .spray-track-rtl {
          animation-play-state: paused;
        }

        @media (prefers-reduced-motion: reduce) {
          .spray-track,
          .spray-track-rtl {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
