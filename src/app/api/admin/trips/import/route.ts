/**
 * POST /api/admin/trips/import
 * Accepts multipart/form-data with field "file" (xlsx/csv).
 * Validates each row strictly, inserts valid rows, returns a detailed report.
 */

import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createServerClient } from "@/lib/supabase/server";

// ─── Field contract (same as the template) ────────────────────────────────────

const REQUIRED_FIELDS = [
  "title_ar", "destination", "country", "is_domestic",
  "duration_days", "start_date", "end_date", "price_per_person",
] as const;

interface RawRow {
  title_ar?: string;
  title_en?: string;
  destination?: string;
  country?: string;
  is_domestic?: string;
  duration_days?: string | number;
  start_date?: string;
  end_date?: string;
  price_per_person?: string | number;
  currency?: string;
  available_spots?: string | number;
  max_travelers?: string | number;
  difficulty?: string;
  meeting_point?: string;
  image_url?: string;
  tags?: string;
  description?: string;
  cancellation_days?: string | number;
  includes?: string;
  excludes?: string;
  itinerary?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

const META_PREFIX = "__meta__:";

function packDescription(meta: Record<string, unknown>, plain: string): string {
  return `${META_PREFIX}${JSON.stringify(meta)}\n${plain}`;
}

function parseDate(val: string | number | undefined): string | null {
  if (!val) return null;
  const s = String(val).trim();
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // Excel serial date (number)
  if (!isNaN(Number(s))) {
    const d = XLSX.SSF.parse_date_code(Number(s));
    if (d) {
      const mm = String(d.m).padStart(2, "0");
      const dd = String(d.d).padStart(2, "0");
      return `${d.y}-${mm}-${dd}`;
    }
  }
  // DD/MM/YYYY
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  return null;
}

function splitPipe(val: string | undefined): string[] {
  if (!val) return [];
  return val.split("|").map(s => s.trim()).filter(Boolean);
}

function parseItinerary(val: string | undefined): { day: number; title: string; description: string }[] {
  if (!val) return [];
  return splitPipe(val).map((seg, i) => {
    // "يوم 1: Title - Description" or just "Title - Description"
    const withoutDayLabel = seg.replace(/^يوم\s*\d+\s*[::\-]\s*/i, "").trim();
    const dashIdx = withoutDayLabel.indexOf(" - ");
    const title = dashIdx !== -1 ? withoutDayLabel.slice(0, dashIdx).trim() : withoutDayLabel;
    const description = dashIdx !== -1 ? withoutDayLabel.slice(dashIdx + 3).trim() : "";
    return { day: i + 1, title, description };
  });
}

// Normalise column header → field key (handle Arabic headers from template)
const HEADER_MAP: Record<string, keyof RawRow> = {
  "العنوان بالعربية *": "title_ar",
  "العنوان بالعربية":   "title_ar",
  "title_ar":           "title_ar",
  "العنوان بالإنجليزية": "title_en",
  "title_en":           "title_en",
  "الوجهة *":           "destination",
  "الوجهة":             "destination",
  "destination":        "destination",
  "الدولة *":           "country",
  "الدولة":             "country",
  "country":            "country",
  "رحلة داخلية؟ *":    "is_domestic",
  "رحلة داخلية؟":      "is_domestic",
  "is_domestic":        "is_domestic",
  "عدد الأيام *":       "duration_days",
  "عدد الأيام":         "duration_days",
  "duration_days":      "duration_days",
  "تاريخ البداية *":    "start_date",
  "تاريخ البداية":      "start_date",
  "start_date":         "start_date",
  "تاريخ النهاية *":    "end_date",
  "تاريخ النهاية":      "end_date",
  "end_date":           "end_date",
  "السعر / شخص *":      "price_per_person",
  "السعر / شخص":        "price_per_person",
  "price_per_person":   "price_per_person",
  "العملة":             "currency",
  "currency":           "currency",
  "المقاعد المتاحة":    "available_spots",
  "available_spots":    "available_spots",
  "الحد الأقصى للمجموعة": "max_travelers",
  "max_travelers":      "max_travelers",
  "مستوى الصعوبة":      "difficulty",
  "difficulty":         "difficulty",
  "نقطة التجمع":        "meeting_point",
  "meeting_point":      "meeting_point",
  "رابط الصورة":        "image_url",
  "image_url":          "image_url",
  "الكلمات الدلالية":   "tags",
  "tags":               "tags",
  "الوصف التسويقي":     "description",
  "description":        "description",
  "أيام الإلغاء المجاني": "cancellation_days",
  "cancellation_days":  "cancellation_days",
  "يشمل (فاصل | بين البنود)": "includes",
  "includes":           "includes",
  "لا يشمل (فاصل | بين البنود)": "excludes",
  "excludes":           "excludes",
  "البرنامج اليومي (فاصل | )": "itinerary",
  "itinerary":          "itinerary",
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ success: false, error: "لم يتم إرسال ملف" }, { status: 400 });
    }

    // ── Parse file ──────────────────────────────────────────────────────────
    const buffer = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: "",
    }) as unknown[][];

    if (rawData.length < 2) {
      return NextResponse.json({
        success: false,
        error: "الملف فارغ أو لا يحتوي على بيانات (يجب أن يكون هناك صف ترويسة + صف بيانات على الأقل)",
      }, { status: 400 });
    }

    // Build header → column index map
    const headerRow = (rawData[0] as string[]).map(h => String(h).trim());
    const colMap: Record<keyof RawRow, number> = {} as Record<keyof RawRow, number>;
    headerRow.forEach((h, idx) => {
      const mapped = HEADER_MAP[h];
      if (mapped) colMap[mapped] = idx;
    });

    // Validate required columns exist
    const missingCols = REQUIRED_FIELDS.filter(f => colMap[f] === undefined);
    if (missingCols.length > 0) {
      return NextResponse.json({
        success: false,
        error: `الأعمدة التالية مفقودة من الملف: ${missingCols.join("، ")}`,
        hint: "تأكد أن أسماء الأعمدة مطابقة للـ Template — قم بتحميل الـ Template من زر «تحميل النموذج»",
      }, { status: 400 });
    }

    // ── Validate + build rows ───────────────────────────────────────────────
    const errors: ValidationError[] = [];
    const validPayloads: Record<string, unknown>[] = [];

    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i] as unknown[];
      const r = (field: keyof RawRow): string => String(row[colMap[field]] ?? "").trim();
      const rowNum = i + 1;

      // Skip visually empty rows
      if (REQUIRED_FIELDS.every(f => !r(f))) continue;

      // ── Required field validation ──
      const rowErrors: ValidationError[] = [];
      if (!r("title_ar"))        rowErrors.push({ row: rowNum, field: "title_ar",        message: "العنوان بالعربية مطلوب" });
      if (!r("destination"))     rowErrors.push({ row: rowNum, field: "destination",     message: "الوجهة مطلوبة" });
      if (!r("country"))         rowErrors.push({ row: rowNum, field: "country",         message: "الدولة مطلوبة" });
      if (!r("is_domestic"))     rowErrors.push({ row: rowNum, field: "is_domestic",     message: "is_domestic مطلوب (true أو false)" });

      const startDate = parseDate(r("start_date"));
      const endDate   = parseDate(r("end_date"));
      if (!startDate) rowErrors.push({ row: rowNum, field: "start_date", message: "تاريخ البداية غير صحيح — استخدم تنسيق YYYY-MM-DD" });
      if (!endDate)   rowErrors.push({ row: rowNum, field: "end_date",   message: "تاريخ النهاية غير صحيح — استخدم تنسيق YYYY-MM-DD" });
      if (startDate && endDate && startDate >= endDate) {
        rowErrors.push({ row: rowNum, field: "end_date", message: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية" });
      }

      const price = Number(r("price_per_person"));
      if (!r("price_per_person") || isNaN(price) || price <= 0) {
        rowErrors.push({ row: rowNum, field: "price_per_person", message: "السعر يجب أن يكون رقماً أكبر من صفر" });
      }

      const durationDays = r("duration_days") ? Number(r("duration_days")) : 0;
      if (!durationDays || isNaN(durationDays) || durationDays <= 0) {
        rowErrors.push({ row: rowNum, field: "duration_days", message: "عدد الأيام يجب أن يكون رقماً صحيحاً أكبر من صفر" });
      }

      const isDomesticStr = r("is_domestic").toLowerCase();
      if (!["true", "false", "1", "0", "yes", "no", "نعم", "لا"].includes(isDomesticStr)) {
        rowErrors.push({ row: rowNum, field: "is_domestic", message: "is_domestic يجب أن يكون true أو false" });
      }

      const difficulty = r("difficulty").toLowerCase() || "easy";
      if (difficulty && !["easy", "moderate", "hard"].includes(difficulty)) {
        rowErrors.push({ row: rowNum, field: "difficulty", message: "difficulty يجب أن يكون: easy | moderate | hard" });
      }

      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
        continue; // skip this row
      }

      // ── Build insert payload ──
      const isDomestic = ["true", "1", "yes", "نعم"].includes(isDomesticStr);
      const tags = r("tags") ? r("tags").split(",").map(t => t.trim()).filter(Boolean) : [];
      const includes = splitPipe(r("includes"));
      const excludes = splitPipe(r("excludes"));
      const itinerary = parseItinerary(r("itinerary"));
      const metaDays = durationDays || (startDate && endDate
        ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)
        : 5);

      const meta = {
        title_ar:        r("title_ar"),
        title_en:        r("title_en"),
        slug:            (r("title_en") || r("title_ar"))
          .toLowerCase().replace(/[\s\u0600-\u06FF]+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "")
          || `trip-${Date.now()}`,
        difficulty:      difficulty,
        meeting_point:   r("meeting_point"),
        image_url:       r("image_url"),
        is_domestic:     isDomestic,
        tags,
        includes_raw:    r("includes"),
        excludes_raw:    r("excludes"),
        itinerary_raw:   r("itinerary"),
        cancellation_days: Number(r("cancellation_days")) || 7,
      };

      validPayloads.push({
        name:             r("title_ar"),
        destination:      r("destination"),
        description:      packDescription(meta, r("description")),
        duration_days:    metaDays,
        start_date:       startDate,
        end_date:         endDate,
        price_per_person: price,
        currency:         r("currency") || "EGP",
        available_spots:  Number(r("available_spots")) || 20,
        max_travelers:    Number(r("max_travelers")) || 25,
        inclusions:       includes.length ? includes : null,
        exclusions:       excludes.length ? excludes : null,
        itinerary:        itinerary.length ? itinerary : null,
        is_active:        true,
        is_public:        true,
      });
    }

    if (validPayloads.length === 0 && errors.length > 0) {
      return NextResponse.json({
        success: false,
        error: "لا توجد صفوف صالحة للاستيراد",
        validation_errors: errors,
        stats: { total: rawData.length - 1, valid: 0, failed: errors.length },
      }, { status: 400 });
    }

    // ── Insert valid rows ───────────────────────────────────────────────────
    const supabase = await createServerClient();
    const insertErrors: { index: number; message: string }[] = [];
    let inserted = 0;

    // Batch insert in chunks of 50
    for (let c = 0; c < validPayloads.length; c += 50) {
      const chunk = validPayloads.slice(c, c + 50);
      const { error } = await supabase.from("trips").insert(chunk as never[]);
      if (error) {
        // Record each row in this chunk as failed
        for (let j = c; j < c + chunk.length; j++) {
          insertErrors.push({ index: j, message: error.message });
        }
      } else {
        inserted += chunk.length;
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        total:    rawData.length - 1,
        valid:    validPayloads.length,
        inserted,
        failed:   errors.length + insertErrors.length,
      },
      validation_errors: errors,
      insert_errors: insertErrors,
      message: `تم استيراد ${inserted} رحلة بنجاح${errors.length ? ` · ${errors.length} صف يحتوي على أخطاء تم تخطيه` : ""}`,
    });

  } catch (err: unknown) {
    console.error("[trips/import]", err);
    return NextResponse.json({ success: false, error: (err as Error).message ?? "خطأ غير متوقع" }, { status: 500 });
  }
}
