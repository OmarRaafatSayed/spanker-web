"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { BRAND_COLORS } from "@/lib/brand/colors";
import { cn } from "@/lib/utils";
import {
  Users, UserRound, Heart, Users2,
  MapPin, Calendar, Wallet, Tag,
  Star, Hotel, UtensilsCrossed, CheckCircle2,
  Plane, BedDouble, Download, RotateCcw,
  ChevronLeft, ChevronRight, Sparkles,
  Sun, Coffee, Moon,
} from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type GroupType  = "solo" | "couple" | "family" | "group";
type BudgetTier = "budget" | "standard" | "comfort" | "luxury";
type MealPref   = "bed_only" | "breakfast" | "all_inclusive";
type HotelPref  = "hostel" | "budget" | "midrange" | "luxury";

type DestinationId =
  | "cairo" | "luxor" | "aswan" | "hurghada"
  | "sharm" | "marsa_alam" | "alexandria" | "dahab";

interface TripSelections {
  groupType:    GroupType;
  adults:       number;
  children:     number;
  destinations: DestinationId[];
  days:         number;
  flexible:     boolean;
  startDate:    string;
  budgetTier:   BudgetTier;
  interests:    string[];
  hotelPref:    HotelPref;
  mealPref:     MealPref;
}

interface DayPlan {
  day:       number;
  dest:      DestinationId;
  morning:   string;
  afternoon: string;
  evening:   string;
  hotel:     string;
  hotelStars: number;
}

interface TripPlan {
  days:          DayPlan[];
  flightCost:    number;
  hotelCost:     number;
  activitiesCost:number;
  totalCost:     number;
}

// ─────────────────────────────────────────────
// Static data
// ─────────────────────────────────────────────
const DEST_META: Record<DestinationId, { ar: string; en: string; tagAr: string; tagEn: string; img: string }> = {
  cairo:      { ar: "القاهرة",     en: "Cairo",           tagAr: "الأهرامات والتاريخ",   tagEn: "Pyramids & History",    img: "/images/offers/hurghada.jpg"   },
  luxor:      { ar: "الأقصر",      en: "Luxor",           tagAr: "وادي الملوك",           tagEn: "Valley of the Kings",   img: "/images/offers/luxor.jpg"      },
  aswan:      { ar: "أسوان",       en: "Aswan",           tagAr: "أبو سمبل والنيل",      tagEn: "Abu Simbel & Nile",     img: "/images/offers/aswan.jpg"      },
  hurghada:   { ar: "الغردقة",     en: "Hurghada",        tagAr: "شعاب مرجانية وغوص",   tagEn: "Coral Reefs & Diving",  img: "/images/offers/hurghada.jpg"   },
  sharm:      { ar: "شرم الشيخ",   en: "Sharm el-Sheikh", tagAr: "سياحة شاطئية",         tagEn: "Beach & Sea",           img: "/images/offers/sharm.jpg"      },
  marsa_alam: { ar: "مرسى علم",    en: "Marsa Alam",      tagAr: "غوص متقدم",             tagEn: "Advanced Diving",       img: "/images/offers/marsa-alam.jpg" },
  alexandria: { ar: "الإسكندرية",  en: "Alexandria",      tagAr: "التاريخ والبحر المتوسط", tagEn: "History & Med Sea",   img: "/images/offers/alexandria.jpg" },
  dahab:      { ar: "دهب",         en: "Dahab",           tagAr: "استرخاء وغوص",          tagEn: "Relaxation & Diving",   img: "/images/offers/sharm.jpg"      },
};

const ACTIVITIES: Record<DestinationId, string[]> = {
  cairo:      ["Pyramids of Giza & Sphinx",  "Egyptian Museum",         "Khan el-Khalili Bazaar",   "Citadel of Saladin",         "Al-Azhar Mosque",          "Coptic Cairo",        "City Stars Shopping",  "Nile Dinner Cruise"],
  luxor:      ["Karnak Temple Complex",      "Valley of the Kings",     "Luxor Temple at night",    "Hatshepsut Temple",          "Hot Air Balloon Ride",     "Colossi of Memnon",   "Luxor Museum",         "Felucca on the Nile"],
  aswan:      ["Abu Simbel Temples",         "Philae Temple",           "Nubian Village Tour",      "Felucca Ride at sunset",     "High Dam visit",           "Elephantine Island",  "Aswan Market",         "Unfinished Obelisk"],
  hurghada:   ["Snorkeling at Giftun Island","Orange Bay Beach",        "Desert Safari & Quad",     "Mahmya Island Trip",         "Aquarium visit",           "Old Suk Market",      "Underwater Submarine", "Paragliding"],
  sharm:      ["Ras Mohammed National Park", "Naama Bay Promenade",     "Blue Hole Dahab day trip", "Tiran Island Snorkeling",    "St. Catherine Monastery",  "SoHo Square",         "Old Market",           "Shark's Bay"],
  marsa_alam: ["Elphinstone Reef Diving",    "Dugong Sighting Tour",    "Marsa Mubarak Beach",      "Port Ghalib Marina",         "Wadi El Gemal Reserve",    "Samadai Reef",        "Hamata Islands",       "Night Diving"],
  alexandria: ["Bibliotheca Alexandrina",    "Qaitbay Citadel",         "Stanley Bridge & Beach",   "Catacombs of Kom el Shoqafa","Montaza Palace Gardens",   "Anfushi Fish Market", "El-Alamein day trip",  "Mediterranean Corniche"],
  dahab:      ["Blue Hole Snorkeling",       "Canyon Dive",             "Camel & Bedouin Safari",   "Bedouin Dinner in desert",   "Windsurfing Lagoon",       "Nabq National Park",  "Mashraba Promenade",   "Mount Sinai Sunrise"],
};

