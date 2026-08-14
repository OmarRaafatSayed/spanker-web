# 🚀 تشغيل النظام - خطوات سريعة

**الوقت المتوقع:** 10 دقائق  
**الصعوبة:** سهل جداً

---

## 🌐 الروابط الأساسية

### الموقع (Website - العميل)
```
http://localhost:3000
```

### لوحة التحكم (Admin Dashboard)
```
http://localhost:3000/admin
```

### صفحة العملاء الجديدة
```
http://localhost:3000/admin/customers
```

---

## 📋 الخطوة 1: المتطلبات

### تأكد من وجود:
- ✅ Node.js 24+ مثبت
- ✅ npm أو yarn مثبت
- ✅ Supabase account (موجود في .env.local)
- ✅ Git (اختياري)

### التحقق من الإصدارات:
```bash
node --version    # يجب أن يكون >= 24
npm --version     # يجب أن يكون >= 10
```

---

## 🔧 الخطوة 2: تثبيت المكتبات

```bash
# في مجلد المشروع:
npm install

# أو باستخدام yarn:
yarn install

# انتظر حتى ينتهي (قد يستغرق 2-5 دقائق)
```

---

## 🗄️ الخطوة 3: تطبيق Database Migration

### في Supabase Dashboard:

1. **اذهب إلى:**
   ```
   https://app.supabase.com/
   ```

2. **اختر مشروعك:** `dnzvcvlebltbfcbcslkt`

3. **اذهب إلى:** SQL Editor

4. **اضغط:** New Query

5. **انسخ ولصق:**
   ```sql
   -- محتوى ملف:
   supabase/migrations/008_profile_sync_trigger.sql
   ```

6. **اضغط:** Run (أو Ctrl+Enter)

7. **انتظر:** "Query executed successfully"

**✅ تم!** قاعدة البيانات الآن محدثة

---

## ▶️ الخطوة 4: تشغيل Development Server

```bash
# في مجلد المشروع:
npm run dev

# يجب أن ترى مشابه لهذا:
# > spanker@1.0.0 dev
# > next dev
# 
# ▲ Next.js 16.2.1
# - Local: http://localhost:3000
# - Environments: .env.local
#
# ✓ Ready in 2.3s
```

**⏱️ انتظر حتى تقول: "Ready in X.Xs"**

---

## 🌐 الخطوة 5: اختبر الموقع

### افتح في المتصفح:

**أ) الصفحة الرئيسية:**
```
http://localhost:3000
```
✅ يجب أن ترى الصفحة الرئيسية

**ب) صفحة التسجيل:**
```
http://localhost:3000/signup
```
✅ يجب أن ترى نموذج التسجيل

**ج) لوحة التحكم:**
```
http://localhost:3000/admin
```
✅ يجب أن ترى Dashboard

**د) صفحة العملاء الجديدة:**
```
http://localhost:3000/admin/customers
```
✅ يجب أن ترى قائمة العملاء (قد تكون فارغة الآن)

---

## 👤 الخطوة 6: سجل عميل جديد

### في صفحة التسجيل:
```
http://localhost:3000/signup
```

**ادخل البيانات التالية:**
```
البريد الإلكتروني: test@example.com
الاسم الأول: Ahmed
الاسم الأخير: Ali
الهاتف: 01012345678
كلمة المرور: Test123!
```

**اضغط:** Register

**✅ تم!** العميل الجديد الآن في قاعدة البيانات

---

## 👀 الخطوة 7: شاهد العميل في Dashboard

### في صفحة العملاء:
```
http://localhost:3000/admin/customers
```

**يجب أن ترى:**
```
✅ قائمة العملاء
✅ العميل الذي سجلت للتو (Ahmed Ali)
✅ بحث وتصفية
✅ إحصائيات
```

**اضغط على:** "عرض التفاصيل"

**ستشاهد:**
```
✅ بيانات العميل الكاملة
✅ حالة المزامنة
✅ جميع الطلبات (إن وجدت)
✅ جميع المستندات (إن وجدت)
```

