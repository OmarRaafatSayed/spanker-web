# 🧠 Project Memory: Travel Platform Admin Portal

## 📌 ما هو المشروع؟

**اسم المشروع:** Travel Platform Admin Portal  
**الإصدار:** 1.0.0  
**النوع:** 🎯 **CRM متكامل** - Next.js + React Admin Dashboard + Client Portal System + CRM Sync Engine  
**التكنولوجيا:** TypeScript, Tailwind CSS, Shadcn UI, Supabase (PostgreSQL)

### 🎯 الهدف الأساسي:
**نظام CRM متكامل لإدارة حجوزات السفر والتأشيرات والفنادق والخدمات الإضافية.**

هذا ليس موقع عادي - ده **نظام ثلاثي الطبقات**:
1. **Website (العميل)** - حيث يسجل العملاء ويتابعون طلباتهم
2. **Admin Dashboard (الإدارة)** - حيث يدير الموظفون والطلبات والمستندات والعملاء
3. **CRM Engine (الوسيط الذكي)** - الذي يربط كل شيء ويضمن المزامنة التلقائية بين النظامين

يتعامل مع:
- ✅ تسجيل المستخدمين والتوثيق (Event-Driven Registration)
- ✅ طلبات التأشيرات ورفع المستندات
- ✅ إنشاء العروض والأسعار (Quotations)
- ✅ إدارة الحجوزات والدفعيات
- ✅ لوحة تحكم الإدارة الكاملة
- ✅ **مزامنة تلقائية بين جميع الأنظمة**

---

## 🎨 BRAND SYSTEM - نظام الهوية البصرية

**المصدر الوحيد لجميع الألوان والأصول المرئية:**
- `src/lib/brand/colors.ts` - الألوان الرسمية
- `src/lib/brand/assets.ts` - مسارات الشعارات
- `public/assets/brand/` - مجلد الأصول المرئية

**القاعدة الأساسية:**
❌ **ممنوع:** كتابة Hex codes أو كلاسات Tailwind للألوان مباشرة  
✅ **مسموح فقط:** استيراد من `src/lib/brand/`

**للتفاصيل الكاملة:** اقرأ `docs/BRAND_SYSTEM.md`

---

## 🏗️ هيكل النظام الثلاثي (Triple-Architecture)

**أهم نقطة:** المشروع ده مش مجرد موقع، ده **3 أنظمة في كود واحد**، ولازم يتم التعامل مع كل واحد بحدوده الخاصة:

### 1️⃣ الموقع العام (Client Portal / Website)
```
📍 المسار: src/app/(public) + src/components/public/
```

**الوظيفة:**
- عرض الرحلات والعروض
- تسجيل المستخدمين الجدد
- رفع المستندات
- متابعة حالة الطلب

**القاعدة الذهبية:**
- ❌ **لا يتصل مباشرة** بجداول CRM الحساسة
- ✅ يعتمد على **API الآمن** والـ **Event System**
- ✅ قراءة فقط من جداول العملاء الأساسية
- ⚠️ أي تعديل هنا يجب ألا يكسر الـ Admin Dashboard

**الملفات المهمة:**
- `src/app/(public)/signup/` — صفحة التسجيل
- `src/app/(public)/dashboard/` — لوحة العميل
- `src/components/public/` — Public UI components

---

### 2️⃣ لوحة تحكم الإدارة (Admin Dashboard)
```
📍 المسار: src/app/admin/ + src/modules/admin/
```

**الوظيفة:**
- إدارة الطلبات والحجوزات
- تغيير حالات التأشيرات
- الموافقة على المستندات
- إنشاء العروض والفواتير
- تقارير وإحصائيات

**القاعدة الذهبية:**
- ✅ له **صلاحيات كاملة** (Full Access)
- ✅ يتصل مباشرة بجداول `profiles`, `bookings`, `quotations`
- ✅ يمكنه تعديل حالات الطلبات مباشرة
- ⚠️ أي تعديل هنا يجب ألا يكسر الـ Website أو الـ Event System