const ACTIVITIES_AR: Record<DestinationId, string[]> = {
  cairo:      ["أهرامات الجيزة والأبو الهول","المتحف المصري",           "خان الخليلي",              "قلعة صلاح الدين",            "مسجد الأزهر",             "مصر القديمة",         "سيتي ستارز",          "عشاء على النيل"],
  luxor:      ["معبد الكرنك",               "وادي الملوك",              "معبد الأقصر ليلاً",        "معبد حتشبسوت",               "رحلة البالون الطائر",     "تمثالا ممنون",        "متحف الأقصر",          "فلوكة على النيل"],
  aswan:      ["معابد أبو سمبل",           "معبد فيلة",                 "جولة القرية النوبية",      "رحلة فلوكة عند الغروب",     "زيارة السد العالي",       "جزيرة الفنتين",       "سوق أسوان",           "المسلة الناقصة"],
  hurghada:   ["غطس في جزيرة جفتون",       "شاطئ أورانج باي",          "سفاري صحراوي ورباعي",     "رحلة محمية ماهمية",          "زيارة الأكواريوم",        "سوق أسواق القديم",    "الغواصة تحت الماء",    "باراجلايدينج"],
  sharm:      ["محمية رأس محمد",            "كورنيش نعمة باي",          "رحلة البلو هول بدهب",     "جزيرة تيران للغطس",          "دير سانت كاترين",        "سوهو سكوير",          "السوق القديم",         "شاطئ شارك باي"],
  marsa_alam: ["غطس شعاب إلفينستون",       "رحلة مشاهدة أبقار البحر",  "شاطئ مرسى مبارك",         "مارينا بورت غالب",          "محمية وادي الجمال",       "شعاب سمدي",           "جزر حماطة",           "الغطس الليلي"],
  alexandria: ["مكتبة الإسكندرية",         "قلعة قايتباي",              "كوبري ستانلي والشاطئ",    "مقابر كوم الشقافة",          "حدائق قصر المنتزه",       "سوق أنفوشي للسمك",    "جولة العلمين",        "كورنيش البحر المتوسط"],
  dahab:      ["غطس البلو هول",            "غطس الكانيون",              "سفاري جمال وبدو",          "عشاء بدوي في الصحراء",       "ركوب الأمواج بالشراع",   "محمية نبق الوطنية",   "كورنيش مشرابة",       "شروق الشمس على جبل موسى"],
};

const HOTELS: Record<DestinationId, Record<BudgetTier, string>> = {
  cairo:      { budget: "Cosmopolitan Hotel Cairo",    standard: "Cairo Marriott Hotel",        comfort: "Kempinski Nile Hotel",         luxury: "Four Seasons Nile Plaza"          },
  luxor:      { budget: "Marsam Hotel Luxor",          standard: "Sofitel Winter Palace",        comfort: "Hilton Luxor Resort & Spa",    luxury: "Al Moudira Hotel"                 },
  aswan:      { budget: "Nuba Nile Hotel",             standard: "Mövenpick Resort Aswan",       comfort: "Basma Hotel Aswan",            luxury: "Anantara Kerzner"                 },
  hurghada:   { budget: "Seagull Beach Resort",        standard: "Mercure Hurghada",             comfort: "Steigenberger Pure Lifestyle",  luxury: "Oberoi Sahl Hasheesh"             },
  sharm:      { budget: "Falcon Hills Hotel",          standard: "Hilton Sharm Dreams Resort",   comfort: "Rixos Premium Seagate",        luxury: "Four Seasons Sharm el-Sheikh"     },
  marsa_alam: { budget: "Red Sea Diving Safari",       standard: "Concorde Moreen Beach",        comfort: "Shams Alam Beach Resort",     luxury: "Braika Bay Resort"                },
  alexandria: { budget: "Egypt Hotel Alexandria",      standard: "Helnan Palestine Hotel",       comfort: "Sheraton Montazah Hotel",      luxury: "Four Seasons San Stefano"         },
  dahab:      { budget: "Bishbishi Garden Village",    standard: "Dahab Paradise Resort",        comfort: "Laguna Vista Beach Resort",   luxury: "Nesima Resort Dahab"              },
};

