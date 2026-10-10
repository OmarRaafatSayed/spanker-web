# ✈️ Real Google Flights Integration

## Overview

هذا المشروع يستخدم **gfly** - أداة Python مجانية ومفتوحة المصدر لجلب بيانات حقيقية من Google Flights بدون API keys أو تسجيل.

## 🎯 المتطلبات

### ما تم تحقيقه:
- ✅ بيانات حقيقية 100% من Google Flights
- ✅ مجاني تماماً - بدون API keys
- ✅ بدون تسجيل أو اشتراكات
- ✅ أسعار حقيقية تطابق Google Flights
- ✅ بيانات مفصلة: شركات الطيران، المدة، التوقفات، الانبعاثات
- ✅ مصدر مفتوح (MIT License)

## 🛠️ التقنية المستخدمة

### gfly CLI Tool
- **GitHub**: https://github.com/rnwolfe/gfly
- **المطور**: Ryan Wolfe
- **النوع**: Python CLI tool
- **الترخيص**: MIT / Apache-2.0
- **آخر إصدار**: v0.3.0 (2027)

### كيف يعمل:
1. gfly يستخدم **reverse-engineered Google Flights API**
2. يرسل طلبات مباشرة إلى Google Flights endpoint
3. يستخرج البيانات من JSON response
4. لا يحتاج إلى browser automation أو scraping
5. أسرع وأكثر استقراراً من Selenium/Playwright

### المميزات:
- **JSON output** ثابت ومُوثّق
- **Exit codes** واضحة للأخطاء
- **Rate limiting** مدمج للحماية من الحظر
- **Schema versioning** لسهولة الصيانة
- **Politeness throttle** عبر العمليات المختلفة

## 📦 التثبيت

### المتطلبات:
- Python >= 3.10
- pip أو pipx

### الخطوات:

```bash
# 1. تثبيت gfly
pip install gfly

# 2. اختبار التثبيت
gfly --version

# 3. اختبار بحث بسيط
gfly search CAI DXB --depart 2026-10-20 --json
```

## 🚀 الاستخدام

### 1. API Endpoint

```typescript
POST /api/v1/flights/search

Body:
{
  "origin": "CAI",
  "destination": "DXB", 
  "departureDate": "2026-10-20",
  "returnDate": "2026-10-25",  // optional
  "passengers": 1,
  "cabinClass": "economy",
  "stops": "any"
}

Response:
{
  "success": true,
  "data": {
    "flights": [...],
    "count": 8,
    "currency": "USD"
  }
}
```

### 2. Test Page

افتح المتصفح على:
```
http://localhost:3000/test-flights
```

### 3. Direct CLI Usage

```bash
# بحث ذهاب فقط
gfly search CAI DXB --depart 2026-10-20 --json

# بحث ذهاب وعودة
gfly search CAI DXB --depart 2026-10-20 --return 2026-10-25 --json

# تحديد الدرجة
gfly search CAI DXB --depart 2026-10-20 --cabin business --json

# رحلات مباشرة فقط
gfly search CAI DXB --depart 2026-10-20 --stops nonstop --json

# بحث عن أرخص التواريخ
gfly dates CAI DXB --from 2026-10-01 --to 2026-10-31 --json
```

## 📁 ملفات المشروع

```
src/
├── lib/flight-search/
│   └── gfly.ts                    # Wrapper للتكامل مع gfly
├── app/api/v1/flights/search/
│   └── route.ts                   # API endpoint
├── components/flights/
│   ├── FlightSearchForm.tsx       # نموذج البحث
│   └── FlightResults.tsx          # عرض النتائج
├── app/test-flights/
│   └── page.tsx                   # صفحة اختبار
```

## 🔧 الإعدادات

### Rate Limiting
gfly يحتوي على throttle مدمج (12 ثانية بين الطلبات). للتحكم:

```typescript
// في gfly.ts
args.push("--wait");              // انتظر إذا كان هناك rate limit
args.push("--min-interval", "15"); // 15 ثانية بين الطلبات
```

### Timeout
```typescript
// في gfly.ts
const { stdout, stderr } = await execAsync(command, {
  timeout: 60000,     // 60 ثانية
  maxBuffer: 1024 * 1024 * 10, // 10MB
});
```

## 📊 هيكل البيانات