**الملفات المهمة:**
- `src/app/admin/` — Admin routes
- `src/modules/admin/` — Admin business logic
- `src/app/api/admin/` — Admin API endpoints

---

### 3️⃣ نظام الـ CRM الداخلي (Internal CRM Logic)
```
📍 المسار: src/lib/services/ + src/lib/sync/
```

**الوظيفة:**
- **المحرك اللي بيربط الموقع بالداشبورد** وقاعدة البيانات
- معالجة الأحداث (Event Processing)
- Sync & Provisioning للبيانات
- Retry logic للعمليات الفاشلة
- تتبع تدفق البيانات من Website → Admin

**القاعدة الذهبية:**
- 🎯 هو "**الوسيط الأمين**" بين النظام والبيانات
- ✅ أي تعديل هنا لازم يراعي **إنه ميوقعش الـ Website**
- ✅ أي تعديل هنا لازم يراعي **إنه ميوقعش الـ Dashboard**
- ⚠️ إذا كسرت هنا، النظام كله هيكسر

**الملفات المهمة:**
- `src/lib/services/registration-event-dispatcher.ts` — معالج الأحداث
- `src/lib/services/sync-queue-processor.ts` — معالج الـ Sync
- `src/lib/auth-integration.ts` — تنسيق الـ Signup
- `src/lib/sync/` — منطق الـ Sync

---

### 📊 الفصل بين الأنظمة الثلاثة:

```
┌─────────────────────────────────────────────────────────────┐
│                    Website (العميل)                        │
│   Reads: profiles, visa_status                             │
│   Writes: event_log (via API) ✅                           │
│   Direct DB: NO ❌                                         │
└────────────────┬──────────────────────────────────────────┘
                 │ API Call
                 ↓
┌─────────────────────────────────────────────────────────────┐
│              CRM System (الوسيط الأمين)                     │
│   - Event Processing                                        │
│   - Data Sync                                               │
│   - Retry Logic                                             │
│   - Validation                                              │
└────────────────┬──────────────────────────────────────────┘
                 │ Sync/Provisioning
                 ↓
┌─────────────────────────────────────────────────────────────┐
│            Admin Dashboard (الإدارة)                        │
│   Reads: ALL tables ✅                                      │
│   Writes: ALL tables ✅                                     │
│   Direct DB: YES ✅                                         │
└─────────────────────────────────────────────────────────────┘
```

---

### 🔄 مثال عملي: عملية Signup كاملة

```
1. العميل يدخل البيانات على Website
   ↓ (src/app/(public)/signup)
   
2. Website يرسل API request
   ↓ (src/app/api/auth/signup)
   
3. CRM System يستقبل الطلب
   ↓ (src/lib/services/registration-event-dispatcher.ts)
   
4. CRM ينشئ الحدث في event_log
   ↓ 
   
5. Background Sync يعالجها
   ↓ (src/lib/services/sync-queue-processor.ts)
   
6. Admin Dashboard ترى البيانات الجديدة
   ↓ (src/app/admin/customers)
   
7. Admin يوافق ويغير الحالة
   ↓
   
8. Website يشوف التحديث
```

---

## ⚠️ القاعدة الذهبية عند التطوير:

| العملية | Website | CRM System | Admin |
|--------|---------|-----------|-------|
| **إضافة Feature جديد** | ✅ OK | ✅ SAFER | ✅ OK |
| **تعديل جدول البيانات** | ❌ NO | ✅ YES | ✅ YES |
| **تغيير Event Logic** | ❌ NO | ✅ CRITICAL | ⚠️ Notify |
| **تعديل API** | ✅ OK | ✅ YES | ⚠️ Test |
| **Refactor Code** | ✅ OK | ✅ TEST FIRST | ✅ OK |

---

## 📊 وين وصلنا الآن؟