const HOTELS_AR: Record<DestinationId, Record<BudgetTier, string>> = {
  cairo:      { budget: "فندق كوزموبوليتان",      standard: "ماريوت القاهرة",              comfort: "كمبينسكي نايل",               luxury: "فور سيزونز نايل بلازا"           },
  luxor:      { budget: "فندق مرسام الأقصر",       standard: "سوفيتيل ونتر بالاس",          comfort: "هيلتون الأقصر ريزورت",        luxury: "فندق المديرة"                    },
  aswan:      { budget: "فندق نوبا للنيل",         standard: "موفنبيك أسوان",               comfort: "فندق باسما أسوان",            luxury: "أنانتارا كرزنر"                  },
  hurghada:   { budget: "سيجال بيتش ريزورت",       standard: "ميركيور الغردقة",              comfort: "شتايجنبرجر بيور لايف ستايل",  luxury: "أوبيروي سهل حشيش"               },
  sharm:      { budget: "فالكون هيلز هوتيل",       standard: "هيلتون شرم دريمز",            comfort: "ريكسوس بريميوم",              luxury: "فور سيزونز شرم الشيخ"            },
  marsa_alam: { budget: "ريد سي دايفينج سفاري",    standard: "كونكورد موريان بيتش",          comfort: "شمس علم بيتش ريزورت",        luxury: "بريكا باي ريزورت"               },
  alexandria: { budget: "فندق مصر الإسكندرية",     standard: "هلنان فلسطين",                comfort: "شيراتون المنتزه",             luxury: "فور سيزونز سان ستيفانو"          },
  dahab:      { budget: "بيشبيشي جاردن فيليدج",    standard: "دهب برادايس ريزورت",          comfort: "لاجونا فيستا بيتش",          luxury: "نسيما ريزورت دهب"               },
};

const HOTEL_STARS: Record<BudgetTier, number> = { budget: 3, standard: 4, comfort: 5, luxury: 5 };

const HOTEL_COST_PER_NIGHT: Record<BudgetTier, number> = {
  budget:   800,
  standard: 2000,
  comfort:  4500,
  luxury:   9000,
};
const ACTIVITY_COST_PER_DAY: Record<BudgetTier, number> = {
  budget:   200,
  standard: 500,
  comfort:  1000,
  luxury:   2000,
};
const FLIGHT_COST_BASE: Record<BudgetTier, number> = {
  budget:   2500,
  standard: 4500,
  comfort:  8000,
  luxury:   18000,
};

const INTERESTS = [
  { id: "history",   icon: "🏛",  ar: "التاريخ والحضارة", en: "History & Pharaohs"  },
  { id: "beach",     icon: "🌊",  ar: "شاطئ وغطس",        en: "Beach & Diving"      },
  { id: "food",      icon: "🍽",  ar: "طعام وثقافة",       en: "Food & Culture"      },
  { id: "relax",     icon: "🧘",  ar: "استرخاء وراحة",     en: "Relaxation"          },
  { id: "adventure", icon: "🏕",  ar: "مغامرة وتجوال",     en: "Adventure"           },
  { id: "shopping",  icon: "🛍",  ar: "تسوق",              en: "Shopping"            },
  { id: "desert",    icon: "🐪",  ar: "سفاري صحراوي",      en: "Desert Safari"       },
  { id: "nile",      icon: "⛵",  ar: "رحلات النيل",       en: "Nile Cruises"        },
];

// ─────────────────────────────────────────────
// Generate itinerary (pure, deterministic)
// ─────────────────────────────────────────────
function generateItinerary(sel: TripSelections): TripPlan {
  const { destinations, days, adults, children, budgetTier } = sel;
  const n = destinations.length || 1;
  const baseDays = Math.floor(days / n);
  const remainder = days - baseDays * n;

  const dayPlans: DayPlan[] = [];
  let dayNumber = 1;

  destinations.forEach((dest, di) => {
    const daysHere = baseDays + (di === 0 ? remainder : 0);
    const acts = ACTIVITIES[dest];

    for (let d = 0; d < daysHere; d++) {
      dayPlans.push({
        day:       dayNumber++,
        dest,
        morning:   acts[(d * 3)     % acts.length],
        afternoon: acts[(d * 3 + 1) % acts.length],
        evening:   acts[(d * 3 + 2) % acts.length],
        hotel:     HOTELS[dest][budgetTier],
        hotelStars: HOTEL_STARS[budgetTier],
      });
    }
  });

  const flightCost = (FLIGHT_COST_BASE[budgetTier] * adults) +
                     (FLIGHT_COST_BASE[budgetTier] * 0.75 * children);
  const hotelCost      = HOTEL_COST_PER_NIGHT[budgetTier] * days;
  const activitiesCost = ACTIVITY_COST_PER_DAY[budgetTier] * days * adults;
  const totalCost      = flightCost + hotelCost + activitiesCost;

  return { days: dayPlans, flightCost, hotelCost, activitiesCost, totalCost };
}

// ─────────────────────────────────────────────
// Small UI helpers
// ─────────────────────────────────────────────
const G = BRAND_COLORS.green;
const Y = BRAND_COLORS.yellow;

function OptionCard({
  selected, onClick, children, className,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-4 cursor-pointer transition-all duration-200 text-center",
        selected
          ? "border-brand-green bg-green-50/50 shadow-md"
          : "border-gray-200 bg-white hover:border-brand-green/40 hover:bg-green-50/20 shadow-sm",
        className,
      )}
    >
      {children}
    </button>
  );
}

