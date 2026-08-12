# 🧠 Project Memory: Travel Platform Admin Portal

## 📌 ما هو المشروع؟

**اسم المشروع:** Travel Platform Admin Portal  
**الإصدار:** 1.0.0  
**النوع:** Next.js + React Admin Dashboard + Client Portal System  
**التكنولوجيا:** TypeScript, Tailwind CSS, Shadcn UI, Supabase (PostgreSQL)

### الهدف الأساسي:
نظام متكامل لإدارة حجوزات السفر والتأشيرات والفنادق والخدمات الإضافية. يتعامل مع:
- ✅ تسجيل المستخدمين والتوثيق (Event-Driven Registration)
- ✅ طلبات التأشيرات ورفع المستندات
- ✅ إنشاء العروض والأسعار (Quotations)
- ✅ إدارة الحجوزات والدفعيات
- ✅ لوحة تحكم الإدارة

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
1. **Event-Driven Registration System**
   - Signup → Auth User Creation → CRM Profile Provisioning
   - معالجة غير محظورة (Non-blocking)
   - Automatic Retry مع Exponential Backoff

2. **Database Schema**
   - جداول: `users`, `visa_applications`, `quotations`, `bookings`, `profiles`
   - جداول مساعدة: `event_log`, `sync_queue`, `system_logs`
   - JSONB fields للمستندات والعروض

3. **Core Features**
   - React components مع Shadcn UI
   - Form handling مع React Hook Form + Zod
   - API routes جاهزة للتكامل
   - Authentication مع Supabase

4. **Code Standards**
   - CRM-RULES.md معروّفة ومطبقة
   - تقسيم الوظائف (Divide & Conquer)
   - تتبع تدفق البيانات
   - استخدام اللماذا بدل الطريقة التقليدية

### 🚧 قيد التطوير:
- [ ] تكامل خدمات الدفع
- [ ] تكامل خدمات البريد الإلكتروني
- [ ] Bidirectional CRM Sync
- [ ] Real-time UI updates

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
