# 🎨 SPANKER BRAND SYSTEM - دستور الهوية البصرية

**النظام المرجعي الوحيد** لجميع العناصر المرئية في المشروع  
**يطبق على:** Website + Admin Dashboard + CRM Interface

---

## 🎯 القاعدة الذهبية

**أي عنصر مرئي جديد (مكون، صفحة، زر، أيقونة، لون) يجب أن يستمد خصائصه من هذا النظام حصراً.**

❌ **ممنوع منعاً باتاً:**
- كتابة ألوان Hex مباشرة في الكود
- استخدام كلاسات Tailwind للألوان المباشرة (bg-blue-500, text-green-600)
- رفع صور/لوجوهات خارج مجلد brand
- إنشاء متغيرات ألوان جديدة بدون تحديث النظام

✅ **المسموح فقط:**
- استيراد الألوان من `src/lib/brand/colors.ts`
- استيراد الأصول من `src/lib/brand/assets.ts`
- استخدام المتغيرات المعرفة في `globals.css`

---

## 🎨 الألوان الرسمية

### المصدر الوحيد: `src/lib/brand/colors.ts`

```typescript
// الاستخدام الصحيح
import { BRAND_COLORS, SEMANTIC_COLORS } from "@/lib/brand/colors";

// الألوان الأساسية
BRAND_COLORS.green   // #3D6833 - اللون الأساسي
BRAND_COLORS.yellow  // #FDD12A - اللون الثانوي
BRAND_COLORS.white   // #FBFDFD - الخلفيات
BRAND_COLORS.blue    // #2473BC - الروابط

// الاستخدام الدلالي
SEMANTIC_COLORS.primary              // #3D6833
SEMANTIC_COLORS.secondary            // #FDD12A
SEMANTIC_COLORS.buttonPrimary        // #3D6833
SEMANTIC_COLORS.buttonPrimaryText    // #FBFDFD
SEMANTIC_COLORS.navbarBg             // #3D6833
SEMANTIC_COLORS.navbarText           // #FBFDFD
```

### استخدام الألوان في المكونات

```tsx
// ✅ صحيح
<button 
  style={{ backgroundColor: SEMANTIC_COLORS.buttonPrimary }}
  className="text-white"
>
  تسجيل الدخول
</button>

// ❌ خطأ
<button className="bg-green-600 text-white">
  تسجيل الدخول
</button>

// ❌ خطأ
<button style={{ backgroundColor: "#3D6833" }}>
  تسجيل الدخول
</button>
```

---

## 🖼️ الأصول المرئية

### المصدر الوحيد: `src/lib/brand/assets.ts`

```typescript
import { BRAND_ASSETS } from "@/lib/brand/assets";

// استخدام اللوجوهات
BRAND_ASSETS.logo.full   // "/assets/brand/width-logo.png"
BRAND_ASSETS.logo.icon   // "/assets/brand/icone-LOGO.png"
```

### قواعد استخدام اللوجو

| المكان | اللوجو المستخدم | الحجم |
|--------|-----------------|-------|
| Navbar Desktop | `logo.full` | `h-10` (40px) |
| Navbar Mobile | `logo.icon` | `h-8` (32px) |
| Footer | `logo.full` | `h-12` (48px) |
| Favicon | `logo.icon` | `32x32` |
| Admin Sidebar | `logo.icon` | `h-8` (32px) |
| Email Templates | `logo.full` | max-width: 200px |

### أمثلة استخدام صحيحة

```tsx
// ✅ صحيح - Navbar
<img 
  src={BRAND_ASSETS.logo.full} 
  alt="Spanker Logo" 
  className="h-10 w-auto"
/>

// ✅ صحيح - Mobile Menu
<img 
  src={BRAND_ASSETS.logo.icon} 
  alt="Spanker" 
  className="h-8 w-auto"
/>

// ❌ خطأ - مسار ثابت
<img src="/assets/brand/width-logo.png" alt="Logo" />

// ❌ خطأ - استخدام لوجو من خارج النظام
<img src="/images/logo/some-logo.png" alt="Logo" />
```

---

## 📁 هيكل الملفات

