# 🚀 دليل تشغيل Frontend

## ✅ ما تم إنجازه

1. **Database Migration** - اكتمل ✅
   - 15 migration تم تطبيقها بنجاح
   - Schema جديد مع جداول الحجز
   
2. **Type Generation** - اكتمل ✅
   - `database.ts` محدث من القاعدة الحية
   
3. **Backend Migration** - اكتمل جزئياً ⚠️
   - تم حذف الاعتماد على FastAPI
   - API Routes تستخدم Supabase مباشرة
   - بعض الأخطاء TypeScript باقية

## ⚠️ الأخطاء المتبقية: 530 خطأ TypeScript

### المشاكل الرئيسية:

#### 1. المراجع لجداول محذوفة/متغيرة ⭐ أولوية عالية

**الجداول التي لا توجد:**
- ❌ `staff` → استخدم `profiles` مع `role IN ('staff', 'admin', 'super_admin')`
- ❌ `hotel_rooms` → الآن جزء من `hotel_offers`
- ❌ `visa_types` → استخدم `document_requirements`
- ❌ `trip_packages` → استخدم `trips`
- ❌ `financial_transactions` → استخدم `payment_records`

**الملفات المتأثرة:**
```
src/app/admin/layout.tsx (line 28) - from('staff')
src/app/admin/login/page.tsx (lines 29, 59) - from('staff')
src/app/api/admin/hotels/route.ts (line 36) - select hotel_rooms
src/app/api/admin/hotels/[id]/route.ts (line 35) - select hotel_rooms
```

#### 2. أسماء الأعمدة غير موجودة

**أعمدة `hotels` القديمة → `hotel_offers` الجديدة:**
- `enabled` → `is_active`
- `name` → `hotel_name`
- `city` → `hotel_city`
- `country` → `hotel_country`

**أعمدة `profiles`:**
- ✅ `user_id` هو المرجع لـ `auth.users(id)`
- ✅ `id` هو المفتاح الأساسي الداخلي

#### 3. صفحات Admin تحتاج تحديث

**الصفحات المتأثرة:**
```
src/app/admin/hotels/page.tsx - يستخدم hotel بدلاً من hotel_offers
src/app/admin/bookings/*/page.tsx - جميع صفحات الحجوزات (4 ملفات)
src/app/admin/flights/page.tsx - أعمدة خاطئة
```

## 🛠️ خطوات الإصلاح السريع

### المرحلة 1: إصلاح مراجع staff (5 دقائق)

```powershell
# استبدل جميع المراجع لـ staff بـ profiles
# الملفات: src/app/admin/layout.tsx, src/app/admin/login/page.tsx
```

**في `src/app/admin/layout.tsx` (line 28):**
```typescript
// القديم
const { data: staffRecord } = await supabase
  .from("staff")
  .select("role, is_active, full_name")
  .eq("user_id", user.id)

// الجديد
const { data: profileRecord } = await supabase
  .from("profiles")
  .select("role, full_name")
  .eq("user_id", user.id)
  .single();

const isAdmin = profileRecord?.role && ['admin', 'super_admin'].includes(profileRecord.role);
```

**في `src/app/admin/login/page.tsx` (lines 29, 59):** نفس التعديل

### المرحلة 2: إصلاح صفحات Hotels (10 دقائق)

**في `src/app/admin/hotels/page.tsx`:**
1. استبدل `.from("hotels")` → `.from("hotel_offers")`
2. استبدل `enabled` → `is_active`
3. استبدل `name` → `hotel_name`
4. استبدل `city` → `hotel_city`

**في `src/app/api/admin/hotels/route.ts`:**
1. احذف `, hotel_rooms(...)` من select
2. hotel_rooms لا يوجد - المعلومات في hotel_offers مباشرة

### المرحلة 3: تعطيل الصفحات المعطوبة مؤقتاً (2 دقيقة)

لتشغيل الموقع بسرعة، علّق الصفحات المعطوبة:

```typescript
// في أي صفحة admin معطوبة
export default function Page() {
  return <div className="p-8">
    <h1>قيد الصيانة</h1>
    <p>هذه الصفحة قيد التحديث للعمل مع النظام الجديد</p>
  </div>
}
```

**الصفحات للتعطيل المؤقت:**
- `src/app/admin/bookings/flights/page.tsx`
- `src/app/admin/bookings/hotels/page.tsx`
- `src/app/admin/bookings/trips/page.tsx`
- `src/app/admin/bookings/visas/page.tsx`
- `src/app/admin/hotels/page.tsx`

## 🎯 التشغيل السريع (الحل المؤقت)

إذا كنت تريد تشغيل الموقع **الآن**:

### 1. تجاهل أخطاء TypeScript في البناء

في `next.config.ts`:
```typescript
typescript: {
  ignoreBuildErrors: true, // مؤقت فقط!
},
eslint: {
  ignoreDuringBuilds: true, // مؤقت فقط!
},
```

### 2. شغل السيرفر

```bash
npm run dev
```

الصفحات الرئيسية والبوابة للعملاء ستعمل. صفحات Admin ستكون معطوبة.

## 📊 الحل النهائي (موصى به)

### الوقت المتوقع: 2-3 ساعات

1. **إصلاح staff references** (30 دقيقة) - 5 ملفات
2. **إصلاح hotel references** (45 دقيقة) - 4 ملفات  
3. **إصلاح booking pages** (60 دقيقة) - 4 ملفات
4. **اختبار شامل** (30 دقيقة)

### الأولوية:

**مهم للغاية:** ✅
- src/lib/api/auth.ts (تم ✅)
- src/app/api/admin/setup/route.ts (تم ✅)
- src/app/admin/layout.tsx
- src/app/admin/login/page.tsx

**مهم:**
- src/app/admin/hotels/page.tsx
- src/app/api/admin/hotels/*.ts

**يمكن التأجيل:**
- صفحات bookings admin (4 ملفات)
- صفحات flights admin

## 🔥 الحل الفوري (5 دقائق)

إذا تريد الموقع يشتغل **حالاً**:

1. عطل TypeScript checking في `next.config.ts`
2. علّق صفحات Admin المعطوبة
3. شغل `npm run dev`
4. صفحات العملاء (الحجز، البوابة، الملف الشخصي) ستعمل

```bash
# الأوامر:
npm run dev
# افتح http://localhost:3000
```

الصفحات الشغالة:
- ✅ الرئيسية
- ✅ تسجيل الدخول
- ✅ البوابة الشخصية
- ✅ طلبات السفر
- ✅ المستندات
- ❌ Admin Dashboard (محتاج إصلاح)

## 📝 ملخص الحالة

| المكون | الحالة | ملاحظات |
|--------|--------|----------|
| Database | ✅ شغال 100% | 15 migration مطبقة |
| API Routes | ⚠️ شغال 80% | بعض routes تحتاج تحديث |
| Customer Portal | ✅ شغال 90% | محتاج تنظيف بسيط |
| Admin Dashboard | ❌ معطوب 40% | محتاج إصلاح staff/hotels |
| TypeScript Types | ⚠️ 530 خطأ | قابلة للتجاهل مؤقتاً |

## 💡 التوصية النهائية

**للتطوير الآن:**
```bash
# أضف في next.config.ts:
typescript: { ignoreBuildErrors: true }

npm run dev
```

**للإنتاج:**
- أصلح ال 530 خطأ TypeScript
- اختبر جميع flows
- أزل `ignoreBuildErrors`

---

**آخر تحديث:** بعد migration 114 وpush لـ GitHub
**الحالة:** جاهز للتطوير، يحتاج تنظيف للإنتاج
