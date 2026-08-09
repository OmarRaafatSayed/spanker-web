export interface Review {
  id: string;
  name: { ar: string; en: string };
  avatar: string; // initials
  avatarColor: string;
  country: { ar: string; en: string };
  flag: string;
  rating: number; // 1-5
  date: { ar: string; en: string };
  route: { ar: string; en: string };
  flightNumber: string;
  cabinClass: "economy" | "business";
  verified: boolean;
  title: { ar: string; en: string };
  body: { ar: string; en: string };
  tags: { ar: string[]; en: string[] };
  helpful: number;
  aspects: {
    seat: number;
    food: number;
    crew: number;
    entertainment: number;
    value: number;
  };
}

export const REVIEWS: Review[] = [
  {
    id: "r1",
    name: { ar: "محمد أحمد السيد", en: "Mohamed Ahmed" },
    avatar: "م أ",
    avatarColor: "#3D6833",
    country: { ar: "مصر", en: "Egypt" },
    flag: "🇪🇬",
    rating: 5,
    date: { ar: "12 يناير 2025", en: "Jan 12, 2025" },
    route: { ar: "القاهرة → مرسى علم", en: "Cairo → Marsa Alam" },
    flightNumber: "SP 301",
    cabinClass: "economy",
    verified: true,
    title: {
      ar: "تجربة ممتازة من البداية للنهاية!",
      en: "Outstanding experience from start to finish!",
    },
    body: {
      ar: "سافرت مع عائلتي إلى مرسى علم وكانت التجربة رائعة. الطاقم المضيف كان متعاوناً جداً مع أطفالي، والمقاعد مريحة لرحلة قصيرة. الإقلاع كان في الموعد تماماً ووصلنا قبل الموعد المحدد. سأسافر مع سبانكر مرة أخرى بالتأكيد.",
      en: "Traveled with my family to Marsa Alam and the experience was wonderful. The crew was very helpful with my kids, and the seats were comfortable for a short flight. Departure was on time and we arrived early. Will definitely fly Spanker again.",
    },
    tags: { ar: ["عائلة", "في الوقت", "طاقم ممتاز"], en: ["Family", "On-time", "Great crew"] },
    helpful: 47,
    aspects: { seat: 4, food: 4, crew: 5, entertainment: 3, value: 5 },
  },
  {
    id: "r2",
    name: { ar: "سارة محمود", en: "Sara Mahmoud" },
    avatar: "س م",
    avatarColor: "#2473BC",
    country: { ar: "مصر", en: "Egypt" },
    flag: "🇪🇬",
    rating: 5,
    date: { ar: "3 فبراير 2025", en: "Feb 3, 2025" },
    route: { ar: "القاهرة → شرم الشيخ", en: "Cairo → Sharm el-Sheikh" },
    flightNumber: "SP 215",
    cabinClass: "economy",
    verified: true,
    title: {
      ar: "الأفضل في السفر الداخلي في مصر",
      en: "Best domestic airline in Egypt",
    },
    body: {
      ar: "جربت سبانكر لأول مرة من القاهرة لشرم الشيخ، وصراحة فاجأتني بالإيجاب. موظفو الخدمة كانوا محترفين جداً، والطائرة نظيفة ومرتبة. الوجبات اللي قدموها كانت لذيذة ومناسبة لمدة الرحلة. النظام الترفيهي على الشاشة كان فيه محتوى متنوع.",
      en: "Tried Spanker for the first time from Cairo to Sharm el-Sheikh, and honestly I was pleasantly surprised. The service staff were very professional, the aircraft was clean and tidy. The meals served were tasty and appropriate for the flight duration.",
    },
    tags: { ar: ["محترف", "نظيف", "وجبات جيدة"], en: ["Professional", "Clean", "Good meals"] },
    helpful: 31,
    aspects: { seat: 4, food: 5, crew: 5, entertainment: 4, value: 4 },
  },
  {
    id: "r3",
    name: { ar: "خالد إبراهيم النجار", en: "Khaled Ibrahim" },
    avatar: "خ إ",
    avatarColor: "#FDD12A",
    country: { ar: "السعودية", en: "Saudi Arabia" },
    flag: "🇸🇦",
    rating: 4,
    date: { ar: "20 يناير 2025", en: "Jan 20, 2025" },
    route: { ar: "القاهرة → بودابست", en: "Cairo → Budapest" },
    flightNumber: "SP 451",
    cabinClass: "economy",
    verified: true,
    title: {
      ar: "رحلة أوروبية ممتعة بسعر معقول",
      en: "Pleasant European journey at a reasonable price",
    },
    body: {
      ar: "رحلة القاهرة-بودابست كانت مريحة جداً رغم طول مدتها. الطائرة من نوع A321neo بها شاشات ترفيه حديثة وإضاءة هادئة. الطاقم يتحدث العربية والإنجليزية بطلاقة مما جعل التواصل سهلاً. نقطة واحدة بسيطة: كان الطعام يمكن أن يكون أفضل قليلاً في الرحلات الطويلة.",
      en: "The Cairo-Budapest flight was very comfortable despite its length. The A321neo aircraft has modern entertainment screens and calm lighting. The crew speaks Arabic and English fluently which made communication easy. One minor point: the food could be slightly better on long-haul flights.",
    },
    tags: { ar: ["رحلات أوروبا", "طويلة المدى", "شاشات حديثة"], en: ["Europe flights", "Long-haul", "Modern screens"] },
    helpful: 28,
    aspects: { seat: 4, food: 3, crew: 5, entertainment: 4, value: 5 },
  },
  {
    id: "r4",
    name: { ar: "نورهان عبد الله", en: "Nourhan Abdullah" },
    avatar: "ن ع",
    avatarColor: "#e85d04",
    country: { ar: "مصر", en: "Egypt" },
    flag: "🇪🇬",
    rating: 5,
    date: { ar: "8 فبراير 2025", en: "Feb 8, 2025" },
    route: { ar: "القاهرة → الغردقة", en: "Cairo → Hurghada" },
    flightNumber: "SP 180",
    cabinClass: "business",
    verified: true,
    title: {
      ar: "تجربة درجة الأعمال فاقت توقعاتي",
      en: "Business class experience exceeded my expectations",
    },
    body: {
      ar: "سافرت بدرجة الأعمال للمرة الأولى مع سبانكر وكانت التجربة استثنائية. المقاعد واسعة جداً ومريحة، والطعام المقدم كان على مستوى رفيع مع اختيارات متنوعة. التعامل من قِبل الطاقم كان شخصياً ومميزاً - شعرت أنهم يهتمون بكل مسافر بشكل فردي. الإقلاع كان في الموعد المحدد تماماً.",
      en: "Flew business class for the first time with Spanker and the experience was exceptional. The seats are very spacious and comfortable, and the food served was of a high standard with diverse choices. The crew interaction was personal and distinctive - I felt they care for each passenger individually.",
    },
    tags: { ar: ["درجة أعمال", "فخامة", "خدمة شخصية"], en: ["Business class", "Luxury", "Personal service"] },
    helpful: 56,
    aspects: { seat: 5, food: 5, crew: 5, entertainment: 4, value: 5 },
  },
  {
    id: "r5",
    name: { ar: "Ahmed Farouk", en: "Ahmed Farouk" },
    avatar: "AF",
    avatarColor: "#7209b7",
    country: { ar: "المملكة المتحدة", en: "United Kingdom" },
    flag: "🇬🇧",
    rating: 4,
    date: { ar: "15 ديسمبر 2024", en: "Dec 15, 2024" },
    route: { ar: "القاهرة → الإسكندرية", en: "Cairo → Alexandria" },
    flightNumber: "SP 105",
    cabinClass: "economy",
    verified: false,
    title: {
      ar: "رحلة سريعة وممتعة",
      en: "Quick and enjoyable flight",
    },
    body: {
      ar: "رحلة قصيرة لكن ممتازة. الموظفون مبتسمون دائماً ومتعاونون. كان هناك تأخير بسيط في الإقلاع لكن الطيارين تعوضوا عنه في الجو ووصلنا في الموعد تقريباً. المطار الداخلي بالقاهرة يحتاج لتطوير لكن هذا ليس من مسؤولية الشركة.",
      en: "Short but excellent flight. Staff are always smiling and cooperative. There was a slight delay at departure but the pilots made up for it in the air and we arrived nearly on time. The domestic terminal at Cairo needs improvement but that's not the airline's responsibility.",
    },
    tags: { ar: ["قصيرة", "طاقم ودود", "في الموعد تقريباً"], en: ["Short flight", "Friendly crew", "Nearly on time"] },
    helpful: 19,
    aspects: { seat: 4, food: 3, crew: 5, entertainment: 2, value: 4 },
  },
  {
    id: "r6",
    name: { ar: "فاطمة علي حسن", en: "Fatma Ali Hassan" },
    avatar: "ف ع",
    avatarColor: "#3D6833",
    country: { ar: "الإمارات", en: "UAE" },
    flag: "🇦🇪",
    rating: 5,
    date: { ar: "2 مارس 2025", en: "Mar 2, 2025" },
    route: { ar: "الكويت → الإسكندرية", en: "Kuwait → Alexandria" },
    flightNumber: "SP 740",
    cabinClass: "economy",
    verified: true,
    title: {
      ar: "أعود إلى مصر مع سبانكر دائماً",
      en: "I always return to Egypt with Spanker",
    },
    body: {
      ar: "أسافر بين الكويت والإسكندرية بشكل منتظم، وسبانكر هي خيارتي الأولى دائماً. الجدول الزمني مناسب جداً، وأسعارهم تنافسية مقارنة بالشركات الأخرى على نفس المسار. الطاقم دائماً يتذكرني! وهذا شعور جميل. سبانكر تشعرك أنك في بيتك.",
      en: "I travel regularly between Kuwait and Alexandria, and Spanker is always my first choice. The schedule is very convenient and their prices are competitive compared to other airlines on the same route. The crew always remembers me! And that's a lovely feeling. Spanker makes you feel at home.",
    },
    tags: { ar: ["مسافر متكرر", "سعر مناسب", "جدول مميز"], en: ["Frequent flyer", "Great value", "Good schedule"] },
    helpful: 64,
    aspects: { seat: 4, food: 4, crew: 5, entertainment: 3, value: 5 },
  },
  {
    id: "r7",
    name: { ar: "عمر طارق", en: "Omar Tarek" },
    avatar: "ع ط",
    avatarColor: "#2473BC",
    country: { ar: "ألمانيا", en: "Germany" },
    flag: "🇩🇪",
    rating: 4,
    date: { ar: "10 نوفمبر 2024", en: "Nov 10, 2024" },
    route: { ar: "القاهرة → فرانكفورت", en: "Cairo → Frankfurt" },
    flightNumber: "SP 620",
    cabinClass: "economy",
    verified: true,
    title: {
      ar: "رحلة أوروبية بقيمة ممتازة",
      en: "European flight with excellent value",
    },
    body: {
      ar: "رحلة القاهرة-فرانكفورت على طائرة A330 كانت تجربة من المستوى الأول. المقعد مريح والمساحة كافية حتى لرجل طويل مثلي. الوجبات كانت 3 وجبات كاملة طوال الرحلة - لذيذة ومتنوعة. الطاقم متحمس ومبتسم طوال الوقت. الوحيد الذي أتمنى تحسينه هو تغطية الـ WiFi في المنتصف.",
      en: "The Cairo-Frankfurt flight on the A330 was a first-class experience. The seat is comfortable with enough space even for a tall person like me. Meals were 3 full meals throughout the flight - delicious and varied. The crew is enthusiastic and smiling throughout. The only thing I'd like improved is WiFi coverage in the middle.",
    },
    tags: { ar: ["رحلات طويلة", "A330", "ثلاث وجبات"], en: ["Long-haul", "A330", "Three meals"] },
    helpful: 38,
    aspects: { seat: 4, food: 5, crew: 5, entertainment: 4, value: 5 },
  },
  {
    id: "r8",
    name: { ar: "ليلى منصور", en: "Layla Mansour" },
    avatar: "ل م",
    avatarColor: "#e85d04",
    country: { ar: "فرنسا", en: "France" },
    flag: "🇫🇷",
    rating: 3,
    date: { ar: "25 أكتوبر 2024", en: "Oct 25, 2024" },
    route: { ar: "القاهرة → باريس", en: "Cairo → Paris" },
    flightNumber: "SP 590",
    cabinClass: "economy",
    verified: true,
    title: {
      ar: "جيدة مع بعض نقاط للتطوير",
      en: "Good with some areas for improvement",
    },
    body: {
      ar: "التجربة بشكل عام جيدة لكن هناك أماكن يمكن تطويرها. الطاقم كان محترفاً لكن بعضهم بدا مرهقاً. الطعام كان مقبولاً لكن لم يكن ذلك المميز. شاشة الترفيه صغيرة نسبياً مقارنة بالشركات الأخرى. الإيجابيات: الرحلة كانت هادئة جداً والطيار قدم إعلانات واضحة طوال الرحلة.",
      en: "Overall experience was good but there are areas for improvement. The crew was professional but some seemed tired. The food was acceptable but not exceptional. The entertainment screen is relatively small compared to other airlines. Positives: the flight was very smooth and the pilot made clear announcements throughout.",
    },
    tags: { ar: ["جيد للتحسين", "هادئة", "محترف"], en: ["Room for improvement", "Smooth flight", "Professional"] },
    helpful: 22,
    aspects: { seat: 3, food: 3, crew: 4, entertainment: 2, value: 3 },
  },
  {
    id: "r9",
    name: { ar: "يوسف الشامي", en: "Yousef Al-Shami" },
    avatar: "ي ش",
    avatarColor: "#7209b7",
    country: { ar: "الأردن", en: "Jordan" },
    flag: "🇯🇴",
    rating: 5,
    date: { ar: "5 مارس 2025", en: "Mar 5, 2025" },
    route: { ar: "القاهرة → الغردقة", en: "Cairo → Hurghada" },
    flightNumber: "SP 182",
    cabinClass: "economy",
    verified: true,
    title: {
      ar: "مع الأسرة - تجربة رائعة!",
      en: "With the family - absolutely wonderful!",
    },
    body: {
      ar: "رحلة عائلية رائعة مع زوجتي وثلاثة أطفال. الطاقم كان رائعاً مع الأطفال وساعدونا في ترتيب المقاعد المتجاورة رغم أننا حجزنا في وقت متأخر. الأطفال استمتعوا بالشاشات الترفيهية. الوجبة كانت ممتازة لاسيما أن لديّ طفل يعاني من حساسية - وتعاملوا مع الأمر باحترافية عالية.",
      en: "Wonderful family trip with my wife and three kids. The crew was amazing with the children and helped us arrange adjacent seats even though we booked late. Kids enjoyed the entertainment screens. The meal was excellent, especially since I have a child with an allergy - and they handled it with great professionalism.",
    },
    tags: { ar: ["عائلة", "أطفال", "خدمة استثنائية"], en: ["Family", "Kids", "Exceptional service"] },
    helpful: 71,
    aspects: { seat: 5, food: 5, crew: 5, entertainment: 4, value: 4 },
  },
  {
    id: "r10",
    name: { ar: "Hana Kowalski", en: "Hana Kowalski" },
    avatar: "HK",
    avatarColor: "#2473BC",
    country: { ar: "بولندا", en: "Poland" },
    flag: "🇵🇱",
    rating: 4,
    date: { ar: "18 فبراير 2025", en: "Feb 18, 2025" },
    route: { ar: "القاهرة → وارسو", en: "Cairo → Warsaw" },
    flightNumber: "SP 644",
    cabinClass: "economy",
    verified: false,
    title: {
      ar: "مفاجأة إيجابية من شركة مصرية",
      en: "Positive surprise from an Egyptian airline",
    },
    body: {
      ar: "لم أكن أتوقع هذا المستوى من الخدمة صراحة. الطائرة كانت نظيفة جداً، الطاقم لطيف ومتعاون، والرحلة كانت سلسة. أحببت بشكل خاص نظام الترفيه وتنوع الأفلام. سأنصح أصدقائي بالتجربة.",
      en: "I honestly wasn't expecting this level of service. The aircraft was very clean, the crew was kind and cooperative, and the flight was smooth. I especially liked the entertainment system and variety of movies. I'll recommend the experience to my friends.",
    },
    tags: { ar: ["مفاجأة إيجابية", "نظيف", "ترفيه ممتاز"], en: ["Positive surprise", "Clean", "Great entertainment"] },
    helpful: 33,
    aspects: { seat: 4, food: 4, crew: 5, entertainment: 5, value: 4 },
  },
  {
    id: "r11",
    name: { ar: "أميرة حسين", en: "Amira Hussein" },
    avatar: "أ ح",
    avatarColor: "#3D6833",
    country: { ar: "مصر", en: "Egypt" },
    flag: "🇪🇬",
    rating: 5,
    date: { ar: "1 مارس 2025", en: "Mar 1, 2025" },
    route: { ar: "القاهرة → أسوان", en: "Cairo → Aswan" },
    flightNumber: "SP 320",
    cabinClass: "economy",
    verified: true,
    title: {
      ar: "الأسرع والأسهل للوصول لأسوان",
      en: "Fastest and easiest way to reach Aswan",
    },
    body: {
      ar: "بدلاً من القطار لمدة 12 ساعة، اخترت سبانكر لـ 90 دقيقة فقط! وكانت القرار الصح. الحجز كان سهلاً جداً عبر التطبيق، تسجيل الوصول في 10 دقائق، والطائرة كانت أكبر مما توقعت. الخدمة ممتازة وسعر الرحلة كان في حدود المعقول.",
      en: "Instead of a 12-hour train, I chose Spanker for just 90 minutes! And it was the right decision. Booking was very easy via the app, check-in in 10 minutes, and the aircraft was larger than I expected. Excellent service and the ticket price was reasonable.",
    },
    tags: { ar: ["داخلي", "سريع", "تطبيق سهل"], en: ["Domestic", "Fast", "Easy app"] },
    helpful: 44,
    aspects: { seat: 4, food: 3, crew: 5, entertainment: 3, value: 5 },
  },
  {
    id: "r12",
    name: { ar: "طارق رمضان", en: "Tarek Ramadan" },
    avatar: "ط ر",
    avatarColor: "#FDD12A",
    country: { ar: "قطر", en: "Qatar" },
    flag: "🇶🇦",
    rating: 4,
    date: { ar: "7 يناير 2025", en: "Jan 7, 2025" },
    route: { ar: "القاهرة → روما", en: "Cairo → Rome" },
    flightNumber: "SP 532",
    cabinClass: "economy",
    verified: true,
    title: {
      ar: "رحلة ممتازة للعطلة الإيطالية",
      en: "Excellent flight for the Italian holiday",
    },
    body: {
      ar: "سافرت مع أصدقاء إلى روما وكانت التجربة ممتازة. الموظفون كانوا لطفاء ومرحبين. أحببت أن الطائرة كانت من نوع 737 MAX 8 - الجديدة والهادئة جداً مما يجعل الرحلة أكثر راحة. السعر كان تنافسياً جداً مقارنة بالخيارات الأخرى للرحلات الأوروبية من مصر.",
      en: "Traveled with friends to Rome and the experience was excellent. Staff were friendly and welcoming. I loved that the aircraft was a 737 MAX 8 - new and very quiet which makes the flight much more comfortable. The price was very competitive compared to other options for European flights from Egypt.",
    },
    tags: { ar: ["رحلات أوروبا", "737 MAX", "هادئة"], en: ["Europe flights", "737 MAX", "Quiet"] },
    helpful: 29,
    aspects: { seat: 4, food: 4, crew: 5, entertainment: 4, value: 5 },
  },
];

export const REVIEW_STATS = {
  totalReviews: REVIEWS.length,
  averageRating: Number(
    (REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length).toFixed(1)
  ),
  ratingBreakdown: [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: REVIEWS.filter((r) => r.rating === star).length,
    percentage: Math.round(
      (REVIEWS.filter((r) => r.rating === star).length / REVIEWS.length) * 100
    ),
  })),
  averageAspects: {
    seat: Number((REVIEWS.reduce((s, r) => s + r.aspects.seat, 0) / REVIEWS.length).toFixed(1)),
    food: Number((REVIEWS.reduce((s, r) => s + r.aspects.food, 0) / REVIEWS.length).toFixed(1)),
    crew: Number((REVIEWS.reduce((s, r) => s + r.aspects.crew, 0) / REVIEWS.length).toFixed(1)),
    entertainment: Number((REVIEWS.reduce((s, r) => s + r.aspects.entertainment, 0) / REVIEWS.length).toFixed(1)),
    value: Number((REVIEWS.reduce((s, r) => s + r.aspects.value, 0) / REVIEWS.length).toFixed(1)),
  },
};