### Flight Object
```typescript
interface GflyFlight {
  price: number;
  currency: string;
  isBest: boolean;
  stops: number;
  durationMinutes: number;
  departure: string;      // ISO 8601
  arrival: string;        // ISO 8601
  origin: string;         // IATA code
  destination: string;    // IATA code
  airlines: string[];
  flightNumbers: string[];
  layovers: Array<{
    airport: string;
    minutes: number;
  }>;
  co2Grams: number;
  co2DeltaPct: number;
  bookingToken: string | null;
}
```

## 🎨 UI Features

- ✅ عرض الأسعار الحقيقية
- ✅ تفاصيل مواعيد الإقلاع والهبوط
- ✅ مدة الرحلة بالساعات والدقائق
- ✅ معلومات التوقفات والمطارات
- ✅ انبعاثات CO₂ ونسبة الفرق عن المتوسط
- ✅ علامة "Best Value" للأفضل سعراً
- ✅ رابط مباشر للحجز على Google Flights
- ✅ تصميم responsive وجميل

## ⚠️ Limitations & Notes

### معلوم:
1. **Rate Limiting**: 
   - لا تستخدم بكثافة عالية (commercial scale)
   - gfly يطبق throttle تلقائياً
   - استخدم `--wait` flag للأمان

2. **API Changes**:
   - Google قد يغير API structure
   - gfly يُحدّث بانتظام
   - pin النسخة في production: `gfly==0.3.0`

3. **Exit Codes**:
   - Code 20: BLOCKED (CAPTCHA/soft-block)
   - Code 21: SCHEMA_DRIFT (API changed)
   - Code 7: RATE_LIMITED

### حلول:
- إذا واجهت BLOCKED → استخدم proxy أو انتظر
- إذا واجهت SCHEMA_DRIFT → حدّث gfly: `pip install --upgrade gfly`
- للاستخدام التجاري → فكر في SerpAPI backend

## 🔒 Terms of Service

### مسموح:
- ✅ بحث شخصي
- ✅ بحث لعملاء محددين
- ✅ أعداد معقولة من الطلبات
- ✅ استخدام في مشاريع خاصة

### غير مسموح:
- ❌ استخدام تجاري واسع النطاق
- ❌ إعادة بيع البيانات
- ❌ Scraping مكثف بدون احترام rate limits
- ❌ تجاوز CAPTCHA بشكل تلقائي

## 🆚 المقارنة مع الحلول الأخرى

| الحل | مجاني | حقيقي | تسجيل | سهولة | استقرار |
|------|-------|-------|-------|-------|---------|
| **gfly** | ✅ | ✅ | ❌ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Amadeus | ❌ | ✅ | ✅ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Playwright | ✅ | ⚠️ | ❌ | ⭐⭐ | ⭐⭐ |
| fast-flights | ✅ | ❌ | ❌ | ⭐⭐⭐ | ⭐ |
| Duffel | ❌ | ✅ | ✅ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## 📚 المراجع

- gfly GitHub: https://github.com/rnwolfe/gfly
- gfly Documentation: https://gfly.sh
- fast-flights (Backend): https://github.com/punitarani/fast-flights
- Agent CLI Guidelines: https://agent-cli.dev

## 🐛 Troubleshooting

### خطأ: "gfly command not found"
```bash
# تأكد من التثبيت
pip install gfly

# تحقق من PATH
which gfly  # Linux/Mac
where gfly  # Windows
```

### خطأ: "protobuf version mismatch"
```bash
# حدّث protobuf
pip install --upgrade protobuf
```

### خطأ: "BLOCKED" (Code 20)
```bash
# استخدم proxy
export HTTPS_PROXY=http://proxy:8080
gfly search ...

# أو زد الوقت بين الطلبات
gfly search ... --min-interval 20
```

### خطأ: "Timeout"
```typescript
// زد الـ timeout في gfly.ts
timeout: 120000  // 2 دقيقة بدلاً من 60 ثانية
```

## 🎉 الخلاصة

تم تكامل بيانات حقيقية 100% من Google Flights بنجاح باستخدام:
- ✅ أداة مجانية ومفتوحة المصدر (gfly)
- ✅ بدون API keys أو تسجيل
- ✅ بيانات دقيقة تطابق Google Flights
- ✅ سهل التثبيت والصيانة
- ✅ مصمم للـ agents و automation
- ✅ مستقر ومُوثّق جيداً

---

**نوع**: Ryan Wolfe و مساهمي gfly لإنشاء هذه الأداة الرائعة! 🙏