function StepHeader({ step, total, isAr }: { step: number; total: number; isAr: boolean }) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          {isAr ? `خطوة ${step} من ${total}` : `Step ${step} of ${total}`}
        </span>
        <span className="text-xs font-bold" style={{ color: G }}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: G }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
const TOTAL_STEPS = 7;

export default function AiTripPlannerPage() {
  const { locale, isRTL } = useI18n();
  const isAr = locale === "ar";
  const router = useRouter();

  const [step, setStep]           = useState(1);
  const [direction, setDirection] = useState(1);
  const [plan, setPlan]           = useState<TripPlan | null>(null);

  const [sel, setSel] = useState<TripSelections>({
    groupType:    "solo",
    adults:       1,
    children:     0,
    destinations: [],
    days:         7,
    flexible:     true,
    startDate:    "",
    budgetTier:   "standard",
    interests:    [],
    hotelPref:    "midrange",
    mealPref:     "breakfast",
  });

  function update<K extends keyof TripSelections>(k: K, v: TripSelections[K]) {
    setSel(s => ({ ...s, [k]: v }));
  }

  function goNext() {
    if (step === 6) {
      const generated = generateItinerary(sel);
      setPlan(generated);
    }
    setDirection(1);
    setStep(s => Math.min(s + 1, TOTAL_STEPS));
  }

  function goBack() {
    setDirection(-1);
    setStep(s => Math.max(s - 1, 1));
  }

  const canAdvance = (() => {
    if (step === 2) return sel.destinations.length > 0;
    return true;
  })();

  const slideVariants = {
    initial: (dir: number) => ({ opacity: 0, x: dir * (isRTL ? -60 : 60) }),
    animate: { opacity: 1, x: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const } },
    exit:    (dir: number) => ({ opacity: 0, x: dir * (isRTL ? 60 : -60), transition: { duration: 0.25 } }),
  };

  return (
    <main className="min-h-screen py-10 px-4" style={{ background: "#FBFDFD" }}>
      <div className="max-w-3xl mx-auto">

        {/* Top nav */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => router.push(`/${locale}`)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors">
            {isRTL ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            {isAr ? "العودة للرئيسية" : "Back to home"}
          </button>
          <div className="flex items-center gap-2">
            <Sparkles size={16} color={G} />
            <span className="text-sm font-black" style={{ color: "#1a2e1a" }}>
              {isAr ? "مخطط الرحلة الذكي" : "AI Trip Planner"}
            </span>
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full text-white" style={{ background: G }}>BETA</span>
          </div>
        </div>

        {/* Progress */}
        {step < TOTAL_STEPS && <StepHeader step={step} total={TOTAL_STEPS - 1} isAr={isAr} />}

        {/* Animated step content */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={step} custom={direction}
            variants={slideVariants} initial="initial" animate="animate" exit="exit">

            {/* ── Step 1: Who's traveling ── */}
            {step === 1 && (
              <div>
                {/* Points callout */}
                <div className="flex items-start gap-3 p-4 rounded-2xl border mb-8"
                  style={{ background: `${Y}10`, borderColor: `${Y}40` }}>
                  <span className="text-2xl">🎁</span>
                  <div>
                    <p className="font-bold text-sm" style={{ color: "#1a1a00" }}>
                      {isAr ? "سجّل الآن واكسب ١٠٠ نقطة!" : "Sign up now and earn 100 points!"}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#5a5a20" }}>
                      {isAr ? "تجمع نقاط مع كل حجز — تستخدمها كخصم على رحلتك القادمة"
                             : "Earn points with every booking — redeem for discounts on future trips"}
                    </p>
                  </div>
                </div>

                <h2 className="text-2xl md:text-3xl font-black mb-2" style={{ color: "#1a2e1a" }}>
                  {isAr ? "من سيسافر؟" : "Who's traveling?"}
                </h2>
                <p className="text-gray-500 text-sm mb-8">
                  {isAr ? "اختر نوع المجموعة" : "Choose your group type"}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                  {([
                    { id: "solo"   as GroupType, icon: UserRound, ar: "بمفردي",      en: "Solo"   },
                    { id: "couple" as GroupType, icon: Heart,     ar: "زوجين",       en: "Couple" },
                    { id: "family" as GroupType, icon: Users,     ar: "عائلة",       en: "Family" },
                    { id: "group"  as GroupType, icon: Users2,    ar: "مجموعة",      en: "Group"  },
                  ]).map(({ id, icon: Icon, ar, en }) => (
                    <OptionCard key={id} selected={sel.groupType === id} onClick={() => update("groupType", id)}>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: sel.groupType === id ? `${G}15` : "#f3f4f6" }}>
                        <Icon size={24} color={sel.groupType === id ? G : "#9ca3af"} strokeWidth={1.75} />
                      </div>
                      <span className={cn("text-sm font-bold", sel.groupType === id ? "text-brand-green" : "text-gray-600")}>
                        {isAr ? ar : en}
                      </span>
                    </OptionCard>
                  ))}
                </div>

                {(sel.groupType === "family" || sel.groupType === "group") && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-2 gap-4 p-5 rounded-2xl border border-gray-100 bg-gray-50/50">
                    {([
                      { key: "adults"   as const, ar: "بالغون (١٢+)", en: "Adults (12+)"   },
                      { key: "children" as const, ar: "أطفال (٢-١١)", en: "Children (2-11)" },
                    ]).map(({ key, ar, en }) => (
                      <div key={key}>
                        <p className="text-xs font-bold text-gray-500 mb-2">{isAr ? ar : en}</p>
                        <div className="flex items-center gap-3">
                          <button onClick={() => update(key, Math.max(key === "adults" ? 1 : 0, sel[key] - 1))}
                            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-brand-green transition-colors">−</button>
                          <span className="w-6 text-center font-black text-gray-800">{sel[key]}</span>
                          <button onClick={() => update(key, Math.min(10, sel[key] + 1))}
                            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-brand-green transition-colors">+</button>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
            )}

            {/* ── Step 2: Destinations ── */}
            {step === 2 && (
              <div>
                <h2 className="text-2xl md:text-3xl font-black mb-2" style={{ color: "#1a2e1a" }}>
                  {isAr ? "أين تريد الذهاب؟" : "Where do you want to go?"}
                </h2>
                <p className="text-gray-500 text-sm mb-8">
                  {isAr ? "اختر وجهة أو أكثر (مصر)" : "Select one or more destinations (Egypt)"}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(Object.keys(DEST_META) as DestinationId[]).map((id) => {
                    const d = DEST_META[id];
                    const selected = sel.destinations.includes(id);
                    return (
                      <button key={id} type="button"
                        onClick={() => {
                          const next = selected
                            ? sel.destinations.filter(x => x !== id)
                            : [...sel.destinations, id];
                          update("destinations", next);
                        }}
                        className={cn(
                          "relative rounded-2xl overflow-hidden border-2 transition-all duration-200 text-start h-32",
                          selected ? "border-brand-green shadow-lg scale-[1.02]" : "border-transparent shadow-sm hover:shadow-md hover:scale-[1.01]"
                        )}>
                        <Image src={d.img} alt={isAr ? d.ar : d.en} fill className="object-cover" sizes="160px" />
                        <div className={cn("absolute inset-0", selected ? "bg-brand-green/30" : "bg-black/35")} />
                        {selected && (
                          <CheckCircle2 size={20} className="absolute top-2 end-2 text-white" fill={G} />
                        )}
                        <div className="absolute bottom-0 inset-x-0 p-2.5">
                          <p className="text-white font-black text-xs leading-tight">{isAr ? d.ar : d.en}</p>
                          <p className="text-white/60 text-[9px] leading-tight mt-0.5">{isAr ? d.tagAr : d.tagEn}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Step 3: Duration & Dates ── */}
            {step === 3 && (
              <div>
                <h2 className="text-2xl md:text-3xl font-black mb-2" style={{ color: "#1a2e1a" }}>
                  {isAr ? "كم يوماً ومتى؟" : "How long & when?"}
                </h2>
                <p className="text-gray-500 text-sm mb-8">
                  {isAr ? "حدد مدة الرحلة وتاريخ السفر" : "Set trip duration and travel date"}
                </p>

                {/* Duration */}
                <div className="mb-8">
                  <p className="text-sm font-bold text-gray-600 mb-4">
                    {isAr ? `عدد الأيام: ${sel.days}` : `Duration: ${sel.days} days`}
                  </p>
                  <input type="range" min={1} max={21} value={sel.days}
                    onChange={e => update("days", parseInt(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer accent-brand-green"
                    style={{ background: `linear-gradient(to right, ${G} 0%, ${G} ${(sel.days/21)*100}%, #e5e7eb ${(sel.days/21)*100}%, #e5e7eb 100%)` }}
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>{isAr ? "يوم واحد" : "1 day"}</span>
                    <span>{isAr ? "٢١ يوم" : "21 days"}</span>
                  </div>
                </div>

                {/* Multi-dest preview */}
                {sel.destinations.length > 1 && (
                  <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 mb-6">
                    <p className="text-xs font-bold text-gray-500 mb-2">{isAr ? "توزيع الأيام:" : "Days distribution:"}</p>
                    {sel.destinations.map((d, i) => {
                      const base = Math.floor(sel.days / sel.destinations.length);
                      const rem = sel.days - base * sel.destinations.length;
                      const dDays = base + (i === 0 ? rem : 0);
                      return (
                        <div key={d} className="flex items-center gap-2 mb-1 last:mb-0">
                          <div className="w-2 h-2 rounded-full" style={{ background: G }} />
                          <span className="text-xs text-gray-600">
                            {isAr ? `${DEST_META[d].ar}: ${dDays} أيام` : `${DEST_META[d].en}: ${dDays} days`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Date */}
                <div>
                  <p className="text-sm font-bold text-gray-600 mb-3">{isAr ? "تاريخ السفر:" : "Travel date:"}</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={() => update("flexible", true)}
                      className={cn("flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all",
                        sel.flexible ? "border-brand-green bg-green-50/50 text-brand-green" : "border-gray-200 text-gray-600 hover:border-brand-green/40")}>
                      {isAr ? "مرن (أي وقت)" : "Flexible (Anytime)"}
                    </button>
                    <div className="flex-1">
                      <input type="date" value={sel.startDate}
                        onChange={e => { update("startDate", e.target.value); update("flexible", false); }}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-700 focus:border-brand-green focus:outline-none transition-colors [color-scheme:light]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 4: Budget ── */}
            {step === 4 && (
              <div>
                <h2 className="text-2xl md:text-3xl font-black mb-2" style={{ color: "#1a2e1a" }}>
                  {isAr ? "ما هي ميزانيتك؟" : "What's your budget?"}
                </h2>
                <p className="text-gray-500 text-sm mb-8">
                  {isAr ? "للشخص الواحد بالجنيه المصري" : "Per person in Egyptian Pounds (EGP)"}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {([
                    { id: "budget"   as BudgetTier, icon: "💰", ar: "اقتصادية",    en: "Budget",   rangeAr: "أقل من ٥٠٠٠ ج", rangeEn: "< EGP 5,000",    color: "#4ade80" },
                    { id: "standard" as BudgetTier, icon: "⭐", ar: "عادية",       en: "Standard", rangeAr: "٥٠٠٠ - ١٥٠٠٠ ج", rangeEn: "EGP 5–15K",    color: BRAND_COLORS.blue },
                    { id: "comfort"  as BudgetTier, icon: "✨", ar: "مريحة",       en: "Comfort",  rangeAr: "١٥٠٠٠ - ٣٠٠٠٠ ج", rangeEn: "EGP 15–30K",  color: G },
                    { id: "luxury"   as BudgetTier, icon: "👑", ar: "فاخرة",       en: "Luxury",   rangeAr: "أكثر من ٣٠٠٠٠ ج", rangeEn: "> EGP 30K",   color: "#f59e0b" },
                  ]).map(({ id, icon, ar, en, rangeAr, rangeEn, color }) => (
                    <OptionCard key={id} selected={sel.budgetTier === id} onClick={() => update("budgetTier", id)}
                      className="items-start gap-3 p-5">
                      <span className="text-3xl">{icon}</span>
                      <div className="text-start">
                        <p className={cn("text-base font-black", sel.budgetTier === id ? "text-brand-green" : "text-gray-800")}>
                          {isAr ? ar : en}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: sel.budgetTier === id ? G : "#9ca3af" }}>
                          {isAr ? rangeAr : rangeEn}
                        </p>
                      </div>
                    </OptionCard>
                  ))}
                </div>
                {/* Breakdown preview */}
                <div className="mt-6 p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
                  <p className="text-xs font-bold text-gray-500 mb-3">{isAr ? "توزيع تقريبي للميزانية:" : "Approx. budget breakdown:"}</p>
                  {([
                    { pct: 40, ar: "طيران", en: "Flights", color: "#60a5fa" },
                    { pct: 40, ar: "فنادق", en: "Hotels",  color: G },
                    { pct: 20, ar: "أنشطة", en: "Activities", color: Y },
                  ]).map(({ pct, ar, en, color }) => (
                    <div key={en} className="flex items-center gap-3 mb-2 last:mb-0">
                      <div className="h-2 rounded-full flex-1 bg-gray-200 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <span className="text-xs text-gray-600 w-24 shrink-0">
                        {isAr ? `${pct}٪ ${ar}` : `${pct}% ${en}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Step 5: Interests & Preferences ── */}
            {step === 5 && (
              <div>
                <h2 className="text-2xl md:text-3xl font-black mb-2" style={{ color: "#1a2e1a" }}>
                  {isAr ? "اهتماماتك وتفضيلاتك" : "Your interests & preferences"}
                </h2>
                <p className="text-gray-500 text-sm mb-6">
                  {isAr ? "اختر ما يهمك (اختيار متعدد)" : "Select what matters to you (multiple choice)"}
                </p>

                {/* Interests */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {INTERESTS.map(({ id, icon, ar, en }) => {
                    const active = sel.interests.includes(id);
                    return (
                      <button key={id} type="button"
                        onClick={() => {
                          const next = active ? sel.interests.filter(x => x !== id) : [...sel.interests, id];
                          update("interests", next);
                        }}
                        className={cn(
                          "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all duration-150",
                          active ? "border-brand-green bg-green-50/50 text-brand-green shadow-sm" : "border-gray-200 bg-white text-gray-600 hover:border-brand-green/40"
                        )}>
                        <span>{icon}</span>{isAr ? ar : en}
                      </button>
                    );
                  })}
                </div>

                {/* Hotel & meal prefs */}
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-bold text-gray-600 mb-3 flex items-center gap-2">
                      <Hotel size={15} /> {isAr ? "نوع الفندق" : "Hotel type"}
                    </p>
                    <div className="space-y-2">
                      {([
                        { id: "hostel"   as HotelPref, ar: "هوستل",         en: "Hostel"    },
                        { id: "budget"   as HotelPref, ar: "بجت",           en: "Budget"    },
                        { id: "midrange" as HotelPref, ar: "متوسط",         en: "Mid-range" },
                        { id: "luxury"   as HotelPref, ar: "فاخر",          en: "Luxury"    },
                      ]).map(({ id, ar, en }) => (
                        <button key={id} type="button" onClick={() => update("hotelPref", id)}
                          className={cn("w-full text-start px-4 py-2.5 rounded-xl border text-sm font-medium transition-all",
                            sel.hotelPref === id ? "border-brand-green bg-green-50/50 text-brand-green" : "border-gray-200 text-gray-600 hover:border-brand-green/30")}>
                          {isAr ? ar : en}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-600 mb-3 flex items-center gap-2">
                      <UtensilsCrossed size={15} /> {isAr ? "تفضيل الوجبات" : "Meal preference"}
                    </p>
                    <div className="space-y-2">
                      {([
                        { id: "bed_only"       as MealPref, ar: "بدون وجبات",    en: "Bed only"        },
                        { id: "breakfast"      as MealPref, ar: "إفطار مشمول",   en: "Breakfast incl." },
                        { id: "all_inclusive"  as MealPref, ar: "كل شيء مشمول", en: "All-inclusive"   },
                      ]).map(({ id, ar, en }) => (
                        <button key={id} type="button" onClick={() => update("mealPref", id)}
                          className={cn("w-full text-start px-4 py-2.5 rounded-xl border text-sm font-medium transition-all",
                            sel.mealPref === id ? "border-brand-green bg-green-50/50 text-brand-green" : "border-gray-200 text-gray-600 hover:border-brand-green/30")}>
                          {isAr ? ar : en}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 6: Summary → Generate ── */}
            {step === 6 && (
              <div>
                <h2 className="text-2xl md:text-3xl font-black mb-2" style={{ color: "#1a2e1a" }}>
                  {isAr ? "ملخص رحلتك" : "Your trip summary"}
                </h2>
                <p className="text-gray-500 text-sm mb-8">
                  {isAr ? "تحقق من التفاصيل قبل التوليد" : "Review details before generating your plan"}
                </p>

                <div className="space-y-3 mb-8">
                  {([
                    { icon: Users,    ar: `${sel.groupType === "solo" ? "بمفردي" : sel.groupType === "couple" ? "زوجان" : `${sel.adults + sel.children} أشخاص`}`, en: `${sel.adults + sel.children} traveler(s)` },
                    { icon: MapPin,   ar: sel.destinations.map(d => DEST_META[d].ar).join(" · ") || "—", en: sel.destinations.map(d => DEST_META[d].en).join(" · ") || "—" },
                    { icon: Calendar, ar: `${sel.days} أيام · ${sel.flexible ? "مرن" : sel.startDate || "غير محدد"}`, en: `${sel.days} days · ${sel.flexible ? "Flexible" : sel.startDate || "TBD"}` },
                    { icon: Wallet,   ar: `ميزانية ${sel.budgetTier === "budget" ? "اقتصادية" : sel.budgetTier === "standard" ? "عادية" : sel.budgetTier === "comfort" ? "مريحة" : "فاخرة"}`, en: `${sel.budgetTier.charAt(0).toUpperCase() + sel.budgetTier.slice(1)} budget` },
                  ]).map(({ icon: Icon, ar, en }, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-white">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${G}12` }}>
                        <Icon size={18} color={G} strokeWidth={1.75} />
                      </div>
                      <span className="text-sm text-gray-700">{isAr ? ar : en}</span>
                    </div>
                  ))}
                </div>

                <button onClick={goNext}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-white font-black text-base shadow-xl transition-all duration-200 hover:shadow-2xl hover:-translate-y-0.5"
                  style={{ background: `linear-gradient(135deg, ${G} 0%, #2d5128 100%)` }}>
                  <Sparkles size={20} />
                  {isAr ? "ولّد خطة رحلتي الكاملة ✨" : "Generate My Full Trip Plan ✨"}
                </button>
              </div>
            )}

            {/* ── Step 7: Generated Plan ── */}
            {step === 7 && plan && (
              <div>
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                    style={{ background: `${G}15` }}>
                    <Sparkles size={28} color={G} />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black mb-2" style={{ color: "#1a2e1a" }}>
                    {isAr ? "🎉 خطة رحلتك جاهزة!" : "🎉 Your Trip Plan is Ready!"}
                  </h2>
                  <p className="text-gray-500 text-sm">
                    {isAr
                      ? `رحلة ${sel.days} أيام إلى ${sel.destinations.map(d => DEST_META[d].ar).join(" و")}`
                      : `${sel.days}-day trip to ${sel.destinations.map(d => DEST_META[d].en).join(" & ")}`
                    }
                  </p>
                </div>

                {/* Cost card */}
                <div className="rounded-2xl p-5 mb-8 text-white"
                  style={{ background: `linear-gradient(135deg, ${G} 0%, #2d5128 100%)` }}>
                  <p className="text-white/70 text-xs font-bold uppercase tracking-wider mb-3">
                    {isAr ? "تقدير التكلفة الإجمالية" : "Estimated Total Cost"}
                  </p>
                  <p className="text-4xl font-black mb-4">
                    {plan.totalCost.toLocaleString()} <span className="text-xl font-semibold text-white/70">EGP</span>
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { icon: Plane,     ar: "طيران",  en: "Flights",     val: plan.flightCost     },
                      { icon: BedDouble, ar: "فنادق",  en: "Hotels",      val: plan.hotelCost      },
                      { icon: Tag,       ar: "أنشطة",  en: "Activities",  val: plan.activitiesCost },
                    ]).map(({ icon: Icon, ar, en, val }) => (
                      <div key={en} className="bg-white/10 rounded-xl p-3 text-center">
                        <Icon size={16} className="mx-auto mb-1 text-white/70" />
                        <p className="text-sm font-black text-white">{val.toLocaleString()}</p>
                        <p className="text-[10px] text-white/60">{isAr ? ar : en}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Day-by-day */}
                <div className="space-y-4 mb-8">
                  {plan.days.map((d) => {
                    const dest = DEST_META[d.dest];
                    const hotelName = isAr ? HOTELS_AR[d.dest][sel.budgetTier] : d.hotel;
                    const actsAr = ACTIVITIES_AR[d.dest];
                    const actsEn = ACTIVITIES[d.dest];
                    const idx = (d.day - 1) * 3;
                    return (
                      <div key={d.day} className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                        {/* Day header */}
                        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-50"
                          style={{ background: `${G}06` }}>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0"
                            style={{ background: G }}>{d.day}</div>
                          <div>
                            <p className="text-sm font-black" style={{ color: "#1a2e1a" }}>
                              {isAr ? `اليوم ${d.day} — ${dest.ar}` : `Day ${d.day} — ${dest.en}`}
                            </p>
                          </div>
                        </div>

                        {/* Activities */}
                        <div className="divide-y divide-gray-50">
                          {([
                            { Icon: Coffee, timeAr: "صباحاً",   timeEn: "Morning",   actIdx: idx % actsEn.length      },
                            { Icon: Sun,    timeAr: "ظهراً",    timeEn: "Afternoon", actIdx: (idx + 1) % actsEn.length },
                            { Icon: Moon,   timeAr: "مساءً",    timeEn: "Evening",   actIdx: (idx + 2) % actsEn.length },
                          ]).map(({ Icon, timeAr, timeEn, actIdx }) => (
                            <div key={timeEn} className="flex items-start gap-3 px-5 py-3">
                              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                                style={{ background: `${G}10` }}>
                                <Icon size={12} color={G} />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                  {isAr ? timeAr : timeEn}
                                </p>
                                <p className="text-sm text-gray-700 mt-0.5">
                                  {isAr ? actsAr[actIdx] : actsEn[actIdx]}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Hotel */}
                        <div className="flex items-center gap-3 px-5 py-3 border-t border-gray-50 bg-gray-50/50">
                          <Hotel size={14} color={G} className="shrink-0" />
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-gray-700">{hotelName}</span>
                            <div className="flex">
                              {Array.from({ length: d.hotelStars }).map((_, i) => (
                                <Star key={i} size={10} fill={Y} color={Y} />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Link href={`/${locale}/book-flight`}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                    style={{ background: G }}>
                    <Plane size={16} />
                    {isAr ? "احجز الطيران" : "Book Flights"}
                  </Link>
                  <Link href={`/${locale}/hotel-booking`}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm shadow-md border-2 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                    style={{ borderColor: G, color: G, background: `${G}08` }}>
                    <BedDouble size={16} />
                    {isAr ? "احجز الفنادق" : "Book Hotels"}
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => alert(isAr ? "قريباً — حفظ الخطة كـ PDF" : "Coming soon — Save as PDF")}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:border-brand-green/40 hover:bg-green-50/20 transition-all">
                    <Download size={15} />
                    {isAr ? "حفظ كـ PDF" : "Save as PDF"}
                  </button>
                  <button onClick={() => { setStep(1); setDirection(-1); setPlan(null); setSel({ groupType: "solo", adults: 1, children: 0, destinations: [], days: 7, flexible: true, startDate: "", budgetTier: "standard", interests: [], hotelPref: "midrange", mealPref: "breakfast" }); }}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:border-brand-green/40 hover:bg-green-50/20 transition-all">
                    <RotateCcw size={15} />
                    {isAr ? "ابدأ من جديد" : "Start Over"}
                  </button>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* ── Nav buttons (steps 1-5 only) ── */}
        {step < 6 && (
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-100">
            <button onClick={goBack} disabled={step === 1}
              className={cn("inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all",
                step === 1 ? "border-gray-100 text-gray-300 cursor-not-allowed" : "border-gray-200 text-gray-600 hover:border-brand-green/40 hover:text-brand-green")}>
              {isRTL ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              {isAr ? "السابق" : "Back"}
            </button>
            <button onClick={goNext} disabled={!canAdvance}
              className={cn("inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all",
                canAdvance ? "hover:opacity-90 hover:-translate-y-0.5 shadow-md" : "opacity-40 cursor-not-allowed")}
              style={{ background: G }}>
              {isAr ? "التالي" : "Next"}
              {isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>
        )}
        {step === 6 && (
          <div className="flex justify-start mt-6">
            <button onClick={goBack}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:border-brand-green/40 transition-all">
              {isRTL ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              {isAr ? "تعديل" : "Edit"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
