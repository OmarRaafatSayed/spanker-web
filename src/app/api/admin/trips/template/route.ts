/**
 * GET /api/admin/trips/template
 * Downloads an Excel template with the exact columns the import expects.
 * Uses SheetJS 0.20.x to generate the file server-side.
 */

import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

// ─── Column definitions ───────────────────────────────────────────────────────

const COLUMNS = [
  { key: "title_ar",        header: "العنوان بالعربية *",           example: "الأقصر وأسوان — ٥ أيام",                    note: "مطلوب" },
  { key: "title_en",        header: "العنوان بالإنجليزية",          example: "Luxor & Aswan — 5 Days",                     note: "" },
  { key: "destination",     header: "الوجهة *",                     example: "الأقصر والأسوان",                            note: "مطلوب" },
  { key: "country",         header: "الدولة *",                     example: "مصر",                                        note: "مطلوب" },
  { key: "is_domestic",     header: "رحلة داخلية؟ *",               example: "true",                                       note: "true = مصر | false = دولية" },
  { key: "duration_days",   header: "عدد الأيام *",                  example: "5",                                          note: "مطلوب - رقم صحيح" },
  { key: "start_date",      header: "تاريخ البداية *",               example: "2026-11-01",                                 note: "مطلوب - تنسيق YYYY-MM-DD" },
  { key: "end_date",        header: "تاريخ النهاية *",               example: "2026-11-06",                                 note: "مطلوب - تنسيق YYYY-MM-DD" },
  { key: "price_per_person",header: "السعر / شخص *",                example: "9800",                                       note: "مطلوب - رقم بدون عملة" },
  { key: "currency",        header: "العملة",                       example: "EGP",                                        note: "EGP | USD | EUR - افتراضي EGP" },
  { key: "available_spots", header: "المقاعد المتاحة",               example: "20",                                         note: "افتراضي 20" },
  { key: "max_travelers",   header: "الحد الأقصى للمجموعة",         example: "25",                                         note: "افتراضي 25" },
  { key: "difficulty",      header: "مستوى الصعوبة",               example: "easy",                                       note: "easy | moderate | hard" },
  { key: "meeting_point",   header: "نقطة التجمع",                  example: "مطار القاهرة الدولي — صالة 2",               note: "" },
  { key: "image_url",       header: "رابط الصورة",                  example: "https://example.com/img.jpg",                note: "رابط صورة الغلاف" },
  { key: "tags",            header: "الكلمات الدلالية",             example: "ثقافية, عائلية",                             note: "مفصولة بفاصلة" },
  { key: "description",     header: "الوصف التسويقي",               example: "استكشف روائع مصر الفرعونية...",              note: "" },
  { key: "cancellation_days",header:"أيام الإلغاء المجاني",         example: "7",                                          note: "افتراضي 7" },
  { key: "includes",        header: "يشمل (فاصل | بين البنود)",     example: "طيران | فندق | مرشد | وجبات",               note: "افصل البنود بـ |" },
  { key: "excludes",        header: "لا يشمل (فاصل | بين البنود)",  example: "تأشيرة | مصروفات شخصية",                    note: "افصل البنود بـ |" },
  { key: "itinerary",       header: "البرنامج اليومي (فاصل | )",    example: "يوم 1: الوصول - نقل للفندق | يوم 2: الكرنك - جولة الصباح", note: "افصل الأيام بـ |" },
];

// ─── 3 sample rows ────────────────────────────────────────────────────────────