### ✅ المكتمل:
1. **Event-Driven Registration System** ⚡
   - Signup → Auth User Creation → CRM Profile Queuing → Background Sync
   - معالجة غير محظورة (Non-blocking) مع sync_queue
   - Automatic Retry مع Exponential Backoff
   - **✨ جديد:** تلقائياً يتم إضافة العملاء الجدد إلى sync_queue عند التسجيل

2. **Database Schema** 📊
   - جداول: `users`, `visa_applications`, `quotations`, `bookings`, `profiles`
   - جداول مساعدة: `event_log`, `sync_queue`, `system_logs`
   - JSONB fields للمستندات والعروض
   - **✨ جديد:** Triggers على profiles و customer_documents لتسجيل المزامنة تلقائياً

3. **Admin Dashboard** 🎛️
   - صفحة `/admin` - لوحة التحكم الرئيسية
   - صفحة `/admin/customers` - عرض جميع العملاء بالإحصائيات والبحث
   - صفحة `/admin/customers/[id]` - تفاصيل العميل مع الطلبات والمستندات
   - API endpoints لجلب بيانات العملاء والمستندات والطلبات
   - **✨ جديد:** ربط كامل بين المستندات وبيانات العميل وتفاصيله

4. **Sync System** 🔄
   - sync-queue-processor يعالج المزامنة في الخلفية
   - دعم retry logic مع exponential backoff
   - تسجيل تلقائي للعملاء الجدد في الـ queue
   - **✨ جديد:** Triggers تضمن عدم فقدان أي بيانات جديدة

5. **Core Features** ✨
   - React components مع Shadcn UI
   - Form handling مع React Hook Form + Zod
   - API routes جاهزة للتكامل
   - Authentication مع Supabase
   - **✨ جديد:** تصميم واجهة admin متقدمة مع البحث والتصفية والإحصائيات

6. **Code Standards** 📋
   - CRM-RULES.md معروّفة ومطبقة
   - تقسيم الوظائف (Divide & Conquer)
   - تتبع تدفق البيانات
   - استخدام اللماذا بدل الطريقة التقليدية
   - **✨ جديد:** توثيق واضح أن النظام CRM متكامل (Website + Admin + CRM Sync)

### 🚧 قيد التطوير:
- [ ] تكامل خدمات الدفع
- [ ] تكامل خدمات البريد الإلكتروني
- [ ] Bidirectional CRM Sync المتقدمة
- [ ] Real-time UI updates مع WebSockets
- [ ] Dashboard تقارير متقدمة

---

## 🔧 المشاكل التي تم حلها:

### ✅ المشكلة 1: صفحة admin/customers مفقودة
**الحل:** 
- ✨ إنشاء صفحة `/admin/customers` - عرض جميع العملاء مع بيانات حقيقية من قاعدة البيانات
- ✨ إنشاء صفحة `/admin/customers/[id]` - تفاصيل كاملة للعميل مع جميع طلباته ومستنداته
- ✨ API endpoints جديدة: `/api/admin/customers` و `/api/admin/customers/[id]` و `/api/admin/customers/[id]/travel-requests` و `/api/admin/customers/[id]/documents`
- ✨ واجهة بحث متقدمة مع تصفية حسب الدور والإحصائيات

### ✅ المشكلة 2: المستندات المفقودة والغير مرتبطة
**الحل:**
- ✨ ربط كامل بين جدول `customer_documents` وتفاصيل العميل في Admin Dashboard
- ✨ عرض جميع المستندات المرفوعة في صفحة تفاصيل العميل مع حالتها وتاريخ الرفع
- ✨ إمكانية تحميل المستندات مباشرة من الواجهة الإدارية
- ✨ حالات المستندات واضحة: مرفوع، قيد المراجعة، موافق عليه، مرفوض، منتهي الصلاحية