```
src/lib/brand/
├── colors.ts       # الألوان الرسمية (المصدر الوحيد)
├── assets.ts       # مسارات الأصول المرئية
└── index.ts        # تصدير موحد

public/assets/brand/
├── width-logo.png  # اللوجو الكامل (للـ Navbar والـ Footer)
├── icone-LOGO.png  # أيقونة اللوجو (للـ Favicon والـ Mobile)
└── [patterns]/     # باترنات الخلفيات (إن وجدت)

src/app/globals.css
└── @theme inline   # متغيرات CSS للألوان
```

---

## 🔧 التكامل مع Tailwind

### ملف `globals.css`

```css
@theme inline {
  /* SPANKER BRAND COLORS */
  --color-brand-green: #3D6833;
  --color-brand-yellow: #FDD12A;
  --color-brand-white: #FBFDFD;
  --color-brand-blue: #2473BC;

  /* Semantic mappings */
  --color-primary: #3D6833;
  --color-secondary: #FDD12A;
  --color-background: #FBFDFD;
  --color-link: #2473BC;
}
```

### استخدام متغيرات CSS

```tsx
// ✅ صحيح - استخدام المتغيرات
<div className="bg-[var(--color-primary)] text-white">
  محتوى
</div>

// ✅ أفضل - استخدام الـ imports
<div 
  style={{ backgroundColor: BRAND_COLORS.green }}
  className="text-white"
>
  محتوى
</div>
```

---

## 📐 قواعد التصميم

### 1. الألوان الأساسية

| الاستخدام | اللون | Hex Code |
|-----------|-------|----------|
| أزرار رئيسية | Green | `#3D6833` |
| Navbar Background | Green | `#3D6833` |
| Primary Actions | Green | `#3D6833` |
| Highlights & Accents | Yellow | `#FDD12A` |
| Background | White | `#FBFDFD` |
| Links | Blue | `#2473BC` |

### 2. الأزرار

```tsx
// ✅ زر أساسي (Primary Button)
<Button
  style={{ backgroundColor: SEMANTIC_COLORS.buttonPrimary }}
  className="text-white font-semibold px-6 py-3"
>
  تسجيل الدخول
</Button>

// ✅ زر ثانوي (Secondary Button)
<Button
  style={{ 
    backgroundColor: SEMANTIC_COLORS.buttonSecondary,
    color: SEMANTIC_COLORS.buttonSecondaryText
  }}
  className="font-semibold px-6 py-3"
>
  عرض التفاصيل
</Button>
```

### 3. الـ Navbar

```tsx
// ✅ Navbar بالهوية الصحيحة
<header
  style={{ backgroundColor: SEMANTIC_COLORS.navbarBg }}
  className="fixed top-0 w-full z-50"
>
  <nav className="flex items-center justify-between px-6">
    <img 
      src={BRAND_ASSETS.logo.full}
      alt="Spanker"
      className="h-10"
    />
    <div className="flex gap-4 items-center text-white">
      {/* Navigation items */}
    </div>
  </nav>
</header>
```

---

## ✅ Checklist قبل أي Commit

- [ ] جميع الألوان مستوردة من `src/lib/brand/colors.ts`
- [ ] جميع الصور من `public/assets/brand/`
- [ ] لا توجد ألوان Hex مباشرة في الكود
- [ ] لا توجد كلاسات Tailwind للألوان المباشرة
- [ ] اللوجوهات تستخدم `BRAND_ASSETS`
- [ ] الأزرار تستخدم `SEMANTIC_COLORS`

---

## 🚨 عقوبات المخالفة

عند مخالفة هذا النظام:
1. ❌ رفض الـ Pull Request
2. ❌ طلب Refactor فوري
3. ❌ تحديث التوثيق

**الهدف:** ضمان **توحيد كامل** للهوية البصرية عبر المشروع بأكمله.

---

## 📝 التحديثات

### إضافة لون جديد

1. أضف اللون في `src/lib/brand/colors.ts`
2. أضف المتغير في `globals.css` إذا لزم
3. حدّث `design-tokens.ts` إذا لزم
4. وثّق الاستخدام في هذا الملف
5. اختبر على جميع المكونات

### إضافة أصل مرئي جديد

1. رفع الملف إلى `public/assets/brand/`
2. تسجيله في `src/lib/brand/assets.ts`
3. توثيق الاستخدام الصحيح في هذا الملف

---

**آخر تحديث:** 2026-08-13  
**النسخة:** 1.0.0  
**الحالة:** مُفعّل ✅