const SAMPLES = [
  {
    title_ar: "الأقصر وأسوان — ٥ أيام",
    title_en: "Luxor & Aswan — 5 Days",
    destination: "الأقصر والأسوان",
    country: "مصر",
    is_domestic: "true",
    duration_days: 5,
    start_date: "2026-11-01",
    end_date: "2026-11-06",
    price_per_person: 9800,
    currency: "EGP",
    available_spots: 20,
    max_travelers: 25,
    difficulty: "easy",
    meeting_point: "محطة قطار رمسيس — بوابة 4",
    image_url: "",
    tags: "ثقافية, عائلية, تاريخية",
    description: "استكشف روائع مصر الفرعونية في رحلة شاملة إلى الأقصر وأسوان",
    cancellation_days: 7,
    includes: "تذكرة قطار ذهاب وعودة | فندق 3 نجوم | إفطار يومي | مرشد سياحي | رحلة البالون | تذاكر المعابد",
    excludes: "المصروفات الشخصية | وجبات الغداء والعشاء | الجولات الاختيارية",
    itinerary: "يوم 1: الوصول والاستقبال - نقل للفندق وراحة | يوم 2: معبد الكرنك والأقصر - جولة صباحية | يوم 3: وادي الملوك - زيارة المقابر الفرعونية | يوم 4: السد العالي وأبو سمبل | يوم 5: المغادرة - نقل للمحطة",
  },
  {
    title_ar: "دبي الفاخرة — ٤ أيام",
    title_en: "Luxury Dubai — 4 Days",
    destination: "دبي",
    country: "الإمارات",
    is_domestic: "false",
    duration_days: 4,
    start_date: "2026-11-10",
    end_date: "2026-11-14",
    price_per_person: 18500,
    currency: "EGP",
    available_spots: 18,
    max_travelers: 25,
    difficulty: "easy",
    meeting_point: "مطار القاهرة الدولي — صالة 2",
    image_url: "",
    tags: "فاخرة, تسوق, عائلية",
    description: "استمتع بأرقى تجارب السياحة في دبي مع فندق 5 نجوم وسفاري",
    cancellation_days: 10,
    includes: "طيران ذهاب وعودة | فندق 5 نجوم | إفطار يومي | سفاري صحراوي | نقل مطار",
    excludes: "تأشيرة الإمارات | وجبات الغداء والعشاء | الجولات الاختيارية",
    itinerary: "يوم 1: الوصول وبرج خليفة - استقبال ومشاهدة النافورة | يوم 2: دبي مول والشاطئ - تسوق وراحة | يوم 3: سفاري الصحراء - عشاء بدوي | يوم 4: ديرة القديمة والمغادرة",
  },
  {
    title_ar: "إسطنبول التاريخية — ٥ أيام",
    title_en: "Historic Istanbul — 5 Days",
    destination: "إسطنبول",
    country: "تركيا",
    is_domestic: "false",
    duration_days: 5,
    start_date: "2026-11-20",
    end_date: "2026-11-25",
    price_per_person: 22800,
    currency: "EGP",
    available_spots: 15,
    max_travelers: 20,
    difficulty: "easy",
    meeting_point: "مطار القاهرة الدولي — صالة 3",
    image_url: "",
    tags: "ثقافية, تاريخية, رومانسية",
    description: "جولة شاملة في عاصمة الحضارتين الإسلامية والبيزنطية",
    cancellation_days: 7,
    includes: "طيران مباشر | فندق 4 نجوم وسط المدينة | إفطار يومي | رحلة بوسفور | نقل مطار",
    excludes: "تأشيرة تركيا الإلكترونية | وجبات الغداء والعشاء | الجولات الاختيارية",
    itinerary: "يوم 1: الوصول والاستقبال - نقل للفندق | يوم 2: آيا صوفيا والقصر - جولة تاريخية | يوم 3: رحلة البوسفور - جولة بحرية | يوم 4: البازار الكبير - تسوق | يوم 5: أورتاكوي والمغادرة",
  },
];

export async function GET(_req: NextRequest) {
  // ── Sheet 1: Data input ───────────────────────────────────────────────────
  const dataSheet = XLSX.utils.aoa_to_sheet([]);

  // Style the header row
  const headerRow = COLUMNS.map(c => c.header);
  XLSX.utils.sheet_add_aoa(dataSheet, [headerRow], { origin: "A1" });

  // Add the 3 sample rows
  const sampleRows = SAMPLES.map(s =>
    COLUMNS.map(c => (s as Record<string, unknown>)[c.key] ?? "")
  );
  XLSX.utils.sheet_add_aoa(dataSheet, sampleRows, { origin: "A2" });

  // Set column widths
  dataSheet["!cols"] = COLUMNS.map((c) => ({
    wch: Math.max(c.header.length + 4, (c.example?.length ?? 0) + 4, 18),
  }));

  // Freeze the header row
  dataSheet["!freeze"] = { xSplit: 0, ySplit: 1 };

  // ── Sheet 2: Instructions ─────────────────────────────────────────────────
  const instrRows: string[][] = [
    ["📋 تعليمات ملء بيانات الرحلات — Spanker Travel"],
    [""],
    ["الحقول المطلوبة (*):", "يجب ملؤها — الصف لن يُستورد بدونها"],
    [""],
    ...COLUMNS.map(c => [
      c.header,
      c.note || "اختياري",
      `مثال: ${c.example}`,
    ]),
    [""],
    ["ملاحظات مهمة:"],
    ["• افصل بنود الـ includes والـ excludes والـ itinerary بعلامة | (شريط عمودي)"],
    ["• تنسيق التاريخ يجب أن يكون: YYYY-MM-DD  مثال: 2026-11-01"],
    ["• is_domestic: اكتب true للرحلات الداخلية (داخل مصر) و false للدولية"],
    ["• difficulty: اكتب one of: easy / moderate / hard"],
    ["• لا تغير أسماء أعمدة الهيدر — الاستيراد يعتمد عليها"],
    ["• يمكنك حذف صفوف المثال قبل الاستيراد"],
  ];

  const instrSheet = XLSX.utils.aoa_to_sheet(instrRows);
  instrSheet["!cols"] = [{ wch: 35 }, { wch: 30 }, { wch: 50 }];

  // ── Workbook ───────────────────────────────────────────────────────────────
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, dataSheet, "الرحلات");
  XLSX.utils.book_append_sheet(wb, instrSheet, "التعليمات");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type":        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="spanker-trips-template.xlsx"`,
      "Cache-Control":       "no-store",
    },
  });
}