---

## 🔍 الخطوة 8: تحقق من قاعدة البيانات

### في Supabase SQL Editor:

```sql
-- 1. شاهد العملاء
SELECT * FROM profiles ORDER BY created_at DESC LIMIT 10;

-- 2. شاهد sync_queue
SELECT * FROM sync_queue WHERE status = 'pending' LIMIT 10;

-- 3. شاهد النسخة المزامنة
SELECT * FROM sync_queue WHERE status = 'completed' LIMIT 5;
```

---

## ⚡ الخطوة 9: اختبر API مباشرة

### في Terminal:

```bash
# جلب قائمة العملاء
curl http://localhost:3000/api/admin/customers

# يجب أن ترى JSON مشابه لهذا:
# {
#   "success": true,
#   "customers": [...],
#   "total": 1
# }
```

---

## 📊 النتائج المتوقعة

### بعد اتباع جميع الخطوات:

```
✅ الموقع يعمل على: http://localhost:3000
✅ لوحة التحكم تعمل على: http://localhost:3000/admin
✅ صفحة العملاء تعمل على: http://localhost:3000/admin/customers
✅ العملاء يظهرون تلقائياً
✅ قاعدة البيانات محدثة
✅ API endpoints تعمل
```

---

## 🆘 استكشاف الأخطاء

### المشكلة: "Cannot find module"
```
الحل:
1. حذف node_modules: rm -rf node_modules
2. حذف package-lock.json
3. إعادة التثبيت: npm install
```

### المشكلة: "Port 3000 is in use"
```
الحل:
1. قتل العملية: lsof -ti:3000 | xargs kill -9
2. أو شغّل على port مختلف: npm run dev -- -p 3001
```

### المشكلة: "Supabase connection error"
```
الحل:
1. تحقق من .env.local
2. تأكد من أن URLs صحيحة
3. تأكد من الاتصال بالإنترنت
```

### المشكلة: "لا توجد عملاء"
```
الحل:
1. تأكد من تشغيل Migration 008
2. سجل عميل جديد
3. شاهد قاعدة البيانات
```

---

## 📚 الملفات المرجعية

| الملف | الغرض |
|------|-------|
| `QUICKSTART_ADMIN_CUSTOMERS.md` | شروع سريع |
| `ADMIN_CUSTOMERS_README.md` | دليل عام |
| `FINAL_SUMMARY.md` | ملخص نهائي |

---

## ✅ قائمة التحقق

- [ ] npm install - نجح
- [ ] تشغيل Migration 008 - نجح
- [ ] npm run dev - نجح
- [ ] http://localhost:3000 - يعمل
- [ ] http://localhost:3000/admin/customers - يعمل
- [ ] تسجيل عميل جديد - نجح
- [ ] عرض العميل في Dashboard - نجح
- [ ] عرض تفاصيل العميل - نجح

---

## 🎯 الخطوة التالية

بعد تشغيل النظام بنجاح:

1. **اختبر جميع الصفحات**
2. **سجل عملاء جدد**
3. **شاهد البيانات في Dashboard**
4. **اقرأ الوثائق الأخرى**

---

## 📞 تحتاج إلى مساعدة؟

اقرأ هذه الملفات:

- `QUICKSTART_ADMIN_CUSTOMERS.md` - شروع سريع
- `MIGRATION_008_FIX.md` - حل المشاكل
- `ADMIN_CUSTOMERS_FEATURE.md` - توثيق شامل

---

## 🎉 النتيجة النهائية

بعد اتباع هذه الخطوات:

```
✅ النظام كامل يعمل
✅ الموقع يعمل
✅ لوحة التحكم تعمل
✅ العملاء يظهرون تلقائياً
✅ جاهز للتطوير والاختبار
```

---

**الحالة: 🟢 جاهز للتشغيل**

**الوقت المتوقع:** 10 دقائق  
**الصعوبة:** سهل جداً  
**النتيجة:** نظام عامل بكفاءة