### ✅ المشكلة 3: العملاء الجدد لا يظهرون في النظام (مشكلة sync-queue-processor)
**الحل:**
- ✨ تم إضافة **Triggers تلقائية** في قاعدة البيانات (Migration 008)
- ✨ عند إنشاء profile جديد → يُضاف تلقائياً إلى `sync_queue` للمعالجة
- ✨ تعديل `registration-event-dispatcher.ts` ليضع الـ profile في الـ queue بدل المعالجة المباشرة
- ✨ تحسين `sync-queue-processor.ts` لمعالجة profiles بشكل صحيح مع التسجيل المفصل
- ✨ الآن: العميل يتسجل → يُضاف للـ queue → يُمعالج في الخلفية → يظهر في Admin Dashboard تلقائياً

### ✅ المشكلة 4: النظام غير واضح أنه CRM متكامل
**الحل:**
- ✨ تحديث `MEMORY.md` لتوضيح الهيكل الثلاثي (Website + Admin + CRM Sync Engine)
- ✨ توثيق واضح أن جميع الأنظمة الثلاثة متصلة ومتزامنة تلقائياً
- ✨ إضافة comments وتوثيق في الأكواد الجديدة
- ✨ شرح العمليات: العميل يسجل → يظهر في Admin → يتم معالجته → يتم المزامنة

---

## 🔥 أهم الملفات اللي بنعدل فيها دايماً:

### 📂 مجلد `src/` (الكود الرئيسي):

| المسار | الوصف | التحديث الأخير |
|--------|-------|--------------|
| `src/app/` | Next.js routes & pages | صفحات الـ Admin Portal |
| `src/components/` | React components | Shadcn UI components |
| `src/lib/` | Utility functions & helpers | Event system, Auth integration |
| `src/lib/auth-integration.ts` | Signup orchestration | Event dispatcher setup |
| `src/lib/hooks/useRegistrationEvents.ts` | React hook للأحداث | State management |
| `src/lib/services/registration-event-dispatcher.ts` | Event handlers | Signup handlers |
| `src/lib/services/sync-queue-processor.ts` | Background sync | CRM provisioning |
| `src/app/api/sync/route.ts` | Cron endpoint | Background processing |
| `src/modules/` | Feature modules | Business logic |
| `src/types/` | TypeScript definitions | Type safety |

### 📂 مجلد `supabase/` (قاعدة البيانات):

| المسار | الوصف |
|--------|-------|
| `supabase/migrations/` | Database migrations |
| `supabase/migrations/003_event_system_and_sync.sql` | Event system schema |

### 📂 مجلد `docs/` (التوثيق):

| الملف | الغرض |
|------|-------|
| `DEVELOPER_QUICK_START.md` | دليل البدء السريع للمطورين |
| `CRM-RULES.MD` | معايير الكود والتقسيم |
| `CRM_DATA_PIPELINE_DOCUMENTATION.md` | توثيق تدفق البيانات |
| `MEMORY.md` | هذا الملف (ذاكرة المشروع) |

---

## ⚙️ قبل ما تبدأ أي تطوير جديد:

1. **اقرا:** `docs/CRM-RULES.MD` وطبق معاييرها
2. **اتفقد:** `src/lib/` لتجنب تكرار الوظائف
3. **اكتب:** أي كود جديد في `src/`
4. **ضع:** أي توثيق جديد في `docs/`
5. **اختبر:** باستخدام الـ test endpoints في الـ API

---

## 🔧 الأدوات:

- **Framework:** Next.js 16.2.1
- **Language:** TypeScript 5
- **UI Library:** Shadcn UI + Tailwind CSS 4
- **Database:** Supabase (PostgreSQL)
- **State Management:** Zustand
- **Form Handling:** React Hook Form + Zod
- **Data Fetching:** TanStack React Query
- **Styling:** Tailwind CSS + CVA
- **Animation:** Framer Motion

---

## 📞 التواصل السريع:

- **مشاكل في الـ Setup؟** → اقرا `DEVELOPER_QUICK_START.md`
- **بتكتب كود جديد؟** → اتبع `CRM-RULES.MD`
- **في أخطاء في الـ Sync؟** → اتفقد `DEVELOPER_QUICK_START.md` section "Troubleshooting"

---

**آخر تحديث:** 2026-08-12  
**نسخة المشروع:** 1.0.0  
**الحالة:** في التطوير النشط
